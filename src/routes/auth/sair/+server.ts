import { json } from '@sveltejs/kit';
import { encerrarSessao } from '$lib/server/db/repositories/sessoes';
import { COOKIE_SESSAO } from '../../../hooks.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	const token = cookies.get(COOKIE_SESSAO);
	if (token) {
		encerrarSessao(token);
		cookies.delete(COOKIE_SESSAO, { path: '/' });
	}
	return json({ ok: true });
};
