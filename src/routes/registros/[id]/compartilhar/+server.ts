import { error, json } from '@sveltejs/kit';
import {
	ativarCompartilhamento,
	desativarCompartilhamento
} from '$lib/server/db/repositories/registros';
import { toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

/** Ativa o link publico de leitura (somente o dono pode ativar/desativar). */
export const POST: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	try {
		const registro = ativarCompartilhamento(params.id, locals.usuario.id);
		return json(registro);
	} catch (err) {
		toApiError(err);
	}
};

export const DELETE: RequestHandler = ({ params, locals }) => {
	if (!locals.usuario) error(401, 'error.auth_required');
	try {
		const registro = desativarCompartilhamento(params.id, locals.usuario.id);
		return json(registro);
	} catch (err) {
		toApiError(err);
	}
};
