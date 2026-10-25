import { error } from '@sveltejs/kit';
import { criarRegistro, listarRegistros } from '#lib/server/db/repositories/registros.js';
import { sanitizarHtmlRico } from '#lib/sanitize.js';
import { registroInputSchema } from '#lib/schemas.js';
import { parseBody, parsePaginationParams } from '#lib/server/api-utils.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const { busca, offset, limit } = parsePaginationParams(url);
	return Response.json(listarRegistros(locals.usuario.id, { busca, offset, limit }));
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	const input = await parseBody(request, registroInputSchema);
	const registro = criarRegistro(locals.usuario.id, {
		titulo: input.titulo,
		descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : input.descricao
	});
	return Response.json(registro, { status: 201 });
};
