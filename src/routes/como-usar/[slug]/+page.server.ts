import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import { obterPaginaManual, PAGINAS_MANUAL } from '$lib/content';
import { sanitizarMarkdownRenderizado } from '$lib/sanitize';
import { traduzir } from '$lib/i18n';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const bruto = obterPaginaManual(locals.idioma, params.slug);
	if (bruto === null) error(404, traduzir(locals.idioma, 'error.page_not_found'));
	const html = sanitizarMarkdownRenderizado(marked.parse(bruto, { async: false }) as string);
	const i = PAGINAS_MANUAL.findIndex((p) => p.slug === params.slug);
	const anterior = i > 0 ? PAGINAS_MANUAL[i - 1] : null;
	const proximo = i >= 0 && i + 1 < PAGINAS_MANUAL.length ? PAGINAS_MANUAL[i + 1] : null;
	return {
		html,
		anterior: anterior && { slug: anterior.slug, titulo: anterior.titulo[locals.idioma] },
		proximo: proximo && { slug: proximo.slug, titulo: proximo.titulo[locals.idioma] }
	};
};
