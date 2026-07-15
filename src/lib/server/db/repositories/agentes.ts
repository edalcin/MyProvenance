import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type { Agente, TipoAgente } from '$lib/types';

interface AgenteRow {
	id: string;
	nome: string;
	tipo: TipoAgente;
	afiliacao: string | null;
	identificador_externo: string | null;
}

function mapRow(row: AgenteRow): Agente {
	return {
		id: row.id,
		nome: row.nome,
		tipo: row.tipo,
		afiliacao: row.afiliacao,
		identificadorExterno: row.identificador_externo
	};
}

export interface ListagemAgentes {
	items: Agente[];
	nextOffset: number | null;
}

export function listarAgentes(opts: { busca?: string; offset?: number; limit?: number } = {}): ListagemAgentes {
	const limit = opts.limit ?? 30;
	const offset = opts.offset ?? 0;
	const busca = opts.busca?.trim();
	const rows = (
		busca
			? db
					.prepare(
						`SELECT * FROM agentes WHERE nome LIKE '%' || @busca || '%' ORDER BY nome LIMIT @limit OFFSET @offset`
					)
					.all({ busca, limit: limit + 1, offset })
			: db.prepare(`SELECT * FROM agentes ORDER BY nome LIMIT @limit OFFSET @offset`).all({ limit: limit + 1, offset })
	) as AgenteRow[];
	const hasMore = rows.length > limit;
	return { items: rows.slice(0, limit).map(mapRow), nextOffset: hasMore ? offset + limit : null };
}

export function obterAgente(id: string): Agente | null {
	const row = db.prepare('SELECT * FROM agentes WHERE id = @id').get({ id }) as AgenteRow | undefined;
	return row ? mapRow(row) : null;
}

export interface AgenteInput {
	nome: string;
	tipo: TipoAgente;
	afiliacao?: string | null;
	identificadorExterno?: string | null;
}

export function criarAgente(input: AgenteInput): Agente {
	const id = uuidv7();
	db.prepare(
		`INSERT INTO agentes (id, nome, tipo, afiliacao, identificador_externo)
		 VALUES (@id, @nome, @tipo, @afiliacao, @identificadorExterno)`
	).run({
		id,
		nome: input.nome,
		tipo: input.tipo,
		afiliacao: input.afiliacao ?? null,
		identificadorExterno: input.identificadorExterno ?? null
	});
	return obterAgente(id)!;
}

export function atualizarAgente(id: string, input: Partial<AgenteInput>): Agente | null {
	const atual = obterAgente(id);
	if (!atual) return null;
	db.prepare(
		`UPDATE agentes SET nome = @nome, tipo = @tipo, afiliacao = @afiliacao, identificador_externo = @identificadorExterno
		 WHERE id = @id`
	).run({
		id,
		nome: input.nome ?? atual.nome,
		tipo: input.tipo ?? atual.tipo,
		afiliacao: input.afiliacao !== undefined ? input.afiliacao : atual.afiliacao,
		identificadorExterno:
			input.identificadorExterno !== undefined ? input.identificadorExterno : atual.identificadorExterno
	});
	return obterAgente(id);
}

export function excluirAgente(id: string): void {
	db.prepare('DELETE FROM agentes WHERE id = @id').run({ id });
}
