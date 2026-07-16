import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { entrarSchema } from '$lib/schemas';
import { parseBody } from '$lib/server/api-utils';
import { autenticar } from '$lib/server/db/repositories/usuarios';
import { criarSessao } from '$lib/server/db/repositories/sessoes';
import { estaBloqueado, registrarFalha, limparTentativas } from '$lib/server/rate-limit';
import { COOKIE_SESSAO } from '../../../hooks.server';
import type { RequestHandler } from './$types';

const MENSAGEM_INVALIDA = 'error.invalid_credentials';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const input = await parseBody(request, entrarSchema);

	if (estaBloqueado(input.username)) {
		error(429, 'error.too_many_attempts');
	}

	const usuario = autenticar(input.username, input.pin);
	if (!usuario) {
		registrarFalha(input.username);
		error(401, MENSAGEM_INVALIDA);
	}
	limparTentativas(input.username);

	const { token, expiraEm } = criarSessao(usuario.id);
	cookies.set(COOKIE_SESSAO, token, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires: new Date(expiraEm)
	});
	return json(usuario);
};
