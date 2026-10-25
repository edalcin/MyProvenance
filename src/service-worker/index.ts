// PWA offline-leitura (ADR-0006): app shell precacheado; paginas e GETs de Registros/Agentes ja
// visitados ficam disponiveis via cache (network-first). Escrita (POST/PATCH/DELETE) nunca e
// interceptada — exige rede. Registro automatico pelo SvelteKit (type: 'module').
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { immutable, assets } from '$app/manifest';

const CACHE = `cache-${version}`;
// Paths do manifest sao relativos ao base path; o script do SW fica na raiz do base.
const ASSETS = [...immutable, ...assets].map((a) => new URL(a.path, self.location.href).pathname);
const TIMEOUT_REDE_MS = 3000;

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	// Apaga caches de deploys anteriores (inclusive os do antigo Workbox/vite-plugin-pwa).
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

function cacheavel(request: Request, url: URL): boolean {
	if (url.origin !== self.location.origin) return false;
	return (
		request.mode === 'navigate' ||
		url.pathname.startsWith('/registros') ||
		url.pathname.startsWith('/agentes')
	);
}

async function networkFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	try {
		// Timeout so ate os headers (como networkTimeoutSeconds do Workbox) — nao corta o corpo.
		const controle = new AbortController();
		const timer = setTimeout(() => controle.abort(), TIMEOUT_REDE_MS);
		const response = await fetch(request, { signal: controle.signal }).finally(() =>
			clearTimeout(timer)
		);
		if (response.status === 200) void cache.put(request, response.clone());
		return response;
	} catch (erro) {
		const cached = await cache.match(request);
		if (cached) return cached;
		throw erro;
	}
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	if (url.origin === self.location.origin && ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((r) => r ?? fetch(request)));
	} else if (cacheavel(request, url)) {
		event.respondWith(networkFirst(request));
	}
});
