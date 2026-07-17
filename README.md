<p align="center">
  <img src="MyProvenanceLogo.png" alt="MyProvenance" width="120" />
</p>

# MyProvenance

**A história por trás dos seus dados de pesquisa merece ser preservada.**

Todo conjunto de dados carrega uma trajetória: de onde veio, quem coletou, quais transformações sofreu, que análises geraram cada resultado. Quando essa trajetória não é registrada, ela se perde — e com ela se perde a possibilidade de reproduzir um resultado, de auditar um erro, de dar crédito correto a quem gerou o dado original, ou de reutilizar com confiança o trabalho de outra pessoa (ou o seu próprio, meses depois).

**MyProvenance** existe para que essa história nunca se perca. É uma ferramenta web simples e self-hosted para documentar a **proveniência** — origem, transformação e análise — de conjuntos de dados de pesquisa, seguindo o modelo internacional **[W3C PROV](https://www.w3.org/TR/2013/NOTE-prov-overview-20130430/)**. Ela registra os _metadados_ do processo científico (quem, quando, como, com quê), nunca o dado em si: seus arquivos continuam onde já estão, sob seu controle.

## Por que isso importa para a ciência

- **Reprodutibilidade** — permite que outros pesquisadores (ou você mesmo, no futuro) sigam exatamente os mesmos passos, com os mesmos parâmetros e versões de software, até o mesmo resultado.
- **Atribuição e crédito** — identifica com clareza quem gerou cada dado e cada análise, preservando a autoria ao longo de toda a cadeia.
- **Auditoria e confiança** — quando um erro aparece numa análise, a proveniência permite rastrear o caminho de volta: a falha estava na coleta? Num script de limpeza? Numa etapa de modelagem?
- **Reusabilidade (o "R" do FAIR)** — dados bem documentados podem ser reaproveitados por outras equipes e outros projetos, multiplicando o valor do trabalho já feito.

Documentar proveniência não é burocracia — é o que transforma um arquivo solto num dado científico verdadeiramente confiável.

## O que o MyProvenance faz por você

- **Registra o ciclo de vida completo** de um conjunto de dados através de três tipos de evento — Criação, Transformação e Análise — cada um com seus próprios campos (instrumento, script, parâmetros, ambiente de execução).
- **Desenha o diagrama de linhagem automaticamente**, ao vivo, à medida que você registra as etapas — sem precisar desenhar nada à mão. Alterne a orientação horizontal/vertical com um clique.
- **Gera um relatório `.md` portátil** com o diagrama (na orientação escolhida) e todas as tabelas, pronto para anexar a um artigo, repositório ou submissão.
- **Compartilha um link público de leitura** de um Registro (com Conta) — quem recebe o link vê o diagrama, as tabelas e pode exportar `.md`/JSON, mas não edita nem exclui nada. Revogável a qualquer momento.
- **Exporta um JSON completo** do registro para backup, compartilhamento entre colegas ou migração para outra instância.
- **Interface bilíngue** — português (padrão) ou inglês, com troca instantânea pelo seletor no cabeçalho, sem recarregar a página.
- **Não guarda o dado em si** — só a documentação sobre ele. Seus arquivos de pesquisa continuam onde estão.
- É **grátis, self-hosted, instalável como app (PWA) e não exige cadastro** — use direto no navegador, sem criar conta.

## Modo anônimo por padrão, conta opcional

Por padrão, o MyProvenance **não salva nada no servidor**: todo o trabalho fica só na memória do seu navegador, e a única forma de retomar depois é exportando o JSON e importando de volta quando precisar continuar (ou compartilhar com um colega). Isso significa privacidade total — nenhum dado seu passa pela rede enquanto você não decidir salvar.

Se quiser continuidade automática entre visitas, **crie uma conta** (usuário + PIN de 6 dígitos, sem e-mail) — o botão aparece depois que você já tem o primeiro Registro ou Agente na sessão. Ao criar a conta, tudo que você já tinha feito é migrado automaticamente; a partir daí seus Registros e Agentes ficam salvos no servidor, isolados de qualquer outra conta na mesma instância. Perdeu o PIN? Sem recuperação — self-hosted sem e-mail — basta criar outra conta.

Comece registrando a primeira Criação do seu conjunto de dados e deixe a linhagem crescer com o seu projeto. Um guia passo a passo, com exemplo prático de planilha de biodiversidade, está disponível em **Como usar** no menu do app — o conteúdo dessa página e da página **Sobre** vem de arquivos Markdown em `src/lib/content/` (`como-usar.{pt,en}.md`, `sobre.{pt,en}.md`), editáveis diretamente sem tocar em código.

Ver `CONTEXT.md`, `docs/especificacao.md` e `docs/adr/` para o modelo de domínio e as decisões arquiteturais.

## Idioma

A interface, o relatório `.md` exportado e as mensagens de erro estão disponíveis em **português (padrão)** e **inglês** — alterne pelo seletor **PT/EN** no cabeçalho. A troca é instantânea (sem recarregar a página) e fica salva num cookie para a próxima visita; o SSR já renderiza no idioma correto, sem piscar. O **JSON exportado** permanece sempre em português: é o formato de dados/intercâmbio da ferramenta, não uma tela.

## Stack

SvelteKit + shadcn-svelte + Boxicons + TipTap, SQLite (`better-sqlite3`), conta opcional (username + PIN), PWA.

## Desenvolvimento

```sh
npm install
cp .env.example .env   # ajuste DB_PATH
npm run dev -- --open
```

## Build

```sh
npm run build
npm run preview
```

## Docker

Imagem publicada em `ghcr.io/edalcin/myprovenance` (tags `latest` e `sha-<commit>`, via GitHub Actions a cada push em `main`).

### Uso genérico (`docker run`)

```sh
docker run -d \
  --name myprovenance \
  -p 3000:3000 \
  -v /caminho/no/host/myprovenance-data:/data \
  -e DB_PATH=/data/myprovenance.sqlite \
  -e URL_BASE=http://localhost:3000 \
  ghcr.io/edalcin/myprovenance:latest
```

- `-v .../myprovenance-data:/data` — volume persistente para o SQLite, **fora** do container.
- `-e DB_PATH=/data/myprovenance.sqlite` — caminho do arquivo dentro do volume montado.
- `-e URL_BASE=http://localhost:3000` — URL pública externa desta instância, usada para montar o link de **Compartilhar** de um Registro. Atrás de proxy/porta mapeada, use o endereço que o navegador realmente acessa (ex.: `http://192.168.1.10:8090`), não a porta interna do container.
- Acesse em `http://localhost:3000`.

### Instalação no UNRAID (interface gráfica)

1. **Docker → Add Container.**
2. **Repository:** `ghcr.io/edalcin/myprovenance:latest`.
3. **Network Type:** `Bridge` (padrão).
4. **Port Mappings** — Add:
   - Container Port: `3000` → Host Port: `3000` (ou outra porta livre, ex.: `8090`).
5. **Path Mappings** — Add:
   - Container Path: `/data` → Host Path: `/mnt/user/appdata/myprovenance` (crie a pasta antes, se necessário).
6. **Variáveis de ambiente** — Add:
   - `DB_PATH` = `/data/myprovenance.sqlite`
   - `PORT` = `3000` (opcional, já é o padrão)
   - `URL_BASE` = endereço público real desta instância (ex.: `http://192.168.1.10:8090`, usando a **porta do host** escolhida no passo 4, não a porta interna `3000`) — usado para montar o link de **Compartilhar** de um Registro.
7. **Apply.** O UNRAID baixa a imagem e inicia o container.
8. Acesse via `http://<ip-do-unraid>:<porta-escolhida-no-passo-4>` — confirme a porta real com `docker port MyProvenance` se tiver dúvida (o UNRAID não obriga a manter `3000`, e recriar o container manualmente sem repetir o mesmo mapeamento troca a porta sem avisar).

Backup: basta copiar o arquivo `myprovenance.sqlite` da pasta mapeada (`/mnt/user/appdata/myprovenance`), ou usar a função **Exportar JSON** de cada Registro pela própria interface.

### Atualizando para uma imagem nova

Pela interface do UNRAID (**Docker → clique no container → Force Update** ou **Update All**), os mapeamentos de porta e volume são preservados automaticamente. Se atualizar via linha de comando (`docker stop && docker rm && docker run ...`), repita **exatamente** as mesmas flags `-p`/`-v` do container atual — confirme antes com `docker port <nome>` e `docker inspect <nome> --format '{{json .Mounts}}'`, para não perder a porta ou o caminho dos dados.

### Build local da imagem

```sh
docker build -t myprovenance .
```

Multi-stage (`node:22-alpine`), roda como usuário não-root, sem segredos embutidos — todas as variáveis vêm de `-e`/`.env`.

## Segurança

- Container roda como usuário não-root (`myprovenance`).
- Conta opcional (username + PIN de 6 dígitos, hash `scrypt` nativo do Node) — sem conta, nada persiste no servidor (ADR-0009, revisa ADR-0002). Sessão via cookie `httpOnly`/`secure`, rate limit de 5 tentativas por 15 min. Não exponha a porta diretamente à internet sem um proxy reverso com TLS.
- Headers HTTP: `Content-Security-Policy` (nonce por request via SvelteKit), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (ver `src/hooks.server.ts` e `vite.config.ts`).
- Toda entrada do usuário é validada (Zod) e a descrição rica do Registro é sanitizada (`sanitize-html`) antes de persistir; o conteúdo Markdown das páginas Sobre/Como usar também é sanitizado após a conversão para HTML.
- Link público de **Compartilhar** usa um token opaco de 24 bytes (URL-safe, não listado/indexável) e é somente leitura — a rota pública nunca aceita mutação, e desativar o link invalida o token imediatamente.
- CI roda scan de vulnerabilidades (Trivy) a cada build da imagem; atualizações de dependências via Dependabot (npm, Docker, GitHub Actions).
