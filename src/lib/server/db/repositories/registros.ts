import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type { Agente, RegistroDetalhado, RegistroProvenencia, StatusRegistro } from '$lib/types';
import { obterAgente } from './agentes';
import { listarEntidadesPorRegistro } from './entidades';
import { listarAtividadesPorRegistro } from './atividades';

interface RegistroRow {
	id: string;
	titulo: string;
	descricao: string | null;
	status: StatusRegistro;
	criado_em: string;
	finalizado_em: string | null;
}

function mapRow(row: RegistroRow): RegistroProvenencia {
	return {
		id: row.id,
		titulo: row.titulo,
		descricao: row.descricao,
		status: row.status,
		criadoEm: row.criado_em,
		finalizadoEm: row.finalizado_em
	};
}

export interface ListagemRegistros {
	items: RegistroProvenencia[];
	nextOffset: number | null;
}

export function listarRegistros(
	usuarioId: string,
	opts: { busca?: string; offset?: number; limit?: number } = {}
): ListagemRegistros {
	const limit = opts.limit ?? 20;
	const offset = opts.offset ?? 0;
	const busca = opts.busca?.trim();
	const rows = (
		busca
			? db
					.prepare(
						`SELECT * FROM registros WHERE usuario_id = @usuarioId AND titulo LIKE '%' || @busca || '%'
						 ORDER BY criado_em DESC LIMIT @limit OFFSET @offset`
					)
					.all({ usuarioId, busca, limit: limit + 1, offset })
			: db
					.prepare(
						`SELECT * FROM registros WHERE usuario_id = @usuarioId ORDER BY criado_em DESC LIMIT @limit OFFSET @offset`
					)
					.all({ usuarioId, limit: limit + 1, offset })
	) as RegistroRow[];
	const hasMore = rows.length > limit;
	return { items: rows.slice(0, limit).map(mapRow), nextOffset: hasMore ? offset + limit : null };
}

export function obterRegistro(id: string, usuarioId: string): RegistroProvenencia | null {
	const row = db
		.prepare('SELECT * FROM registros WHERE id = @id AND usuario_id = @usuarioId')
		.get({ id, usuarioId }) as RegistroRow | undefined;
	return row ? mapRow(row) : null;
}

export function criarRegistro(
	usuarioId: string,
	input: {
		titulo: string;
		descricao?: string | null;
	}
): RegistroProvenencia {
	const id = uuidv7();
	const criadoEm = new Date().toISOString();
	db.prepare(
		`INSERT INTO registros (id, usuario_id, titulo, descricao, status, criado_em)
		 VALUES (@id, @usuarioId, @titulo, @descricao, 'rascunho', @criadoEm)`
	).run({ id, usuarioId, titulo: input.titulo, descricao: input.descricao ?? null, criadoEm });
	return obterRegistro(id, usuarioId)!;
}

/** Titulo/descricao sao metadados do container, nao "historico" — editaveis em qualquer status (§3). */
export function atualizarRegistro(
	id: string,
	usuarioId: string,
	input: { titulo: string; descricao?: string | null }
): RegistroProvenencia {
	if (!obterRegistro(id, usuarioId)) throw new RegistroNaoEncontradoError('error.record_not_found');
	db.prepare(
		`UPDATE registros SET titulo = @titulo, descricao = @descricao
		 WHERE id = @id AND usuario_id = @usuarioId`
	).run({ id, usuarioId, titulo: input.titulo, descricao: input.descricao ?? null });
	return obterRegistro(id, usuarioId)!;
}

export class RegistroJaFinalizadoError extends Error {}
export class RegistroNaoEncontradoError extends Error {}

export function finalizarRegistro(id: string, usuarioId: string): RegistroProvenencia {
	const atual = obterRegistro(id, usuarioId);
	if (!atual) throw new RegistroNaoEncontradoError('error.record_not_found');
	if (atual.status === 'finalizado')
		throw new RegistroJaFinalizadoError('error.record_already_finalized');
	const finalizadoEm = new Date().toISOString();
	db.prepare(
		`UPDATE registros SET status = 'finalizado', finalizado_em = @finalizadoEm
		 WHERE id = @id AND usuario_id = @usuarioId`
	).run({
		id,
		usuarioId,
		finalizadoEm
	});
	return obterRegistro(id, usuarioId)!;
}

/** Cascata (atividades/entidades do Registro) e sempre permitida, em qualquer status — especificacao.md §3. */
export function excluirRegistro(id: string, usuarioId: string): void {
	db.prepare('DELETE FROM registros WHERE id = @id AND usuario_id = @usuarioId').run({
		id,
		usuarioId
	});
}

export function obterRegistroDetalhado(id: string, usuarioId: string): RegistroDetalhado | null {
	const registro = obterRegistro(id, usuarioId);
	if (!registro) return null;
	const entidades = listarEntidadesPorRegistro(id);
	const atividades = listarAtividadesPorRegistro(id);
	const idsAgentes = new Set(atividades.map((a) => a.agenteId));
	const agentesEnvolvidos = [...idsAgentes]
		.map((agenteId) => obterAgente(agenteId, usuarioId))
		.filter((a): a is Agente => a !== null);
	return { registro, entidades, atividades, agentesEnvolvidos };
}
