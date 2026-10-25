import { error } from '@sveltejs/kit';
import { adminCompartilhamentoEditSchema } from '#lib/schemas.js';
import { parseBody } from '#lib/server/api-utils.js';
import {
	atualizarCompartilhamentoAdmin,
	excluirCompartilhamentoAdmin
} from '#lib/server/db/repositories/admin.js';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const input = await parseBody(request, adminCompartilhamentoEditSchema);
	atualizarCompartilhamentoAdmin(input.registroId, input.usuarioId, input.papel);
	return Response.json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const { registroId, usuarioId } = await request.json();
	excluirCompartilhamentoAdmin(registroId, usuarioId);
	return new Response(null, { status: 204 });
};
