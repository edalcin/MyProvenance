/**
 * Idioma ativo no cliente — hidratado por +layout.server.ts (mesmo padrao de usuario-atual.svelte.ts).
 */
import { traduzir, IDIOMA_PADRAO, type Idioma } from './index';

let idioma = $state<Idioma>(IDIOMA_PADRAO);

export const idiomaAtual = {
	get valor(): Idioma {
		return idioma;
	},
	definir(novo: Idioma) {
		idioma = novo;
	}
};

/** Traduz no idioma ativo — chamar em template/`$derived` para reatividade automatica. */
export function t(chave: string, params?: Record<string, string | number>): string {
	return traduzir(idioma, chave, params);
}

/**
 * Traduz a `.message` de um erro qualquer — servidor e dominio anonimo carregam uma chave do
 * catalogo como mensagem (ver $lib/i18n). Chave desconhecida: `traduzir` devolve o texto original.
 */
export function msgErro(err: unknown, chaveFallback: string): string {
	const bruto = err instanceof Error && err.message ? err.message : chaveFallback;
	return traduzir(idioma, bruto);
}
