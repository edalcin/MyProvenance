import { describe, expect, it } from 'vitest';
import { gerarDiagramaMermaid } from './mermaid';
import type { Agente, Atividade, Entidade } from './types';

const agente: Agente = {
	id: 'ag1',
	nome: 'Fulana',
	tipo: 'pessoa',
	afiliacao: null,
	identificadorExterno: null
};

function entidade(id: string, nome: string, geradaPor: string): Entidade {
	return {
		id,
		registroId: 'r1',
		nome,
		descricao: null,
		formato: 'CSV',
		localizacao: null,
		licenca: null,
		geradaPorAtividadeId: geradaPor
	};
}

function atividade(
	partial: Partial<Atividade> &
		Pick<Atividade, 'id' | 'tipo' | 'entidadesUsadas' | 'entidadesGeradas'>
): Atividade {
	return {
		registroId: 'r1',
		agenteId: 'ag1',
		dataHora: '2026-03-05T10:00:00.000Z',
		descricao: null,
		local: null,
		instrumento: null,
		processo: null,
		parametros: null,
		ambienteExecucao: null,
		...partial
	};
}

describe('gerarDiagramaMermaid', () => {
	it('Criacao vira no raiz sem seta de entrada', () => {
		const e1 = entidade('e1', 'campo_bruto.csv', 'a1');
		const a1 = atividade({
			id: 'a1',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e1']
		});
		const saida = gerarDiagramaMermaid({
			entidades: [e1],
			atividades: [a1],
			agentesEnvolvidos: [agente]
		});
		expect(saida).toContain('E1["campo_bruto.csv (CSV)"]');
		expect(saida).not.toContain('-->');
	});

	it('Transformacao desenha seta rotulada da entrada para a saida', () => {
		const e1 = entidade('e1', 'bruto.csv', 'a1');
		const e2 = entidade('e2', 'limpo.csv', 'a2');
		const a1 = atividade({
			id: 'a1',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e1']
		});
		const a2 = atividade({
			id: 'a2',
			tipo: 'transformacao',
			entidadesUsadas: ['e1'],
			entidadesGeradas: ['e2'],
			descricao: 'limpeza'
		});
		const saida = gerarDiagramaMermaid({
			entidades: [e1, e2],
			atividades: [a1, a2],
			agentesEnvolvidos: [agente]
		});
		expect(saida).toContain('E1 -->|"Transformação: limpeza (Fulana, 2026-03-05)"| E2');
	});

	it('fusao de duas Entidades repete a seta em cada entrada convergindo no mesmo no', () => {
		const e1 = entidade('e1', 'a.csv', 'a1');
		const e2 = entidade('e2', 'b.csv', 'a2');
		const e3 = entidade('e3', 'combinado.csv', 'a3');
		const a1 = atividade({
			id: 'a1',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e1']
		});
		const a2 = atividade({
			id: 'a2',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e2']
		});
		const a3 = atividade({
			id: 'a3',
			tipo: 'transformacao',
			entidadesUsadas: ['e1', 'e2'],
			entidadesGeradas: ['e3']
		});
		const saida = gerarDiagramaMermaid({
			entidades: [e1, e2, e3],
			atividades: [a1, a2, a3],
			agentesEnvolvidos: [agente]
		});
		expect(saida).toContain('E1 -->|"Transformação (Fulana, 2026-03-05)"| E3');
		expect(saida).toContain('E2 -->|"Transformação (Fulana, 2026-03-05)"| E3');
	});

	it('uma Atividade pode gerar mais de uma Entidade — seta para cada saida', () => {
		const e1 = entidade('e1', 'bruto.csv', 'a1');
		const e2 = entidade('e2', 'parte1.csv', 'a2');
		const e3 = entidade('e3', 'parte2.csv', 'a2');
		const a1 = atividade({
			id: 'a1',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e1']
		});
		const a2 = atividade({
			id: 'a2',
			tipo: 'transformacao',
			entidadesUsadas: ['e1'],
			entidadesGeradas: ['e2', 'e3']
		});
		const saida = gerarDiagramaMermaid({
			entidades: [e1, e2, e3],
			atividades: [a1, a2],
			agentesEnvolvidos: [agente]
		});
		expect(saida).toContain('E1 -->|"Transformação (Fulana, 2026-03-05)"| E2');
		expect(saida).toContain('E1 -->|"Transformação (Fulana, 2026-03-05)"| E3');
	});

	it('Analise sem saida nao aparece no diagrama', () => {
		const e1 = entidade('e1', 'bruto.csv', 'a1');
		const a1 = atividade({
			id: 'a1',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e1']
		});
		const a2 = atividade({
			id: 'a2',
			tipo: 'analise',
			entidadesUsadas: ['e1'],
			entidadesGeradas: []
		});
		const saida = gerarDiagramaMermaid({
			entidades: [e1],
			atividades: [a1, a2],
			agentesEnvolvidos: [agente]
		});
		expect(saida).not.toContain('Análise');
	});

	it('escapa aspas duplas no nome da Entidade', () => {
		const e1 = entidade('e1', 'arquivo "especial".csv', 'a1');
		const a1 = atividade({
			id: 'a1',
			tipo: 'criacao',
			entidadesUsadas: [],
			entidadesGeradas: ['e1']
		});
		const saida = gerarDiagramaMermaid({
			entidades: [e1],
			atividades: [a1],
			agentesEnvolvidos: [agente]
		});
		expect(saida).toContain(`arquivo 'especial'.csv`);
	});
});
