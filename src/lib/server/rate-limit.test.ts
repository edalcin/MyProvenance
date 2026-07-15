import { describe, expect, it, beforeEach, vi } from 'vitest';
import { estaBloqueado, registrarFalha, limparTentativas } from './rate-limit';

describe('rate limit de login', () => {
	beforeEach(() => {
		vi.useRealTimers();
	});

	it('nao bloqueia antes de atingir o limite', () => {
		const chave = `user-${Math.random()}`;
		for (let i = 0; i < 4; i++) registrarFalha(chave);
		expect(estaBloqueado(chave)).toBe(false);
	});

	it('bloqueia apos 5 falhas seguidas', () => {
		const chave = `user-${Math.random()}`;
		for (let i = 0; i < 5; i++) registrarFalha(chave);
		expect(estaBloqueado(chave)).toBe(true);
	});

	it('libera apos o tempo de bloqueio passar', () => {
		vi.useFakeTimers();
		const chave = `user-${Math.random()}`;
		for (let i = 0; i < 5; i++) registrarFalha(chave);
		expect(estaBloqueado(chave)).toBe(true);
		vi.advanceTimersByTime(15 * 60 * 1000 + 1);
		expect(estaBloqueado(chave)).toBe(false);
		vi.useRealTimers();
	});

	it('limparTentativas reseta o contador', () => {
		const chave = `user-${Math.random()}`;
		for (let i = 0; i < 5; i++) registrarFalha(chave);
		expect(estaBloqueado(chave)).toBe(true);
		limparTentativas(chave);
		expect(estaBloqueado(chave)).toBe(false);
	});
});
