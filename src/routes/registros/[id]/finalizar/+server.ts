import { json } from '@sveltejs/kit';
import { finalizarRegistro } from '$lib/server/db/repositories/registros';
import { toApiError } from '$lib/server/api-utils';
import type { RequestHandler } from './$types';

/** Rascunho -> Finalizado (ADR-0003). A partir daqui o historico existente vira imutavel. */
export const POST: RequestHandler = ({ params }) => {
	try {
		return json(finalizarRegistro(params.id));
	} catch (err) {
		toApiError(err);
	}
};
