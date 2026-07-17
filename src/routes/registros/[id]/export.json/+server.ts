import { error } from '@sveltejs/kit';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import { gerarJsonExportado } from '$lib/export';
import { slugify } from '$lib/slug';
import type { RequestHandler } from './$types';

/** Backup/arquivo portatil — nunca finaliza o Registro (ADR-0010); Finalizar e' acao explicita separada. */
export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const usuarioId = locals.usuario.id;
	const detalhe = obterRegistroDetalhado(params.id, usuarioId);
	if (!detalhe) error(404, 'error.record_not_found');

	const corpo = JSON.stringify(gerarJsonExportado(detalhe), null, 2);
	return new Response(corpo, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="${slugify(detalhe.registro.titulo)}-provenance.json"`
		}
	});
};
