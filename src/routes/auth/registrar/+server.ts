import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { registrarUsuarioSchema } from '$lib/schemas';
import { parseBody } from '$lib/server/api-utils';
import { criarUsuario, obterUsuarioPorUsername } from '$lib/server/db/repositories/usuarios';
import { criarSessao } from '$lib/server/db/repositories/sessoes';
import { COOKIE_SESSAO } from '../../../hooks.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const input = await parseBody(request, registrarUsuarioSchema);
	if (obterUsuarioPorUsername(input.username)) {
		error(409, 'Nome de usuario ja esta em uso.');
	}
	const usuario = criarUsuario(input);
	const { token, expiraEm } = criarSessao(usuario.id);
	cookies.set(COOKIE_SESSAO, token, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		expires: new Date(expiraEm)
	});
	return json(usuario, { status: 201 });
};
