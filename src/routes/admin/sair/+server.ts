import { encerrarSessaoAdmin } from '#lib/server/admin-auth.js';
import { COOKIE_ADMIN } from '../../../hooks.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	encerrarSessaoAdmin(cookies.get(COOKIE_ADMIN));
	cookies.delete(COOKIE_ADMIN, { path: '/' });
	return Response.json({ ok: true });
};
