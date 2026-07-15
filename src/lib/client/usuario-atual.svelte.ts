/**
 * Usuario autenticado da sessao atual — hidratado por +layout.server.ts (ADR-0009).
 * `dados.ts` consulta isto para decidir fetch (autenticado) vs sessao anonima local.
 */
import type { Usuario } from '$lib/types';

let usuario = $state<Usuario | null>(null);

export const usuarioAtual = {
	get valor() {
		return usuario;
	},
	definir(novo: Usuario | null) {
		usuario = novo;
	}
};
