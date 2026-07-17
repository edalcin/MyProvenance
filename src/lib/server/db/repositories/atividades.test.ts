import { describe, expect, it } from 'vitest';
import { criarAgente } from './agentes';
import { criarAtividade, atualizarAtividade, excluirAtividade } from './atividades';
import { RegraCardinalidadeError } from '$lib/cardinalidade';
import { obterEntidade } from './entidades';
import {
	criarRegistro,
	finalizarRegistro,
	RegistroJaFinalizadoError,
	RegistroNaoEncontradoError
} from './registros';
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

	it('Transformacao gerando revisao persiste tipoRelacaoOrigem e revisaoDeId', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro revisao' });
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
			entidadesGeradas: [
				{ nome: 'campo_limpo.csv', tipoRelacaoOrigem: 'revisao', revisaoDeId: brutas[0].id }
			]
		});
		const persistida = obterEntidade(entidadesGeradas[0].id)!;
		expect(persistida.tipoRelacaoOrigem).toBe('revisao');
		expect(persistida.revisaoDeId).toBe(brutas[0].id);
	});

	it('Revisao com revisaoDeId fora de entidadesUsadas e rejeitada', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro revisao invalida' });
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
				entidadesUsadas: [brutas[0].id],
				entidadesGeradas: [
					{ nome: 'campo_limpo.csv', tipoRelacaoOrigem: 'revisao', revisaoDeId: 'outro-id' }
				]
			})
		).toThrow(RegraCardinalidadeError);
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

describe('atualizarAtividade (edicao em Rascunho, ADR-0003)', () => {
	const agente = criarAgente(usuarioId, { nome: 'Fulano Edicao', tipo: 'pessoa' });
	const agente2 = criarAgente(usuarioId, { nome: 'Fulana Edicao 2', tipo: 'pessoa' });

	it('edita campos simples e a Entidade gerada existente', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro edicao simples' });
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date('2026-01-01').toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'original.csv' }]
		});

		const resultado = atualizarAtividade(usuarioId, registro.id, atividade.id, {
			agenteId: agente2.id,
			dataHora: new Date('2026-02-01').toISOString(),
			descricao: 'Editado',
			entidadesUsadas: [],
			entidadesGeradas: [{ id: entidadesGeradas[0].id, nome: 'renomeado.csv' }]
		});

		expect(resultado.atividade.agenteId).toBe(agente2.id);
		expect(resultado.atividade.descricao).toBe('Editado');
		expect(resultado.entidadesGeradas).toHaveLength(1);
		expect(resultado.entidadesGeradas[0].nome).toBe('renomeado.csv');
		expect(resultado.entidadesGeradas[0].id).toBe(entidadesGeradas[0].id);
	});

	it('adiciona e remove Entidades geradas na mesma edicao', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro edicao add remove' });
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'a.csv' }, { nome: 'b.csv' }]
		});

		const resultado = atualizarAtividade(usuarioId, registro.id, atividade.id, {
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ id: entidadesGeradas[0].id, nome: 'a.csv' }, { nome: 'c.csv' }]
		});

		expect(resultado.entidadesGeradas.map((e) => e.nome).sort()).toEqual(['a.csv', 'c.csv']);
		expect(resultado.entidadesGeradas.some((e) => e.id === entidadesGeradas[1].id)).toBe(false);
	});

	it('rejeita edicao apos Registro finalizado (ADR-0003)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro finalizado edicao' });
		const { atividade } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'x.csv' }]
		});
		finalizarRegistro(registro.id, usuarioId);

		expect(() =>
			atualizarAtividade(usuarioId, registro.id, atividade.id, {
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: [{ nome: 'y.csv' }]
			})
		).toThrow(RegistroJaFinalizadoError);
	});

	it('rejeita cardinalidade invalida na edicao (Transformacao sem Entidade usada)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro card invalida edicao' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'bruto.csv' }]
		});
		const { atividade } = criarAtividade(usuarioId, registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'limpo.csv' }]
		});

		expect(() =>
			atualizarAtividade(usuarioId, registro.id, atividade.id, {
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: [{ nome: 'limpo.csv' }]
			})
		).toThrow(RegraCardinalidadeError);
	});

	it('rejeita remover Entidade gerada que outra Atividade usa como entrada', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro entidade em uso edicao' });
		const { atividade: criacao, entidadesGeradas: brutas } = criarAtividade(
			usuarioId,
			registro.id,
			{
				tipo: 'criacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: [{ nome: 'usado_depois.csv' }]
			}
		);
		criarAtividade(usuarioId, registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'derivado.csv' }]
		});

		// sem id = troca a Entidade gerada original (em uso por outra Atividade) por uma nova —
		// a exclusao da antiga falha na FK (SqliteError generico, nao classe de dominio).
		expect(() =>
			atualizarAtividade(usuarioId, registro.id, criacao.id, {
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: [{ nome: 'outra.csv' }]
			})
		).toThrow();
	});

	it('rejeita editar Atividade de Registro de outro usuario', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro alheio edicao' });
		const { atividade } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'x.csv' }]
		});
		const outroUsuarioId = criarUsuario({ username: 'outro_teste_atividades', pin: '654321' }).id;

		expect(() =>
			atualizarAtividade(outroUsuarioId, registro.id, atividade.id, {
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: []
			})
		).toThrow(RegistroNaoEncontradoError);
	});
});

