# Modo Anônimo + Contas Opcionais — Plano de Implementação

**Goal:** Anônimo por padrão (nada toca o servidor), conta opcional (username+PIN) com dados isolados por usuário.

**Architecture:** Duas camadas paralelas por trás de uma fachada única no cliente (`$lib/client/dados.ts`): autenticado usa as rotas de API existentes (agora exigindo sessão + escopadas por `usuario_id`); anônimo roda 100% no navegador reaproveitando os módulos puros já existentes (`mermaid.ts`) mais um novo `cardinalidade.ts` extraído do repository do servidor.

**Tech Stack:** Igual ao já usado — SvelteKit, better-sqlite3, Zod, `node:crypto` (scrypt, sem dependência nova).

**Execução:** Inline, em etapas, seguindo o padrão já estabelecido nesta sessão (implementação direta + checkpoint de aprovação ao final de cada etapa) — sem dispatch de subagentes, já que o próprio agente já tem todo o contexto do projeto carregado.

## Global Constraints

- Nunca commitar credenciais (CLAUDE.md).
- Commit sempre no `main` (CLAUDE.md).
- Priorizar simplicidade/tamanho do Docker (CLAUDE.md) — sem dependências novas além do já instalado.
- Segurança desde o início (CLAUDE.md) — PIN hasheado (scrypt+salt), rate limit de tentativas, sessão via cookie httpOnly/secure.
- Linguagem ubíqua em português nos nomes de campo (ADR-0007).

---

## Etapa 1 — Fundação de autenticação (servidor)

**Arquivos:**

- Modificar: `src/lib/server/db/schema.sql` — tabelas `usuarios`, `sessoes`; colunas `usuario_id` (nullable) em `registros` e `agentes`.
- Criar: `src/lib/server/auth.ts` — `gerarSaltHex(): string`, `hashPin(pin: string, saltHex: string): string` (scrypt sync, hex), `verificarPin(pin: string, saltHex: string, hashHex: string): boolean`, `gerarTokenSessao(): string` (32 bytes random hex), `hashToken(token: string): string` (sha256, determinístico — usado como chave primária de `sessoes`).
- Criar: `src/lib/server/rate-limit.ts` — `Map<string, { falhas: number; bloqueadoAte: number | null }>` em módulo; `estaBloqueado(chave: string): boolean`, `registrarFalha(chave: string): void`, `limparTentativas(chave: string): void`. Bloqueio: 5 falhas → 15 min.
- Criar: `src/lib/server/db/repositories/usuarios.ts` — `criarUsuario({ username, pin }): Usuario`, `obterUsuarioPorUsername(username): UsuarioComHash | null`, `obterUsuarioPorId(id): Usuario | null`. `UsuarioComHash` inclui `pinHash`/`pinSalt`; `Usuario` (exportado ao cliente) não.
- Criar: `src/lib/server/db/repositories/sessoes.ts` — `criarSessao(usuarioId): { token: string; expiraEm: string }`, `obterUsuarioPorToken(token): Usuario | null` (também estende `expira_em` se sessão ainda válida — sliding window), `encerrarSessao(token): void`.
- Modificar: `src/hooks.server.ts` — lê cookie `sessao`, resolve `event.locals.usuario` via `obterUsuarioPorToken`; mantém headers de segurança já existentes.
- Modificar: `src/app.d.ts` — `interface Locals { usuario: { id: string; username: string } | null }`.
- Criar: `src/lib/schemas.ts` (editar) — `registrarUsuarioSchema` (`username`: string 3-30 chars, alfanumérico+underscore; `pin`: string exatamente 6 dígitos), `entrarSchema` (mesmos campos).
- Criar: `src/routes/auth/registrar/+server.ts` (POST) — valida, checa username livre (409 se ocupado), cria usuário, cria sessão, seta cookie (`httpOnly`, `secure` em produção, `sameSite=lax`, `path=/`, `maxAge` 30 dias), retorna `{ id, username }`.
- Criar: `src/routes/auth/entrar/+server.ts` (POST) — rate-limit por username, valida PIN, cria sessão, seta cookie. 401 com mensagem genérica ("usuário ou PIN inválidos") em qualquer falha (não revelar se o username existe).
- Criar: `src/routes/auth/sair/+server.ts` (POST) — `encerrarSessao`, limpa cookie.
- Criar: `src/lib/server/auth.test.ts` — hash/verificarPin roundtrip, rate-limit bloqueia após 5 falhas e libera depois do tempo (usar tempo injetável ou `vi.useFakeTimers`).

