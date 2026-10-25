import { error } from '@sveltejs/kit';
import { adminAgenteEditSchema } from '#lib/schemas.js';
import { parseBody, toApiError } from '#lib/server/api-utils.js';
import { atualizarAgenteAdmin, excluirAgenteAdmin } from '#lib/server/db/repositories/admin.js';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const input = await parseBody(request, adminAgenteEditSchema);
	return Response.json(atualizarAgenteAdmin(input.id, input));
};

/** 409 se o Agente estiver em uso por alguma Atividade (FK). */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const { id } = await request.json();
	try {
		excluirAgenteAdmin(id);
	} catch (err) {
		toApiError(err);
	}
	return new Response(null, { status: 204 });
};
