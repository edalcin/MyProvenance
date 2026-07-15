import { error, json } from '@sveltejs/kit';
import { atualizarAgente, excluirAgente, obterAgente } from '$lib/server/db/repositories/agentes';
import { agenteInputSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	if (!obterAgente(params.id, locals.usuario.id)) error(404, 'Agente nao encontrado.');
	const input = await parseBody(request, agenteInputSchema.partial());
	return json(atualizarAgente(params.id, locals.usuario.id, input));
};

/** Agente pertence a conta (nao e mais cadastro global, ADR-0009) — exclusao falha com 409 se estiver em uso por alguma Atividade. */
export const DELETE: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	if (!obterAgente(params.id, locals.usuario.id)) error(404, 'Agente nao encontrado.');
	try {
		excluirAgente(params.id, locals.usuario.id);
	} catch (err) {
		toApiError(err);
	}
	return new Response(null, { status: 204 });
};
