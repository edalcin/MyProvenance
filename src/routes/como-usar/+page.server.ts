import { marked } from 'marked';
import { obterIndiceManual } from '$lib/content';
import { sanitizarMarkdownRenderizado } from '$lib/sanitize';
import type { PageServerLoad } from './$types';

/** Indice do manual — renderiza manual/{idioma}/README.md (sumario editavel, sem tocar em codigo). */
export const load: PageServerLoad = ({ locals }) => {
	const html = sanitizarMarkdownRenderizado(
		marked.parse(obterIndiceManual(locals.idioma), { async: false }) as string
	);
	return { html };
};
