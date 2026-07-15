import { error } from '@sveltejs/kit';
import {
	RegistroJaFinalizadoError,
	finalizarRegistro,
	obterRegistroDetalhado
} from '$lib/server/db/repositories/registros';
import { gerarJsonExportado } from '$lib/export';
import { slugify } from '$lib/slug';
import type { RequestHandler } from './$types';

/** Primeira exportacao do JSON finaliza o Registro (Rascunho -> Finalizado) — CONTEXT.md, ADR-0003. */
export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const usuarioId = locals.usuario.id;
	let detalhe = obterRegistroDetalhado(params.id, usuarioId);
	if (!detalhe) error(404, 'Registro nao encontrado.');

	if (detalhe.registro.status === 'rascunho') {
		try {
			finalizarRegistro(params.id, usuarioId);
		} catch (err) {
			if (!(err instanceof RegistroJaFinalizadoError)) throw err;
		}
		detalhe = obterRegistroDetalhado(params.id, usuarioId)!;
	}

	const corpo = JSON.stringify(gerarJsonExportado(detalhe), null, 2);
	return new Response(corpo, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="${slugify(detalhe.registro.titulo)}-provenance.json"`
		}
	});
};
