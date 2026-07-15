# Modo anônimo (client-only) + contas opcionais (username + PIN)

## Contexto e objetivo

Hoje o MyProvenance persiste tudo no SQLite do servidor desde a primeira ação (ADR-0001), sem autenticação, instância single-user (ADR-0002). O usuário quer inverter o padrão: **por padrão, nada é salvo no servidor** — a ferramenta funciona só via importar/exportar JSON, com o trabalho vivendo apenas na sessão do navegador. Quem quiser continuidade automática entre visitas pode criar uma conta leve (username + PIN); cada conta só enxerga seus próprios Registros e Agentes.

Isto revisa ADR-0001 e ADR-0002 (ambas previam revisão futura se o cenário mudasse) e substitui o design de Agente como cadastro global por Agente escopado por conta.

## Modos de operação

### Anônimo (padrão, sem login)

Nenhuma chamada de rede para `/registros`, `/agentes` ou `/registros/:id/atividades` acontece enquanto anônimo. Toda a lógica de negócio roda no navegador:

- Regra de cardinalidade por tipo de Atividade (`validarCardinalidade`, hoje presa em `atividades.ts` do servidor) é extraída para `src/lib/cardinalidade.ts`, pura, sem dependência de `db` — importada tanto pelo repository do servidor quanto pelo store do cliente.
- `gerarDiagramaMermaid` (`src/lib/mermaid.ts`) já é pura e já roda no cliente — sem mudança.
- IDs gerados com `uuidv7()` (já funciona em bundle de browser).
- Sanitização da descrição rica do Registro roda no cliente também (mesmo allowlist de `src/lib/server/sanitize.ts`, portado ou reaproveitado se `sanitize-html` funcionar limpo em bundle de browser — a confirmar na implementação; fallback: sanitização manual equivalente).
- Export/Import viram operações 100% locais: exportar monta o objeto e dispara download via `Blob` + `<a download>`; importar lê um arquivo via `FileReader`, faz `JSON.parse` e valida com o mesmo `registroExportadoSchema` (Zod puro, já roda em qualquer lado).

### Autenticado (conta opcional)

Username + PIN numérico de 6 dígitos. Rotas de API atuais (`/registros`, `/agentes`, `/registros/:id/atividades`, `/registros/:id/export.*`, `/registros/import`) continuam exatamente com a mesma forma e mesma lógica de hoje — só passam a exigir sessão válida (`event.locals.usuario`, 401 se ausente) e a escopar toda leitura/escrita por `usuarioId`.

Não existe um terceiro modo "servidor valida mas não persiste" — anônimo nunca toca o backend de dados; autenticado sempre persiste como hoje.

## Camada de abstração de dados no cliente

Para as telas (`/registros`, `/agentes`, `/registros/:id`) e componentes de formulário (`ActivityForm`, diálogos de Registro/Agente) não duplicarem toda a lógica de apresentação em dois caminhos, criamos uma fachada única em `src/lib/client/dados.ts` com funções como `criarRegistro(input)`, `criarAtividade(registroId, input)`, `criarAgente(input)`, `listarRegistros(opts)`, etc. Cada função decide internamente, olhando o estado de autenticação atual:

- **Autenticado** → `fetch` para a rota de API correspondente (comportamento atual, inalterado).
- **Anônimo** → chama a store local equivalente.

Os componentes de UI chamam sempre `dados.criarRegistro(...)` etc., sem saber em qual modo estão.

## Estado anônimo no cliente

`src/lib/client/sessao-anonima.svelte.ts` — store Svelte 5 (module-level `$state`) mantendo `{ registros, entidades, atividades, agentes }` da sessão corrente, com métodos espelhando 1:1 as operações dos repositories do servidor (mesma validação de cardinalidade, mesmas regras de imutabilidade após "Finalizar" aplicadas em memória). Expõe `temDadosNaoSalvos: boolean` (derived) usado pelo banner e pelo `beforeunload`.

## Dados por conta (schema)

