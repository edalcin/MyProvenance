import { error, json } from '@sveltejs/kit';
import { adminRegistroEditSchema } from '$lib/schemas';
import { parseBody } from '$lib/server/api-utils';
import { atualizarRegistroAdmin, excluirRegistroAdmin } from '$lib/server/db/repositories/admin';
import { sanitizarHtmlRico } from '$lib/sanitize';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const input = await parseBody(request, adminRegistroEditSchema);
	return json(
		atualizarRegistroAdmin(input.id, {
			titulo: input.titulo,
			descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : null,
			status: input.status
		})
	);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');
	const { id } = await request.json();
	excluirRegistroAdmin(id);
	return new Response(null, { status: 204 });
};
