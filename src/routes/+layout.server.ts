import { env } from '$env/dynamic/private';
import { adminHabilitado } from '$lib/server/admin-auth';
import type { LayoutServerLoad } from './$types';

/** Hidrata usuarioAtual no cliente (ADR-0009) — null quando anonimo. */
export const load: LayoutServerLoad = ({ locals }) => {
	return {
		usuario: locals.usuario,
		idioma: locals.idioma,
		// URL_BASE (docker) monta o link publico de compartilhamento com o host externo real —
		// url.origin do request nao serve aqui (proxy/porta mapeada divergem do host interno).
		urlBase: (env.URL_BASE ?? '').replace(/\/+$/, ''),
		adminHabilitado: adminHabilitado()
	};
};
