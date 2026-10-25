import { error } from '@sveltejs/kit';
import { adminRegistroEditSchema } from '#lib/schemas.js';
import { parseBody } from '#lib/server/api-utils.js';
import { atualizarRegistroAdmin, excluirRegistroAdmin } from '#lib/server/db/repositories/admin.js';
import { sanitizarHtmlRico } from '#lib/sanitize.js';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const input = await parseBody(request, adminRegistroEditSchema);
	return Response.json(
		atualizarRegistroAdmin(input.id, {
			titulo: input.titulo,
			descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : null,
			status: input.status,
			donoId: input.donoId
		})
	);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const { id } = await request.json();
	excluirRegistroAdmin(id);
	return new Response(null, { status: 204 });
};
