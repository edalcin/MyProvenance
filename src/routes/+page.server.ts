import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Tela inicial e a Lista de Registros (especificacao.md §7). */
export const load: PageServerLoad = () => {
	redirect(307, '/registros');
};
