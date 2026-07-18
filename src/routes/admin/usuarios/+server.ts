import { error, json } from '@sveltejs/kit';
import { adminUsuarioEditSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import { atualizarUsuario, excluirUsuario } from '$lib/server/db/repositories/admin';
import { obterUsuarioPorUsername } from '$lib/server/db/repositories/usuarios';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const input = await parseBody(request, adminUsuarioEditSchema);
	const existente = obterUsuarioPorUsername(input.username);
	if (existente && existente.id !== input.id) error(409, 'error.username_taken');
	return json(atualizarUsuario(input.id, { username: input.username, pin: input.pin }));
};

/** Cascata (Registros/Agentes/compartilhamentos da Conta) — ver admin.ts:excluirUsuario. */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const { id } = await request.json();
	try {
		excluirUsuario(id);
	} catch (err) {
		toApiError(err);
	}
	return new Response(null, { status: 204 });
};
