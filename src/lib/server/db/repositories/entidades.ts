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
		geradaPorAtividadeId: row.gerada_por_atividade_id
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
		`INSERT INTO entidades (id, registro_id, nome, descricao, formato, localizacao, licenca, gerada_por_atividade_id)
		 VALUES (@id, @registroId, @nome, @descricao, @formato, @localizacao, @licenca, @geradaPorAtividadeId)`
	).run(entidade);
}
