# Próximos Passos

## Pendências de segurança (dependências)

Estado em 2026-10-25, após commit `03d93a0` (alertas Dependabot #24–#52 corrigidos no lockfile).

- [ ] **Confirmar fechamento dos alertas Dependabot** #24–#52 após rescan do GitHub (`gh api repos/{owner}/{repo}/dependabot/alerts?state=open`).
- [ ] **`@sveltejs/kit` → 3.x** (breaking). `npm audit`: GHSA-pfhg-q3qv-9q6r (open redirect via enhanced form) e GHSA-27mw-82g8-phjj (XSS via `cache-control` em página prerendered). Afeta também `@sveltejs/adapter-node`, `@vite-pwa/sveltekit`, `runed`, `bits-ui`, `svelte-toolbelt`, `sveltekit-superforms`, `formsnap` — exigem versões compatíveis com kit 3.
- [ ] **`mermaid` → 12.x** (breaking) para corrigir `katex` (GHSA-238p-pmpm-9mq7, prototype pollution).
- [ ] **Validar visualmente o CSS de `@tailwindcss/typography`** (classes `prose`): `postcss-selector-parser` forçado para 7.x via `overrides` em `package.json`. Remover o override quando o typography trouxer v7 nativamente.

## Notas de ambiente

- npm 10.9.8 local falha com `Cannot read properties of null (reading 'edgesOut')`; usar `npx npm@11` ou atualizar o npm.
- Instalações usam `--ignore-scripts`; após instalar, rodar `npm rebuild better-sqlite3`.
