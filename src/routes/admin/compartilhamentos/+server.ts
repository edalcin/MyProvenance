import { error, json } from '@sveltejs/kit';
import { adminCompartilhamentoEditSchema } from '$lib/schemas';
import { parseBody } from '$lib/server/api-utils';
import {
	atualizarCompartilhamentoAdmin,
	excluirCompartilhamentoAdmin
} from '$lib/server/db/repositories/admin';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const input = await parseBody(request, adminCompartilhamentoEditSchema);
	atualizarCompartilhamentoAdmin(input.registroId, input.usuarioId, input.papel);
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const { registroId, usuarioId } = await request.json();
	excluirCompartilhamentoAdmin(registroId, usuarioId);
	return new Response(null, { status: 204 });
};
