# Próximos Passos

## Pendências de segurança (dependências)

Estado em 2026-10-25: `npm audit` → 0 vulnerabilidades.

- [x] Alertas Dependabot #24–#52 fechados após rescan.
- [x] `mermaid` → 12.x (corrige `katex`, alerta #53). Diagrama validado visualmente (layout ELK é o padrão no v12).
- [x] `@sveltejs/kit` → 3.x (alertas #54/#55) + `adapter-node` 6, `sveltekit-superforms` 3, `formsnap` 2.1, `bits-ui` 2.20. Migração via `npx sv migrate sveltekit-3` (`$lib` → `#lib`, `$env/dynamic/private` → `$app/env/private` + `src/env.ts`, `json()` → `Response.json()`).
- [x] PWA: `@vite-pwa/sveltekit`/`vite-plugin-pwa` não suportam kit 3 (não geram `sw.js`). Trocados pelo service worker nativo (`src/service-worker/index.ts`) + `static/manifest.webmanifest`. Leitura offline validada no build de produção.
- [x] CSS de `@tailwindcss/typography` (`prose`) validado visualmente com `postcss-selector-parser` 7 forçado via `overrides`.
- [ ] Confirmar fechamento dos alertas #53–#55 após rescan do GitHub (`gh api repos/{owner}/{repo}/dependabot/alerts?state=open`).
- [ ] Remover o override `@tailwindcss/typography` → `postcss-selector-parser` quando o typography trouxer v7 nativamente.
- [ ] Remover o override `bits-ui` → `runed ^0.38` quando o `bits-ui` depender de `runed` com peer kit 3.

## Notas de ambiente

- npm 10.9.8 local falha com `Cannot read properties of null (reading 'edgesOut')`; usar `npx npm@11` ou atualizar o npm. Se o npm 11 sair sem mensagem (bug do Arborist), remover do `package-lock.json` as entradas dos pacotes a atualizar e reinstalar.
- Instalações usam `--ignore-scripts`; após instalar, rodar `npm rebuild better-sqlite3`.
- Repo em drive de rede (`S:` → `\\ASILO\Storage`): o `tsconfig.json` repete `rootDirs` porque o TS resolve `extends: "$app/tsconfig"` pelo caminho UNC.
- Mutações sem corpo (`POST`/`DELETE`) mandam `content-type: application/json`: o CSRF do kit 3 rejeita requisição sem Content-Type quando a origem não bate (acesso http direto, sem `PROTOCOL_HEADER`).
- `components.json` (shadcn-svelte) ainda aponta aliases para `$lib`; ajustar para `#lib` se o CLI suportar, antes de adicionar componentes novos.
