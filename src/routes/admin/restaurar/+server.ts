import { error, json } from '@sveltejs/kit';
import { restaurarBackup } from '$lib/server/db/backup';
import { toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');

	const buffer = Buffer.from(await request.arrayBuffer());
	if (buffer.length === 0) error(400, 'error.backup_invalid_file');

	try {
		restaurarBackup(buffer);
	} catch (err) {
		toApiError(err);
	}
	return json({ ok: true });
};
