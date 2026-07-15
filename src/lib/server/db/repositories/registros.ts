import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type { Agente, Atividade, Entidade, RegistroProvenencia, StatusRegistro } from '$lib/types';
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
	opts: { busca?: string; offset?: number; limit?: number } = {}
): ListagemRegistros {
	const limit = opts.limit ?? 20;
	const offset = opts.offset ?? 0;
	const busca = opts.busca?.trim();
	const rows = (
		busca
			? db
					.prepare(
						`SELECT * FROM registros WHERE titulo LIKE '%' || @busca || '%' ORDER BY criado_em DESC LIMIT @limit OFFSET @offset`
					)
					.all({ busca, limit: limit + 1, offset })
			: db
					.prepare(`SELECT * FROM registros ORDER BY criado_em DESC LIMIT @limit OFFSET @offset`)
					.all({ limit: limit + 1, offset })
	) as RegistroRow[];
	const hasMore = rows.length > limit;
	return { items: rows.slice(0, limit).map(mapRow), nextOffset: hasMore ? offset + limit : null };
}

export function obterRegistro(id: string): RegistroProvenencia | null {
	const row = db.prepare('SELECT * FROM registros WHERE id = @id').get({ id }) as
		RegistroRow | undefined;
	return row ? mapRow(row) : null;
}

export function criarRegistro(input: {
	titulo: string;
	descricao?: string | null;
}): RegistroProvenencia {
	const id = uuidv7();
	const criadoEm = new Date().toISOString();
	db.prepare(
		`INSERT INTO registros (id, titulo, descricao, status, criado_em) VALUES (@id, @titulo, @descricao, 'rascunho', @criadoEm)`
	).run({ id, titulo: input.titulo, descricao: input.descricao ?? null, criadoEm });
	return obterRegistro(id)!;
}

export class RegistroJaFinalizadoError extends Error {}
export class RegistroNaoEncontradoError extends Error {}

export function finalizarRegistro(id: string): RegistroProvenencia {
	const atual = obterRegistro(id);
	if (!atual) throw new RegistroNaoEncontradoError(`Registro ${id} nao encontrado.`);
	if (atual.status === 'finalizado')
		throw new RegistroJaFinalizadoError('Registro ja esta finalizado.');
	const finalizadoEm = new Date().toISOString();
	db.prepare(
		`UPDATE registros SET status = 'finalizado', finalizado_em = @finalizadoEm WHERE id = @id`
	).run({
		id,
		finalizadoEm
	});
	return obterRegistro(id)!;
}

/** Cascata (atividades/entidades do Registro) e sempre permitida, em qualquer status — especificacao.md §3. */
export function excluirRegistro(id: string): void {
	db.prepare('DELETE FROM registros WHERE id = @id').run({ id });
}

export interface RegistroDetalhado {
	registro: RegistroProvenencia;
	entidades: Entidade[];
	atividades: Atividade[];
	agentesEnvolvidos: Agente[];
}

export function obterRegistroDetalhado(id: string): RegistroDetalhado | null {
	const registro = obterRegistro(id);
	if (!registro) return null;
	const entidades = listarEntidadesPorRegistro(id);
	const atividades = listarAtividadesPorRegistro(id);
	const idsAgentes = new Set(atividades.map((a) => a.agenteId));
	const agentesEnvolvidos = [...idsAgentes]
		.map((agenteId) => obterAgente(agenteId))
		.filter((a): a is Agente => a !== null);
	return { registro, entidades, atividades, agentesEnvolvidos };
}
