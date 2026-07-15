import { error, json } from '@sveltejs/kit';
import { criarAtividade } from '$lib/server/db/repositories/atividades';
import { obterRegistro } from '$lib/server/db/repositories/registros';
import { criarAtividadeInputSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

/** Sempre permitido, mesmo com Registro finalizado — finalizado so bloqueia editar/excluir historico (ADR-0003). */
export const POST: RequestHandler = async ({ params, request }) => {
	if (!obterRegistro(params.id)) error(404, 'Registro nao encontrado.');
	const input = await parseBody(request, criarAtividadeInputSchema);
	try {
		const resultado = criarAtividade(params.id, input);
		return json(resultado, { status: 201 });
	} catch (err) {
		toApiError(err);
	}
};
