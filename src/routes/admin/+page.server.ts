import {
	listarUsuarios,
	listarTodosRegistros,
	listarTodosAgentes,
	listarTodosCompartilhamentos
} from '$lib/server/db/repositories/admin';
import type { PageServerLoad } from './$types';

// ponytail: sem paginacao — carrega todas as linhas e filtra no cliente (volume de instancia
// self-hosted single-admin e baixo). Mover para +server.ts com parsePaginationParams se crescer.
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.admin) return { autenticado: false as const };
	return {
		autenticado: true as const,
		usuarios: listarUsuarios(),
		registros: listarTodosRegistros(),
		agentes: listarTodosAgentes(),
		compartilhamentos: listarTodosCompartilhamentos()
	};
};