describe('excluirAtividade (edicao em Rascunho, ADR-0003)', () => {
	const agente = criarAgente(usuarioId, { nome: 'Fulano Exclusao', tipo: 'pessoa' });

	it('exclui Atividade e a Entidade que ela gerou (sem uso em outro lugar)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro exclusao simples' });
		const { atividade, entidadesGeradas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'apagar.csv' }]
		});

		excluirAtividade(usuarioId, registro.id, atividade.id);

		expect(() =>
			atualizarAtividade(usuarioId, registro.id, atividade.id, {
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: []
			})
		).toThrow(RegistroNaoEncontradoError);
		expect(obterEntidade(entidadesGeradas[0].id)).toBeNull();
	});

	it('exclui so a Entidade gerada pela Atividade removida, preserva as demais', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro exclusao transformacao' });
		const { entidadesGeradas: brutas } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'bruto.csv' }]
		});
		const { atividade: transformacao } = criarAtividade(usuarioId, registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'limpo.csv' }]
		});

		excluirAtividade(usuarioId, registro.id, transformacao.id);

		// bruto.csv (gerada pela Criacao, nao pela Transformacao removida) continua disponivel —
		// reusar numa Atividade nova prova que a Entidade nao foi apagada junto.
		expect(() =>
			criarAtividade(usuarioId, registro.id, {
				tipo: 'analise',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [brutas[0].id],
				entidadesGeradas: []
			})
		).not.toThrow();
	});

	it('rejeita excluir apos Registro finalizado (ADR-0003)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro finalizado exclusao' });
		const { atividade } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'x.csv' }]
		});
		finalizarRegistro(registro.id, usuarioId);

		expect(() => excluirAtividade(usuarioId, registro.id, atividade.id)).toThrow(
			RegistroJaFinalizadoError
		);
	});

	it('rejeita excluir Atividade cuja Entidade gerada esta em uso por outra Atividade', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro entidade em uso exclusao' });
		const { atividade: criacao, entidadesGeradas: brutas } = criarAtividade(
			usuarioId,
			registro.id,
			{
				tipo: 'criacao',
				agenteId: agente.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: [{ nome: 'usado_depois.csv' }]
			}
		);
		criarAtividade(usuarioId, registro.id, {
			tipo: 'transformacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [brutas[0].id],
			entidadesGeradas: [{ nome: 'derivado.csv' }]
		});

		expect(() => excluirAtividade(usuarioId, registro.id, criacao.id)).toThrow();
	});

	it('rejeita excluir Atividade de Registro de outro usuario', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro alheio exclusao' });
		const { atividade } = criarAtividade(usuarioId, registro.id, {
			tipo: 'criacao',
			agenteId: agente.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'x.csv' }]
		});
		const outroUsuarioId = criarUsuario({ username: 'outro_teste_exclusao', pin: '654321' }).id;

		expect(() => excluirAtividade(outroUsuarioId, registro.id, atividade.id)).toThrow(
			RegistroNaoEncontradoError
		);
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
