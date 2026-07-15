import { error, json } from '@sveltejs/kit';
import { criarRegistro, listarRegistros } from '$lib/server/db/repositories/registros';
import { sanitizarHtmlRico } from '$lib/server/sanitize';
import { registroInputSchema } from '$lib/schemas';
import { parseBody, parsePaginationParams } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const { busca, offset, limit } = parsePaginationParams(url);
	return json(listarRegistros(locals.usuario.id, { busca, offset, limit }));
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.usuario) error(401, 'Autenticacao necessaria.');
	const input = await parseBody(request, registroInputSchema);
	const registro = criarRegistro(locals.usuario.id, {
		titulo: input.titulo,
		descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : input.descricao
	});
	return json(registro, { status: 201 });
};
