import { error } from '@sveltejs/kit';
import { obterRegistroDetalhadoPorToken } from '$lib/server/db/repositories/registros';
import { traduzir } from '$lib/i18n';
import type { PageServerLoad } from './$types';

/** Rota publica (sem sessao) — link de compartilhamento somente leitura, ver §7. */
export const load: PageServerLoad = ({ params, locals }) => {
	const detalhe = obterRegistroDetalhadoPorToken(params.token);
	if (!detalhe) error(404, traduzir(locals.idioma, 'error.record_not_found'));
	return { detalhe };
};
