import { describe, expect, it } from 'vitest';
import {
	senhasConferem,
	criarSessaoAdmin,
	sessaoAdminValida,
	encerrarSessaoAdmin
} from './admin-auth';

describe('senhasConferem', () => {
	it('senhas iguais conferem', () => {
		expect(senhasConferem('segredo', 'segredo')).toBe(true);
	});

	it('senhas diferentes de mesmo comprimento nao conferem', () => {
		expect(senhasConferem('x', 'y')).toBe(false);
	});

	it('esperada undefined nunca confere', () => {
		expect(senhasConferem('x', undefined)).toBe(false);
	});

	it('comprimentos diferentes nao conferem', () => {
		expect(senhasConferem('x', 'xy')).toBe(false);
	});

	it('esperada vazia nunca confere', () => {
		expect(senhasConferem('', '')).toBe(false);
	});
});

describe('sessao admin', () => {
	it('token criado e valido ate ser encerrado', () => {
		const tk = criarSessaoAdmin();
		expect(sessaoAdminValida(tk)).toBe(true);
		encerrarSessaoAdmin(tk);
		expect(sessaoAdminValida(tk)).toBe(false);
	});

	it('cada chamada gera um token diferente', () => {
		expect(criarSessaoAdmin()).not.toBe(criarSessaoAdmin());
	});

	it('token undefined nunca e valido', () => {
		expect(sessaoAdminValida(undefined)).toBe(false);
	});
});
