import { describe, expect, it } from 'vitest';
import { criarAgente } from './agentes';
import { criarAtividade, RegraCardinalidadeError } from './atividades';
import { criarRegistro, finalizarRegistro, RegistroJaFinalizadoError } from './registros';
import { criarUsuario } from './usuarios';

// ponytail: DB_PATH=':memory:' injetado por vite.config.ts (test.env) — sem framework extra,
// checa so a regra de negocio que realmente ramifica (cardinalidade de Atividade).
// usuario real (nao string arbitraria) — usuario_id tem FK para usuarios(id).
const usuarioId = criarUsuario({ username: 'teste_atividades', pin: '123456' }).id;

describe('regra de cardinalidade de Atividade', () => {
	const agente = criarAgente(usuarioId, { nome: 'Fulana', tipo: 'pessoa' });

	it('Criacao gera 1 Entidade sem usar nenhuma', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro criacao' });
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'campo_bruto.csv' }]
		});
		expect(atividade.entidadesGeradas).toEqual([entidadesGeradas[0].id]);
		expect(atividade.entidadesUsadas).toHaveLength(0);
	});

	it('Criacao pode gerar mais de uma Entidade', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro criacao multipla' });
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'parte1.csv' }, { nome: 'parte2.csv' }]
		});
		expect(entidadesGeradas.map((e) => e.nome)).toEqual(['parte1.csv', 'parte2.csv']);
		expect(atividade.entidadesGeradas).toHaveLength(2);
	});

	it('Criacao sem gerar nenhuma Entidade e rejeitada', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro sem saida' });
		expect(() =>
			criarAtividade(usuarioId, registro.id, {
				tipo: 'criacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: []
			})
		).toThrow(RegraCardinalidadeError);
	});

	it('Criacao com Entidade de entrada e rejeitada', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro invalido' });
		expect(() =>
			criarAtividade(usuarioId, registro.id, {
				tipo: 'criacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: ['id-inexistente'],
				entidadesGeradas: [{ nome: 'x' }]
			})
		).toThrow(RegraCardinalidadeError);
	});

	it('Transformacao usa 1+ Entidades do mesmo Registro e gera 1', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro transformacao' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'campo_bruto.csv' }]
		});
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'campo_limpo.csv' }]
		});
		expect(atividade.entidadesUsadas).toEqual([brutas[0].id]);
		expect(entidadesGeradas[0].nome).toBe('campo_limpo.csv');
	});

	it('Transformacao pode gerar mais de uma Entidade', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro transformacao multipla' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'campo_bruto.csv' }]
		});
		const { entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'treino.csv' }, { nome: 'teste.csv' }]
		});
		expect(entidadesGeradas.map((e) => e.nome)).toEqual(['treino.csv', 'teste.csv']);
	});

	it('Transformacao sem Entidade gerada e rejeitada', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro transformacao invalida' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'campo_bruto.csv' }]
		});
		expect(() =>
			criarAtividade(usuarioId, registro.id, {
				tipo: 'transformacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [brutas[0].id]
			})
		).toThrow(RegraCardinalidadeError);
	});

	it('Analise aceita gerar 0 Entidades (relatorio sem saida)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro analise' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'campo_bruto.csv' }]
		});
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'analise',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id]
		});
		expect(entidadesGeradas).toHaveLength(0);
		expect(atividade.entidadesGeradas).toHaveLength(0);
	});

	it('Analise pode gerar mais de uma Entidade (varios artefatos de saida)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro analise multipla' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'campo_bruto.csv' }]
		});
		const { entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'analise',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'grafico.png' }, { nome: 'tabela.csv' }]
		});
		expect(entidadesGeradas.map((e) => e.nome)).toEqual(['grafico.png', 'tabela.csv']);
	});

	it('Entidade de outro Registro nao pode ser usada', () => {
		const registroA = criarRegistro(usuarioId, { titulo: 'Registro A' });
		const registroB = criarRegistro(usuarioId, { titulo: 'Registro B' });
		const { entidadesGeradas: deA } = criarAtividade(usuarioId, registroA.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'so_de_A.csv' }]
		});
		expect(() =>
			criarAtividade(usuarioId, registroB.id, {
				tipo: 'transformacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [deA[0].id],
				entidadesGeradas: [{ nome: 'x' }]
			})
		).toThrow(RegraCardinalidadeError);
	});
});

describe('ciclo de vida do Registro', () => {
	it('finalizar duas vezes e rejeitado (ADR-0003)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro finalizavel' });
		const finalizado = finalizarRegistro(registro.id, usuarioId);
		expect(finalizado.status).toBe('finalizado');
		expect(() => finalizarRegistro(registro.id, usuarioId)).toThrow(RegistroJaFinalizadoError);
	});
});
