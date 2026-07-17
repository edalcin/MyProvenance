import { error } from '@sveltejs/kit';
import { obterRegistroDetalhadoPorToken } from '$lib/server/db/repositories/registros';
import { gerarRelatorioMarkdown } from '$lib/report';
import { slugify } from '$lib/slug';
import type { RequestHandler } from './$types';

/** Publico (sem sessao) — nunca finaliza o Registro (rota so-leitura, sem direito de mutacao). */
export const GET: RequestHandler = ({ params, locals }) => {
	const detalhe = obterRegistroDetalhadoPorToken(params.token);
	if (!detalhe) error(404, 'error.record_not_found');

	const conteudo = gerarRelatorioMarkdown(detalhe, new Date().toISOString(), locals.idioma);
	return new Response(conteudo, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'content-disposition': `attachment; filename="${slugify(detalhe.registro.titulo)}-provenance.md"`
		}
	});
};
