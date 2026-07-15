import { error } from '@sveltejs/kit';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import type { PageServerLoad } from './$types';

// ponytail: anonimo recebe 404 aqui ate a Etapa 4 religar esta pagina pra sessao local do cliente
// (a pagina hoje assume data.detalhe sempre presente; null quebraria o typecheck sem a reescrita).
export const load: PageServerLoad = ({ params, locals }) => {
	if (!locals.usuario) error(404, 'Registro nao encontrado.');
	const detalhe = obterRegistroDetalhado(params.id, locals.usuario.id);
	if (!detalhe) error(404, 'Registro nao encontrado.');
	return { detalhe };
};
