# MyProvenance

**A história por trás dos seus dados de pesquisa merece ser preservada.**

Todo conjunto de dados carrega uma trajetória: de onde veio, quem coletou, quais transformações sofreu, que análises geraram cada resultado. Quando essa trajetória não é registrada, ela se perde — e com ela se perde a possibilidade de reproduzir um resultado, de auditar um erro, de dar crédito correto a quem gerou o dado original, ou de reutilizar com confiança o trabalho de outra pessoa (ou o seu próprio, meses depois).

**MyProvenance** existe para que essa história nunca se perca. É uma ferramenta web simples e self-hosted para documentar a **proveniência** — origem, transformação e análise — de conjuntos de dados de pesquisa, seguindo o modelo internacional **W3C PROV**. Ela registra os _metadados_ do processo científico (quem, quando, como, com quê), nunca o dado em si: seus arquivos continuam onde já estão, sob seu controle.

## Por que isso importa para a ciência

- **Reprodutibilidade** — permite que outros pesquisadores (ou você mesmo, no futuro) sigam exatamente os mesmos passos, com os mesmos parâmetros e versões de software, até o mesmo resultado.
- **Atribuição e crédito** — identifica com clareza quem gerou cada dado e cada análise, preservando a autoria ao longo de toda a cadeia.
- **Auditoria e confiança** — quando um erro aparece numa análise, a proveniência permite rastrear o caminho de volta: a falha estava na coleta? Num script de limpeza? Numa etapa de modelagem?
- **Reusabilidade (o "R" do FAIR)** — dados bem documentados podem ser reaproveitados por outras equipes e outros projetos, multiplicando o valor do trabalho já feito.

Documentar proveniência não é burocracia — é o que transforma um arquivo solto num dado científico verdadeiramente confiável.

## O que o MyProvenance faz por você

- **Registra o ciclo de vida completo** de um conjunto de dados através de três tipos de evento — Criação, Transformação e Análise — cada um com seus próprios campos (instrumento, script, parâmetros, ambiente de execução).
- **Desenha o diagrama de linhagem automaticamente**, ao vivo, à medida que você registra as etapas — sem precisar desenhar nada à mão.
- **Gera um relatório `.md` portátil** com o diagrama e todas as tabelas, pronto para anexar a um artigo, repositório ou submissão.
- **Exporta um JSON completo** do registro para backup, compartilhamento entre colegas ou migração para outra instância.
- **Não guarda o dado em si** — só a documentação sobre ele. Seus arquivos de pesquisa continuam onde estão.
- É **grátis, self-hosted e instalável como app (PWA)** — você mantém o controle total sobre onde a informação fica.

Comece registrando a primeira Criação do seu conjunto de dados e deixe a linhagem crescer com o seu projeto.

Ver `CONTEXT.md`, `docs/especificacao.md` e `docs/adr/` para o modelo de domínio e as decisões arquiteturais.

## Stack

SvelteKit + shadcn-svelte + Boxicons + TipTap, SQLite (`better-sqlite3`), sem autenticação (instância single-user), PWA.

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
  ghcr.io/edalcin/myprovenance:latest
```

- `-v .../myprovenance-data:/data` — volume persistente para o SQLite, **fora** do container.
- `-e DB_PATH=/data/myprovenance.sqlite` — caminho do arquivo dentro do volume montado.
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
7. **Apply.** O UNRAID baixa a imagem e inicia o container.
8. Acesse via `http://<ip-do-unraid>:3000` (ou a porta escolhida no passo 4).

Backup: basta copiar o arquivo `myprovenance.sqlite` da pasta mapeada (`/mnt/user/appdata/myprovenance`), ou usar a função **Exportar JSON** de cada Registro pela própria interface.

### Build local da imagem

```sh
docker build -t myprovenance .
```

Multi-stage (`node:22-alpine`), roda como usuário não-root, sem segredos embutidos — todas as variáveis vêm de `-e`/`.env`.

## Segurança

- Container roda como usuário não-root (`myprovenance`).
- Sem autenticação — instância single-user, self-hosted (ADR-0002); não exponha a porta diretamente à internet sem um proxy reverso com autenticação/TLS.
- Headers HTTP: `Content-Security-Policy` (nonce por request via SvelteKit), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (ver `src/hooks.server.ts` e `vite.config.ts`).
- Toda entrada do usuário é validada (Zod) e a descrição rica do Registro é sanitizada (`sanitize-html`) antes de persistir.
- CI roda scan de vulnerabilidades (Trivy) a cada build da imagem; atualizações de dependências via Dependabot (npm, Docker, GitHub Actions).
