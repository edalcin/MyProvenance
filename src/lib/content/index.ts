import sobrePt from './sobre.pt.md?raw';
import sobreEn from './sobre.en.md?raw';
import comoUsarPt from './como-usar.pt.md?raw';
import comoUsarEn from './como-usar.en.md?raw';
import type { Idioma } from '$lib/i18n';

const paginas = {
	sobre: { pt: sobrePt, en: sobreEn },
	'como-usar': { pt: comoUsarPt, en: comoUsarEn }
} as const;

/** Conteudo editavel das paginas estaticas (Sobre/Como usar) — arquivos .md em src/lib/content/. */
export function obterConteudoMarkdown(pagina: keyof typeof paginas, idioma: Idioma): string {
	return paginas[pagina][idioma];
}
