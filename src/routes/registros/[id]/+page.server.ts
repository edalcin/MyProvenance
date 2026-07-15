import { error } from '@sveltejs/kit';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const detalhe = obterRegistroDetalhado(params.id);
	if (!detalhe) error(404, 'Registro nao encontrado.');
	return { detalhe };
};
