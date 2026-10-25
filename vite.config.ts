import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Desenvolvimento.md §5 — nonce automatico por request para scripts/estilos que o
			// SvelteKit gera (ex.: anti-flash de tema do mode-watcher); demais headers em hooks.server.ts.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					// mode-watcher injeta um script inline anti-flash de tema fora do pipeline de nonce
					// do SvelteKit; hash fixo do conteudo (estavel enquanto themeColors nao mudar).
					'script-src': [
						'self',
						'sha256-VmP2arq8etV2Q1kwJrHsnROqCloQE6iCMv2do81Ns44=',
						'matomo.dalc.in'
					],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'matomo.dalc.in'],
					'font-src': ['self', 'data:'],
					'connect-src': ['self', 'matomo.dalc.in'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			}
		})
	],
	// DB_PATH=':memory:' vem de .env.test — $app/env/private captura o valor no
	// resolve inicial do config; test.env (aplicado so no worker do vitest) e tarde
	// demais pro plugin do SvelteKit ver, entao nao funciona pra esse caso.
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts']
	}
});
