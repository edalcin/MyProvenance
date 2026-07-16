import { error } from '@sveltejs/kit';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import { gerarRelatorioMarkdown } from '$lib/report';
import { slugify } from '$lib/slug';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const detalhe = obterRegistroDetalhado(params.id, locals.usuario.id);
	if (!detalhe) error(404, 'error.record_not_found');

	const conteudo = gerarRelatorioMarkdown(detalhe, new Date().toISOString(), locals.idioma);
	return new Response(conteudo, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'content-disposition': `attachment; filename="${slugify(detalhe.registro.titulo)}-provenance.md"`
		}
	});
};
