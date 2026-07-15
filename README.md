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

Ver instruções de instalação (UNRAID e genérico) na seção "Docker" mais abaixo (adicionada na etapa de empacotamento).
