import { marked } from 'marked';
import { obterConteudoMarkdown } from '#lib/content/index.js';
import { sanitizarMarkdownRenderizado } from '#lib/sanitize.js';
import type { PageServerLoad } from './$types';

/** Conteudo desta pagina vive em src/lib/content/sobre.{pt,en}.md — editavel sem tocar em codigo. */
export const load: PageServerLoad = ({ locals }) => {
	const html = sanitizarMarkdownRenderizado(
		marked.parse(obterConteudoMarkdown('sobre', locals.idioma), { async: false }) as string
	);
	return { html };
};