**Verificação:** `npm run test` cobrindo hash/rate-limit; smoke test via `eval`/`fetch` real: registrar → cookie setado → entrar com PIN errado 5x → 6ª tentativa bloqueada mesmo com PIN certo → sair → cookie limpo.

---

## Etapa 2 — Escopo por usuário nas rotas/repositories existentes

**Arquivos:**

- Modificar: `src/lib/server/db/repositories/registros.ts` — toda função ganha `usuarioId: string` como primeiro parâmetro; queries filtram `WHERE usuario_id = @usuarioId` (incluindo `criarRegistro` que grava o valor).
- Modificar: `src/lib/server/db/repositories/agentes.ts` — idem.
- Modificar: `src/lib/server/db/repositories/atividades.ts` — `criarAtividade` recebe `usuarioId`, valida que `registroId` pertence a esse usuário antes de prosseguir (senão 404, não vazar existência de registro de outro usuário).
- Modificar: `src/lib/server/db/repositories/import.ts` — `importarRegistro(usuarioId, dados)` grava `usuario_id` em `registros`/`agentes` importados.
- Modificar: todas as rotas em `src/routes/registros/**/+server.ts` e `src/routes/agentes/**/+server.ts` — no início de cada handler: `if (!locals.usuario) error(401, 'Autenticacao necessaria.')`; passam `locals.usuario.id` para o repository.
- Modificar: `src/routes/registros/+page.server.ts`, `src/routes/agentes/+page.server.ts`, `src/routes/registros/[id]/+page.server.ts` — se `!locals.usuario`, retornam listas/detalhe vazios (sem erro; a página não usa isso quando anônima).
- Modificar: `src/lib/server/db/repositories/atividades.test.ts`, `report.test.ts` — ajustar chamadas para passar um `usuarioId` de teste fixo.

**Verificação:** `npm run test`; smoke test via `fetch` autenticado (cookie de sessão) confirmando isolamento — usuário A não vê Registros de usuário B.

---

## Etapa 3 — Modo anônimo no cliente (lógica pura + store)

**Arquivos:**

- Criar: `src/lib/cardinalidade.ts` — `export class RegraCardinalidadeError extends Error {}`; `export function validarCardinalidade(input: { tipo: TipoAtividade; entidadesUsadas: string[]; entidadesGeradas?: unknown[] }): void` (mesma regra de `atividades.ts` hoje).
- Modificar: `src/lib/server/db/repositories/atividades.ts` — importa `validarCardinalidade`/`RegraCardinalidadeError` de `$lib/cardinalidade` em vez de definir localmente.
- Criar: `src/lib/client/sessao-anonima.svelte.ts` — module-level `$state`: `registros: RegistroProvenencia[]`, `entidades: Entidade[]`, `atividades: Atividade[]`, `agentes: Agente[]`. Funções: `criarRegistroLocal(input)`, `finalizarRegistroLocal(id)`, `excluirRegistroLocal(id)`, `criarAtividadeLocal(registroId, input)` (usa `validarCardinalidade` + `uuidv7()`), `criarAgenteLocal(input)`, `atualizarAgenteLocal(id, input)`, `excluirAgenteLocal(id)`, `limparSessao()`. `temDadosNaoSalvos` (`$derived`: `registros.length > 0 || agentes.length > 0`).
- Criar: `src/lib/client/exportar-importar.ts` — `exportarComoArquivo(dados: RegistroExportado): void` (Blob + link sintético), `importarDeArquivo(file: File): Promise<RegistroExportado>` (FileReader + `registroExportadoSchema.parse`).
- Criar: `src/lib/client/usuario-atual.svelte.ts` — module-level `$state<{ id: string; username: string } | null>`, hidratado no layout a partir dos dados do servidor (via `+layout.server.ts`).
- Criar: `src/lib/client/dados.ts` — fachada: `criarRegistro`, `listarRegistros`, `criarAtividade`, `criarAgente`, `listarAgentes`, `atualizarAgente`, `excluirAgente`, `excluirRegistro`, `finalizarRegistro`, `obterRegistroDetalhado` — cada uma checa `usuarioAtual.valor` e delega para `fetch` (autenticado, código já existente nas páginas hoje) ou para `sessaoAnonima` (anônimo).
- Criar: `src/lib/cardinalidade.test.ts` — casos de cardinalidade (mover/duplicar os já existentes em `atividades.test.ts` para rodar sem DB).

