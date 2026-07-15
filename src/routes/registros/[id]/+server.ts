import { error, json } from '@sveltejs/kit';
import { excluirRegistro, obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const detalhe = obterRegistroDetalhado(params.id, locals.usuario.id);
	if (!detalhe) error(404, 'Registro nao encontrado.');
	return json(detalhe);
};

/** Cascata sempre permitida, em qualquer status (rascunho ou finalizado) — especificacao.md §3. */
export const DELETE: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	if (!obterRegistroDetalhado(params.id, locals.usuario.id)) error(404, 'Registro nao encontrado.');
	excluirRegistro(params.id, locals.usuario.id);
	return new Response(null, { status: 204 });
};
