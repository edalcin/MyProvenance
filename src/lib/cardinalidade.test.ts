import { describe, expect, it } from 'vitest';
import { RegraCardinalidadeError, validarCardinalidade } from './cardinalidade';

// ponytail: pura, sem DB — roda tanto pro repository do servidor quanto pra sessao anonima do cliente.

describe('validarCardinalidade', () => {
	it('Criacao sem usar Entidades e gerando 1+ e valida', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'criacao', entidadesUsadas: [], entidadesGeradas: [{}] })
		).not.toThrow();
	});

	it('Criacao usando alguma Entidade e rejeitada', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'criacao', entidadesUsadas: ['e1'], entidadesGeradas: [{}] })
		).toThrow(RegraCardinalidadeError);
	});

	it('Criacao sem gerar nenhuma Entidade e rejeitada', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'criacao', entidadesUsadas: [], entidadesGeradas: [] })
		).toThrow(RegraCardinalidadeError);
	});

	it('Transformacao usando 1+ e gerando 1+ e valida', () => {
		expect(() =>
			validarCardinalidade({
				tipo: 'transformacao',
				entidadesUsadas: ['e1'],
				entidadesGeradas: [{}]
			})
		).not.toThrow();
	});

	it('Transformacao sem usar nenhuma Entidade e rejeitada', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'transformacao', entidadesUsadas: [], entidadesGeradas: [{}] })
		).toThrow(RegraCardinalidadeError);
	});

	it('Transformacao sem gerar nenhuma Entidade e rejeitada', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'transformacao', entidadesUsadas: ['e1'], entidadesGeradas: [] })
		).toThrow(RegraCardinalidadeError);
	});

	it('Analise usando 1+ e sem gerar nenhuma e valida (relatorio sem saida)', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'analise', entidadesUsadas: ['e1'], entidadesGeradas: [] })
		).not.toThrow();
	});

	it('Analise usando 1+ e gerando varias e valida', () => {
		expect(() =>
			validarCardinalidade({
				tipo: 'analise',
				entidadesUsadas: ['e1'],
				entidadesGeradas: [{}, {}]
			})
		).not.toThrow();
	});

	it('Analise sem usar nenhuma Entidade e rejeitada', () => {
		expect(() =>
			validarCardinalidade({ tipo: 'analise', entidadesUsadas: [], entidadesGeradas: [] })
		).toThrow(RegraCardinalidadeError);
	});
});
