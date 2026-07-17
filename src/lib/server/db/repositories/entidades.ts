import { db } from '../client';
import type { Entidade } from '$lib/types';

interface EntidadeRow {
	id: string;
	registro_id: string;
	nome: string;
	descricao: string | null;
	formato: string | null;
	localizacao: string | null;
	licenca: string | null;
	gerada_por_atividade_id: string;
	tipo_relacao_origem: string | null;
	revisao_de_id: string | null;
}

function mapRow(row: EntidadeRow): Entidade {
	return {
		id: row.id,
		registroId: row.registro_id,
		nome: row.nome,
		descricao: row.descricao,
		formato: row.formato,
		localizacao: row.localizacao,
		licenca: row.licenca,
		geradaPorAtividadeId: row.gerada_por_atividade_id,
		tipoRelacaoOrigem: row.tipo_relacao_origem as 'derivacao' | 'revisao' | null,
		revisaoDeId: row.revisao_de_id
	};
}

export function listarEntidadesPorRegistro(registroId: string): Entidade[] {
	const rows = db
		.prepare('SELECT * FROM entidades WHERE registro_id = @registroId ORDER BY rowid')
		.all({ registroId }) as EntidadeRow[];
	return rows.map(mapRow);
}

export function obterEntidade(id: string): Entidade | null {
	const row = db.prepare('SELECT * FROM entidades WHERE id = @id').get({ id }) as
		EntidadeRow | undefined;
	return row ? mapRow(row) : null;
}

/** Uso interno — Entidade so nasce como efeito de criarAtividade() (ver repositories/atividades.ts). */
export function inserirEntidade(entidade: Entidade): void {
	db.prepare(
		`INSERT INTO entidades (id, registro_id, nome, descricao, formato, localizacao, licenca, gerada_por_atividade_id, tipo_relacao_origem, revisao_de_id)
		 VALUES (@id, @registroId, @nome, @descricao, @formato, @localizacao, @licenca, @geradaPorAtividadeId, @tipoRelacaoOrigem, @revisaoDeId)`
	).run(entidade);
}

export interface EntidadeEditInput {
	nome: string;
	descricao?: string | null;
	formato?: string | null;
	localizacao?: string | null;
	licenca?: string | null;
	tipoRelacaoOrigem?: 'derivacao' | 'revisao' | null;
	revisaoDeId?: string | null;
}

/** Uso interno — Entidade so e' editada como efeito de atualizarAtividade() (ver repositories/atividades.ts). */
export function atualizarEntidade(id: string, input: EntidadeEditInput): void {
	db.prepare(
		`UPDATE entidades SET nome = @nome, descricao = @descricao, formato = @formato,
		 localizacao = @localizacao, licenca = @licenca, tipo_relacao_origem = @tipoRelacaoOrigem,
		 revisao_de_id = @revisaoDeId WHERE id = @id`
	).run({
		id,
		nome: input.nome,
		descricao: input.descricao ?? null,
		formato: input.formato ?? null,
		localizacao: input.localizacao ?? null,
		licenca: input.licenca ?? null,
		tipoRelacaoOrigem: input.tipoRelacaoOrigem ?? null,
		revisaoDeId: input.tipoRelacaoOrigem === 'revisao' ? (input.revisaoDeId ?? null) : null
	});
}

/** Uso interno — so removida se nao estiver em uso como entrada de outra Atividade (FK bloqueia). */
export function excluirEntidade(id: string): void {
	db.prepare('DELETE FROM entidades WHERE id = @id').run({ id });
}
