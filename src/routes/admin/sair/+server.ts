import { json } from '@sveltejs/kit';
import { encerrarSessaoAdmin } from '$lib/server/admin-auth';
import { COOKIE_ADMIN } from '../../../hooks.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	encerrarSessaoAdmin(cookies.get(COOKIE_ADMIN));
	cookies.delete(COOKIE_ADMIN, { path: '/' });
	return json({ ok: true });
};
