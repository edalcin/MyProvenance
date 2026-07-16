import type { Handle } from '@sveltejs/kit';
import { obterUsuarioPorToken } from '$lib/server/db/repositories/sessoes';
import { COOKIE_IDIOMA, IDIOMA_PADRAO, idiomaValido } from '$lib/i18n';

export const COOKIE_SESSAO = 'sessao';

/**
 * Resolve `event.locals.usuario` a partir do cookie de sessao (ADR-0009: conta
 * opcional, username+PIN). Anonimo (sem cookie ou token invalido) segue com
 * `locals.usuario = null` — as rotas de dados exigem sessao explicitamente.
 *
 * Headers de seguranca HTTP adicionais — Desenvolvimento.md §5. CSP fica a cargo do SvelteKit
 * (kit.csp em vite.config.ts, com nonce automatico por request).
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(COOKIE_SESSAO);
	event.locals.usuario = token ? obterUsuarioPorToken(token) : null;

	const idiomaCookie = event.cookies.get(COOKIE_IDIOMA);
	event.locals.idioma = idiomaValido(idiomaCookie) ? idiomaCookie : IDIOMA_PADRAO;

	const bcp47 = event.locals.idioma === 'en' ? 'en' : 'pt-BR';
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('lang="pt-BR"', `lang="${bcp47}"`)
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
	return response;
};
