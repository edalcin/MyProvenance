import { error, json } from '@sveltejs/kit';
import {
	compartilharComUsuario,
	listarAcessos,
	removerCompartilhamento
} from '$lib/server/db/repositories/compartilhamentos';
import { compartilharUsuarioInputSchema } from '$lib/schemas';
import { parseBody, toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

/** Quem tem acesso ao Registro (dono + coeditores) — qualquer papel pode ver. */
export const GET: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	try {
		return json(listarAcessos(params.id, locals.usuario.id));
	} catch (err) {
		toApiError(err);
	}
};

/** Compartilha o Registro por username (idempotente: repetir so atualiza o papel). Administrador+. */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const input = await parseBody(request, compartilharUsuarioInputSchema);
	try {
		return json(compartilharComUsuario(params.id, locals.usuario.id, input));
	} catch (err) {
		toApiError(err);
	}
};

/** Remove o acesso de um usuario. Administrador+ remove qualquer um; qualquer coeditor sai sozinho. */
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const { usuarioId } = (await request.json()) as { usuarioId?: string };
	if (!usuarioId) error(400, 'error.invalid_json_body');
	try {
		removerCompartilhamento(params.id, locals.usuario.id, usuarioId);
		return new Response(null, { status: 204 });
	} catch (err) {
		toApiError(err);
	}
};
