import { listarAgentes } from '$lib/server/db/repositories/agentes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { pagina: listarAgentes({ limit: 30 }) };
};
