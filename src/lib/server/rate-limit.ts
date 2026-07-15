/**
 * Rate limit de tentativas de login por username, em memória.
 * ponytail: lock em memória, global ao processo; revisar se a instância
 * virar multi-processo (não é o caso — single-user, um container).
 */
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;

interface Estado {
	falhas: number;
	bloqueadoAte: number | null;
}

const tentativas = new Map<string, Estado>();

export function estaBloqueado(chave: string): boolean {
	const estado = tentativas.get(chave);
	if (!estado?.bloqueadoAte) return false;
	if (Date.now() >= estado.bloqueadoAte) {
		tentativas.delete(chave);
		return false;
	}
	return true;
}

export function registrarFalha(chave: string): void {
	const estado = tentativas.get(chave) ?? { falhas: 0, bloqueadoAte: null };
	estado.falhas += 1;
	if (estado.falhas >= MAX_TENTATIVAS) {
		estado.bloqueadoAte = Date.now() + BLOQUEIO_MS;
	}
	tentativas.set(chave, estado);
}

export function limparTentativas(chave: string): void {
	tentativas.delete(chave);
}
