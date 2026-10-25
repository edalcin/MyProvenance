import { error } from '@sveltejs/kit';
import { dev } from '$app/env';
import { adminSenhaSchema } from '#lib/schemas.js';
import { parseBody } from '#lib/server/api-utils.js';
import { verificarSenhaAdmin, criarSessaoAdmin } from '#lib/server/admin-auth.js';
import { estaBloqueado, registrarFalha, limparTentativas } from '#lib/server/rate-limit.js';
import { COOKIE_ADMIN } from '../../../hooks.server';
import type { RequestHandler } from './$types';

const CHAVE_RATE_LIMIT = '__admin__';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const input = await parseBody(request, adminSenhaSchema);

	if (estaBloqueado(CHAVE_RATE_LIMIT)) {
		error(429, 'error.too_many_attempts');
	}

	if (!verificarSenhaAdmin(input.senha)) {
		registrarFalha(CHAVE_RATE_LIMIT);
		error(401, 'error.invalid_admin_password');
	}
	limparTentativas(CHAVE_RATE_LIMIT);

	const token = criarSessaoAdmin();
	cookies.set(COOKIE_ADMIN, token, { path: '/', httpOnly: true, secure: !dev, sameSite: 'lax' });
	return Response.json({ ok: true });
};
