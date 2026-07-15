import { listarRegistros } from '$lib/server/db/repositories/registros';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { pagina: listarRegistros({ limit: 20 }) };
};
