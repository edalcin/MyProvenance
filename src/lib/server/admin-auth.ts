/**
 * Autenticacao da area administrativa — senha unica via env `ADM_PWD`, separada do login
 * username+PIN por Conta (docs admin-area-plan). Sessao admin em memoria, mesmo modelo single-
 * process de rate-limit.ts.
 */
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { gerarTokenSessao } from '$lib/server/auth';

/** Funcao pura testavel — comparacao em tempo constante, sem tocar `env` (facilita teste). */
export function senhasConferem(fornecida: string, esperada: string | undefined): boolean {
	if (!esperada) return false;
	const a = Buffer.from(fornecida);
	const b = Buffer.from(esperada);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export function verificarSenhaAdmin(fornecida: string): boolean {
	return senhasConferem(fornecida, env.ADM_PWD);
}

/** Link "Admin" no cabecalho so aparece quando a instancia tem `ADM_PWD` configurada. */
export function adminHabilitado(): boolean {
	return !!(env.ADM_PWD ?? '').trim();
}

// ponytail: sessao admin em memoria, processo unico (mesmo modelo de rate-limit.ts); tokens
// morrem no restart do container e no logout; adicionar TTL/persistencia so se necessario.
const tokensValidos = new Set<string>();

export function criarSessaoAdmin(): string {
	const token = gerarTokenSessao();
	tokensValidos.add(token);
	return token;
}

export function sessaoAdminValida(token: string | undefined): boolean {
	return !!token && tokensValidos.has(token);
}

export function encerrarSessaoAdmin(token: string | undefined): void {
	if (token) tokensValidos.delete(token);
}
