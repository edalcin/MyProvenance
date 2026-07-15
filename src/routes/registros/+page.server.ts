import { listarRegistros } from '$lib/server/db/repositories/registros';
import type { PageServerLoad } from './$types';

/** Anonimo (sem conta): a tela usa a sessao local do cliente (dados.ts) — o load so serve para conta autenticada. */
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.usuario) return { pagina: { items: [], nextOffset: null } };
	return { pagina: listarRegistros(locals.usuario.id, { limit: 20 }) };
};
