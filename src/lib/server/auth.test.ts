import { describe, expect, it } from 'vitest';
import { gerarSaltHex, hashPin, verificarPin, gerarTokenSessao, hashToken } from './auth';

describe('hash de PIN', () => {
	it('PIN correto verifica com sucesso', () => {
		const salt = gerarSaltHex();
		const hash = hashPin('123456', salt);
		expect(verificarPin('123456', salt, hash)).toBe(true);
	});

	it('PIN errado falha', () => {
		const salt = gerarSaltHex();
		const hash = hashPin('123456', salt);
		expect(verificarPin('654321', salt, hash)).toBe(false);
	});

	it('salts diferentes geram hashes diferentes para o mesmo PIN', () => {
		const hash1 = hashPin('123456', gerarSaltHex());
		const hash2 = hashPin('123456', gerarSaltHex());
		expect(hash1).not.toBe(hash2);
	});
});

describe('token de sessao', () => {
	it('gera tokens diferentes a cada chamada', () => {
		expect(gerarTokenSessao()).not.toBe(gerarTokenSessao());
	});

	it('hashToken e deterministico', () => {
		const token = gerarTokenSessao();
		expect(hashToken(token)).toBe(hashToken(token));
	});
});
