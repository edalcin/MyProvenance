import { error, json } from '@sveltejs/kit';
import { atualizarAtividade } from '$lib/server/db/repositories/atividades';
import { atualizarAtividadeInputSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

/** Edicao so em Registro Rascunho (ADR-0003) — tipo da Atividade e imutavel. */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const input = await parseBody(request, atualizarAtividadeInputSchema);
	try {
		const resultado = atualizarAtividade(locals.usuario.id, params.id, params.atividadeId, input);
		return json(resultado);
	} catch (err) {
		toApiError(err);
	}
};
