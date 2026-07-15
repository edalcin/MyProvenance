import { json } from '@sveltejs/kit';
import { criarAgente, listarAgentes } from '$lib/server/db/repositories/agentes';
import { agenteInputSchema } from '$lib/schemas';
import { parseBody, parsePaginationParams } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const { busca, offset, limit } = parsePaginationParams(url);
	return json(listarAgentes({ busca, offset, limit }));
};

export const POST: RequestHandler = async ({ request }) => {
	const input = await parseBody(request, agenteInputSchema);
	return json(criarAgente(input), { status: 201 });
};
