import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'MyProvenance',
				short_name: 'MyProvenance',
				description: 'Documentação de proveniência de dados de pesquisa',
				lang: 'pt-BR',
				theme_color: '#0a0a0a',
				background_color: '#0a0a0a',
				display: 'standalone',
				start_url: '/registros',
				icons: [
					{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				// Offline cobre so leitura (ADR-0006): app shell + paginas/GETs ja visitados ficam
				// disponiveis via cache; escrita (POST/PATCH/DELETE) nao e interceptada, exige rede.
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: { cacheName: 'paginas', networkTimeoutSeconds: 3 }
					},
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/registros') || url.pathname.startsWith('/agentes'),
						handler: 'NetworkFirst',
						options: { cacheName: 'dados-api', networkTimeoutSeconds: 3 }
					}
				]
			},
			devOptions: { enabled: false }
		})
	],
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		env: { DB_PATH: ':memory:' }
	}
});
