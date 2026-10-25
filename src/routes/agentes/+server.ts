import { error } from '@sveltejs/kit';
import { criarAgente, listarAgentes } from '#lib/server/db/repositories/agentes.js';
import { agenteInputSchema } from '#lib/schemas.js';
import { parseBody, parsePaginationParams } from '#lib/server/api-utils.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const { busca, offset, limit } = parsePaginationParams(url);
	return Response.json(listarAgentes(locals.usuario.id, { busca, offset, limit }));
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const input = await parseBody(request, agenteInputSchema);
	return Response.json(criarAgente(locals.usuario.id, input), { status: 201 });
};