**Verificação:** `npm run test`; teste manual no browser (sem login) criando Registro/Atividade/Agente só com JS de cliente, confirmando zero requisição de rede nas dev tools para essas ações.

---

## Etapa 4 — UI de conta + banner + integração das telas

**Arquivos:**

- Criar: `src/routes/+layout.server.ts` — retorna `{ usuario: locals.usuario }`.
- Modificar: `src/routes/+layout.svelte` — hidrata `usuarioAtual` a partir de `data.usuario`; nav mostra "Entrar"/"Criar conta" (anônimo) ou `username` + "Sair" (autenticado); banner fixo quando anônimo com `sessaoAnonima.temDadosNaoSalvos`; `beforeunload` quando anônimo com dados.
- Criar: `src/lib/components/entrar-dialog.svelte` — form username+PIN, POST `/auth/entrar`, recarrega em sucesso.
- Criar: `src/lib/components/criar-conta-dialog.svelte` — form username+PIN+confirmar PIN, POST `/auth/registrar`; em sucesso, chama `POST /registros/import` uma vez por Registro da sessão anônima (reaproveitando o formato já existente), depois `sessaoAnonima.limparSessao()` e recarrega.
- Modificar: `src/routes/registros/+page.svelte` — troca chamadas `fetch` diretas por `dados.ts`; quando anônimo, lê de `sessaoAnonima.registros` em vez do `PageData` do servidor.
- Modificar: `src/routes/agentes/+page.svelte` — idem.
- Modificar: `src/routes/registros/[id]/+page.svelte` — idem (detalhe vem de `sessaoAnonima` quando anônimo).
- Modificar: `src/lib/components/activity-form.svelte`, `agent-picker.svelte` — usam `dados.ts` em vez de `fetch` direto.

**Verificação:** Smoke test completo no browser real, anônimo do início ao fim (criar Registro → Atividade com múltiplas Entidades geradas → exportar JSON → recarregar página, tudo em branco → importar o JSON de volta → dados voltam). Depois repetir autenticado (criar conta a partir de uma sessão anônima com dados → confirma migração).

---

## Etapa 5 — Deploy: schema em produção + limpeza do dado de teste

- Aplicar schema novo (build da imagem já roda `db.exec(schema)` automaticamente — `CREATE TABLE IF NOT EXISTS` para as tabelas novas, e `ALTER TABLE ADD COLUMN` idempotente para as colunas novas, ambos precisam ser adicionados em `client.ts`).
- **Confirmar com o usuário antes de rodar**: limpar `registros`/`entidades`/`atividades`/`agentes` de teste no SQLite do UNRAID (dado sem `usuario_id`, incompatível com o modelo novo).
- Deploy da imagem nova (pull + recreate, como nas vezes anteriores) e smoke test real pós-deploy.

---

## Etapa 6 — Documentação final

- Criar `docs/adr/0009-modo-anonimo-e-contas-opcionais.md`.
- Atualizar `CONTEXT.md` (Agente deixa de ser cadastro global).
- Atualizar `docs/especificacao.md` (modelo de dados, rotas novas).
- Atualizar `README.md` (pedido explícito do usuário) — refletir modo anônimo por padrão + conta opcional, mantendo o tom motivador para pesquisadores já escrito.
