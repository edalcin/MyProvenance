import { error } from '@sveltejs/kit';
import { criarBackup } from '$lib/server/db/backup';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) => {
	if (!locals.admin) error(401, 'error.admin_required');

	const buffer = criarBackup();
	const data = new Date().toISOString().slice(0, 10);
	return new Response(new Uint8Array(buffer), {
		headers: {
			'content-type': 'application/vnd.sqlite3',
			'content-disposition': `attachment; filename="myprovenance-backup-${data}.sqlite"`
		}
	});
};
