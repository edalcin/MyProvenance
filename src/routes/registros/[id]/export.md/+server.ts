import { error } from '@sveltejs/kit';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import { gerarRelatorioMarkdown } from '$lib/server/report';
import { slugify } from '$lib/server/slug';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const detalhe = obterRegistroDetalhado(params.id);
	if (!detalhe) error(404, 'Registro nao encontrado.');

	const conteudo = gerarRelatorioMarkdown(detalhe, new Date().toISOString());
	return new Response(conteudo, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'content-disposition': `attachment; filename="${slugify(detalhe.registro.titulo)}-provenance.md"`
		}
	});
};
