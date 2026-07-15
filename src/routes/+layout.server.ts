import type { LayoutServerLoad } from './$types';

/** Hidrata usuarioAtual no cliente (ADR-0009) — null quando anonimo. */
export const load: LayoutServerLoad = ({ locals }) => {
	return { usuario: locals.usuario };
};
