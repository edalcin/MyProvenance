import { error } from '@sveltejs/kit';
import { alterarDirecaoDiagrama } from '#lib/server/db/repositories/registros.js';
import { direcaoDiagramaInputSchema } from '#lib/schemas.js';
import { parseBody, toApiError } from '#lib/server/api-utils.js';
import type { RequestHandler } from './$types';

/** Orientacao do diagrama Mermaid (TD/LR) — preferencia de UI, editavel em qualquer status. */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const input = await parseBody(request, direcaoDiagramaInputSchema);
	try {
		const registro = alterarDirecaoDiagrama(params.id, locals.usuario.id, input.direcao);
		return Response.json(registro);
	} catch (err) {
		toApiError(err);
	}
};
