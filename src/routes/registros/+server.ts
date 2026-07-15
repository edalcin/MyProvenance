import { json } from '@sveltejs/kit';
import { criarRegistro, listarRegistros } from '$lib/server/db/repositories/registros';
import { sanitizarHtmlRico } from '$lib/server/sanitize';
import { registroInputSchema } from '$lib/schemas';
import { parseBody, parsePaginationParams } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const { busca, offset, limit } = parsePaginationParams(url);
	return json(listarRegistros({ busca, offset, limit }));
};

export const POST: RequestHandler = async ({ request }) => {
	const input = await parseBody(request, registroInputSchema);
	const registro = criarRegistro({
		titulo: input.titulo,
		descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : input.descricao
	});
	return json(registro, { status: 201 });
};
