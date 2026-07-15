import { describe, expect, it } from 'vitest';
import { criarAgente } from './agentes';
import { criarAtividade, RegraCardinalidadeError } from './atividades';
import { criarRegistro, finalizarRegistro, RegistroJaFinalizadoError } from './registros';

// ponytail: DB_PATH=':memory:' injetado por vite.config.ts (test.env) — sem framework extra,
// checa so a regra de negocio que realmente ramifica (cardinalidade de Atividade).

describe('regra de cardinalidade de Atividade', () => {
	const agente = criarAgente({ nome: 'Fulana', tipo: 'pessoa' });

	it('Criacao gera 1 Entidade sem usar nenhuma', () => {
		const registro = criarRegistro({ titulo: 'Registro criacao' });
		const { atividade, entidadeGerada } = criarAtividade(registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadeGerada: { nome: 'campo_bruto.csv' }
		});
		expect(atividade.entidadeGeradaId).toBe(entidadeGerada?.id);
		expect(atividade.entidadesUsadas).toHaveLength(0);
	});

	it('Criacao com Entidade de entrada e rejeitada', () => {
		const registro = criarRegistro({ titulo: 'Registro invalido' });
		expect(() =>
			criarAtividade(registro.id, {
				tipo: 'criacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: ['id-inexistente'],
				entidadeGerada: { nome: 'x' }
			})
		).toThrow(RegraCardinalidadeError);
	});

	it('Transformacao usa 1+ Entidades do mesmo Registro e gera 1', () => {
		const registro = criarRegistro({ titulo: 'Registro transformacao' });
		const { entidadeGerada: bruta } = criarAtividade(registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadeGerada: { nome: 'campo_bruto.csv' }
		});
		const { atividade, entidadeGerada } = criarAtividade(registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [bruta!.id],
			entidadeGerada: { nome: 'campo_limpo.csv' }
		});
		expect(atividade.entidadesUsadas).toEqual([bruta!.id]);
		expect(entidadeGerada?.nome).toBe('campo_limpo.csv');
	});

	it('Transformacao sem Entidade gerada e rejeitada', () => {
		const registro = criarRegistro({ titulo: 'Registro transformacao invalida' });
		const { entidadeGerada: bruta } = criarAtividade(registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadeGerada: { nome: 'campo_bruto.csv' }
		});
		expect(() =>
			criarAtividade(registro.id, {
				tipo: 'transformacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [bruta!.id]
			})
		).toThrow(RegraCardinalidadeError);
	});

	it('Analise aceita gerar 0 Entidades (relatorio sem saida)', () => {
		const registro = criarRegistro({ titulo: 'Registro analise' });
		const { entidadeGerada: bruta } = criarAtividade(registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadeGerada: { nome: 'campo_bruto.csv' }
		});
		const { atividade, entidadeGerada } = criarAtividade(registro.id, {
			tipo: 'analise',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [bruta!.id]
		});
		expect(entidadeGerada).toBeNull();
		expect(atividade.entidadeGeradaId).toBeNull();
	});

	it('Entidade de outro Registro nao pode ser usada', () => {
		const registroA = criarRegistro({ titulo: 'Registro A' });
		const registroB = criarRegistro({ titulo: 'Registro B' });
		const { entidadeGerada: entidadeDeA } = criarAtividade(registroA.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadeGerada: { nome: 'so_de_A.csv' }
		});
		expect(() =>
			criarAtividade(registroB.id, {
				tipo: 'transformacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [entidadeDeA!.id],
				entidadeGerada: { nome: 'x' }
			})
		).toThrow(RegraCardinalidadeError);
	});
});

describe('ciclo de vida do Registro', () => {
	it('finalizar duas vezes e rejeitado (ADR-0003)', () => {
		const registro = criarRegistro({ titulo: 'Registro finalizavel' });
		const finalizado = finalizarRegistro(registro.id);
		expect(finalizado.status).toBe('finalizado');
		expect(() => finalizarRegistro(registro.id)).toThrow(RegistroJaFinalizadoError);
	});
});
