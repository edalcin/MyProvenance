import { describe, expect, it } from 'vitest';
import { gerarRelatorioMarkdown } from './report';
import { slugify } from '$lib/slug';
import type { RegistroDetalhado } from './types';

describe('slugify', () => {
	it('remove acentos, minusculiza e troca separadores por hifen', () => {
		expect(slugify('Levantamento — Trilha do Ouro (2026)')).toBe(
			'levantamento-trilha-do-ouro-2026'
		);
	});

	it('cai para "registro" quando nao sobra nada alfanumerico', () => {
		expect(slugify('***')).toBe('registro');
	});
});

describe('gerarRelatorioMarkdown', () => {
	const detalheVazio: RegistroDetalhado = {
		registro: {
			id: 'r1',
			titulo: 'Registro vazio',
			descricao: null,
			status: 'rascunho',
			criadoEm: '2026-03-01T10:00:00.000Z',
			finalizadoEm: null,
			direcaoDiagrama: 'LR',
			tokenCompartilhamento: null
		},
		entidades: [],
		atividades: [],
		agentesEnvolvidos: []
	};

	it('inclui cabecalho, secoes e bloco mermaid mesmo sem dados', () => {
		const md = gerarRelatorioMarkdown(detalheVazio, '2026-03-15T18:00:00.000Z');
		expect(md).toContain('# Registro vazio');
		expect(md).toContain('**Status:** Rascunho');
		expect(md).toContain('```mermaid');
		expect(md).toContain('## Entidades');
		expect(md).toContain('## Linha do tempo de Atividades');
		expect(md).toContain('## Agentes envolvidos');
		expect(md).toContain('_Nenhuma Entidade._');
	});

	it('escapa pipes em celulas de tabela para nao quebrar o markdown', () => {
		const detalhe: RegistroDetalhado = {
			...detalheVazio,
			entidades: [
				{
					id: 'e1',
					registroId: 'r1',
					nome: 'arquivo|com|pipe.csv',
					descricao: null,
					formato: 'CSV',
					localizacao: null,
					licenca: null,
					geradaPorAtividadeId: 'a1'
				}
			]
		};
		const md = gerarRelatorioMarkdown(detalhe, '2026-03-15T18:00:00.000Z');
		expect(md).toContain('arquivo\\|com\\|pipe.csv');
	});

	it('locale "en" traduz cabecalhos e status', () => {
		const md = gerarRelatorioMarkdown(detalheVazio, '2026-03-15T18:00:00.000Z', 'en');
		expect(md).toContain('**Status:** Draft');
		expect(md).toContain('## Entities');
		expect(md).toContain('_No entities._');
	});
});
