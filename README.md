# MyProvenance

Ferramenta web para documentar a proveniência (origem, transformação e análise) de conjuntos de dados de pesquisa, sem armazenar os dados em si — seguindo o modelo W3C PROV (Entidades, Atividades, Agentes).

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
