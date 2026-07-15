import type { Handle } from '@sveltejs/kit';

/**
 * Headers de seguranca HTTP adicionais — Desenvolvimento.md §5. CSP fica a cargo do SvelteKit
 * (kit.csp em vite.config.ts, com nonce automatico por request). Instancia single-user sem
 * autenticacao (ADR-0002), same-origin.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
	return response;
};
