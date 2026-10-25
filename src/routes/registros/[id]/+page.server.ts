import { error } from '@sveltejs/kit';
import { obterRegistroDetalhado } from '#lib/server/db/repositories/registros.js';
import { traduzir } from '#lib/i18n/index.js';
import type { PageServerLoad } from './$types';

/** Anonimo (sem conta): o detalhe vem da sessao local do cliente ($lib/client/dados) — null aqui. */
export const load: PageServerLoad = ({ params, locals }) => {
	if (!locals.usuario) return { detalhe: null };
	const detalhe = obterRegistroDetalhado(params.id, locals.usuario.id);
	if (!detalhe) error(404, traduzir(locals.idioma, 'error.record_not_found'));
	return { detalhe };
};
