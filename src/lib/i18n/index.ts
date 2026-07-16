/**
 * Nucleo i18n — puro, sem runes, importavel no servidor (hooks.server.ts, +page.server.ts).
 * Estado reativo de cliente vive em `estado.svelte.ts`.
 */
import { pt } from './pt';
import { en } from './en';

export type Idioma = 'pt' | 'en';
export const IDIOMAS: readonly Idioma[] = ['pt', 'en'];
export const IDIOMA_PADRAO: Idioma = 'pt';
export const COOKIE_IDIOMA = 'idioma';

export type ChaveMensagem = keyof typeof pt;

const catalogo: Record<Idioma, Record<ChaveMensagem, string>> = { pt, en };

export function idiomaValido(v: unknown): v is Idioma {
	return v === 'pt' || v === 'en';
}

/**
 * Traduz `chave` no `idioma` dado. Chave ausente cai para pt, depois para a propria chave
 * (nunca UI vazia) — cobre textos que ja chegam como mensagem pronta (ex.: erro estrutural
 * do Zod sem override custom).
 */
export function traduzir(
	idioma: Idioma,
	chave: string,
	params?: Record<string, string | number>
): string {
	const tabela = catalogo[idioma] as Record<string, string>;
	let texto = tabela[chave] ?? (catalogo.pt as Record<string, string>)[chave] ?? chave;
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			texto = texto.replaceAll(`{${k}}`, String(v));
		}
	}
	return texto;
}