Tabelas novas:

- `usuarios (id, username UNIQUE, pin_hash, pin_salt, criado_em)`
- `sessoes (token_hash PK, usuario_id, criado_em, expira_em)` — token opaco, guardado hasheado (nunca em claro).

Colunas novas: `registros.usuario_id`, `agentes.usuario_id` (nullable no schema — SQLite não permite `ADD COLUMN NOT NULL` sem `DEFAULT` em tabela com linhas existentes; obrigatoriedade é garantida na camada de aplicação, todo INSERT dos repositories exige `usuarioId`). `agentes` deixa de ser cadastro global — cada conta tem o seu.

## Segurança do PIN e sessão

- PIN: 6 dígitos numéricos (1.000.000 combinações — fraco por natureza, compensado por rate limit).
- Hash: `node:crypto` `scrypt` (sem dependência nova) + salt aleatório por usuário.
- Rate limit: `src/lib/server/rate-limit.ts`, Map em memória por username — 5 tentativas erradas seguidas bloqueiam por 15 min. `// ponytail: lock em memória, global ao processo; revisar se a instância virar multi-processo`.
- Sessão: cookie `httpOnly`, `secure`, `sameSite=lax`; token opaco de 32+ bytes aleatórios, hash guardado no banco; expira em 30 dias, renovado (sliding) a cada uso.
- Logout: apaga a linha de `sessoes` correspondente + limpa cookie.

## Rotas novas

- `POST /auth/registrar` `{ username, pin }` → cria usuário, cria sessão, seta cookie. Falha (409) se username já existe.
- `POST /auth/entrar` `{ username, pin }` → valida (rate limited), cria sessão, seta cookie.
- `POST /auth/sair` → encerra sessão atual.

`src/hooks.server.ts` resolve `event.locals.usuario` a partir do cookie (mantém os headers de segurança já existentes). `src/app.d.ts` ganha `App.Locals { usuario: { id, username } | null }`.

## Fluxo de criar conta

O botão "Criar conta" só aparece depois que já existe pelo menos 1 Registro ou 1 Agente na sessão anônima. Ao criar conta com sucesso: loga automaticamente, chama a rota de import já existente (`POST /registros/import`, agora autenticada) com tudo que estava na sessão anônima — reaproveita o upsert por id que já existe (ADR-0004) — depois limpa a store anônima e recarrega as listas do servidor. "Entrar" (username+PIN) fica sempre disponível no nav para quem já tem conta.

## Lembretes de exportar

- Banner fixo (não só toast) visível sempre que anônimo com `temDadosNaoSalvos`: "Você está sem conta — os dados só existem neste navegador. Exporte o JSON antes de sair, ou crie uma conta." com botões "Exportar JSON" e "Criar conta".
- `beforeunload` nativo do navegador quando anônimo com dados não exportados.

## Fora de escopo (YAGNI)

- Recuperação de PIN esquecido — sem e-mail/infra de recovery neste app self-hosted; perdeu, cria outro usuário.
- Sincronização multi-dispositivo em tempo real — login normal (mesmo username+PIN em outro navegador) já cobre continuidade.
- 2FA ou senha complexa — foge do espírito de ferramenta pessoal leve.

## Dado de teste já em produção

O SQLite do UNRAID já tem Registros/Agentes de teste sem `usuario_id`. Antes de aplicar o schema novo lá, confirmar com o usuário: limpar essas tabelas (ação destrutiva, feita só com ok explícito no momento do deploy) — não há dado real em jogo, só o que foi criado durante o desenvolvimento desta sessão.

## Documentação a atualizar ao final

Nova ADR (0009) revisando ADR-0001/0002. `CONTEXT.md` (Agente deixa de ser "global"), `docs/especificacao.md` (modelo de dados, rotas novas, fluxo). `README.md` — pedido explícito do usuário, refletindo o novo modelo (modo anônimo por padrão, conta opcional, sem perder o tom motivador já escrito para pesquisadores).
