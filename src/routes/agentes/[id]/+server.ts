import { error, json } from '@sveltejs/kit';
import { atualizarAgente, excluirAgente, obterAgente } from '$lib/server/db/repositories/agentes';
import { agenteInputSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	if (!obterAgente(params.id)) error(404, 'Agente nao encontrado.');
	const input = await parseBody(request, agenteInputSchema.partial());
	return json(atualizarAgente(params.id, input));
};

/** Agente e cadastro global (nao pertence a um Registro) — exclusao falha com 409 se estiver em uso por alguma Atividade. */
export const DELETE: RequestHandler = ({ params }) => {
	if (!obterAgente(params.id)) error(404, 'Agente nao encontrado.');
	try {
		excluirAgente(params.id);
	} catch (err) {
		toApiError(err);
	}
	return new Response(null, { status: 204 });
};
