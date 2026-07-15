import { error, json } from '@sveltejs/kit';
import {
	atualizarRegistro,
	excluirRegistro,
	obterRegistroDetalhado
} from '$lib/server/db/repositories/registros';
import { sanitizarHtmlRico } from '$lib/sanitize';
import { registroInputSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const detalhe = obterRegistroDetalhado(params.id, locals.usuario.id);
	if (!detalhe) error(404, 'Registro nao encontrado.');
	return json(detalhe);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const input = await parseBody(request, registroInputSchema);
	try {
		const registro = atualizarRegistro(params.id, locals.usuario.id, {
			titulo: input.titulo,
			descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : input.descricao
		});
		return json(registro);
	} catch (err) {
		toApiError(err);
	}
};

/** Cascata sempre permitida, em qualquer status (rascunho ou finalizado) — especificacao.md §3. */
export const DELETE: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	if (!obterRegistroDetalhado(params.id, locals.usuario.id)) error(404, 'Registro nao encontrado.');
	excluirRegistro(params.id, locals.usuario.id);
	return new Response(null, { status: 204 });
};
