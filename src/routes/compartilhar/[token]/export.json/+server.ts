import { error } from '@sveltejs/kit';
import { obterRegistroDetalhadoPorToken } from '$lib/server/db/repositories/registros';
import { gerarJsonExportado } from '$lib/export';
import { slugify } from '$lib/slug';
import type { RequestHandler } from './$types';

/** Publico (sem sessao) — nunca finaliza o Registro (rota so-leitura, sem direito de mutacao). */
export const GET: RequestHandler = ({ params }) => {
	const detalhe = obterRegistroDetalhadoPorToken(params.token);
	if (!detalhe) error(404, 'error.record_not_found');

	const corpo = JSON.stringify(gerarJsonExportado(detalhe), null, 2);
	return new Response(corpo, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="${slugify(detalhe.registro.titulo)}-provenance.json"`
		}
	});
};
