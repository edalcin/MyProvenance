import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type {
	AmbienteExecucao,
	Atividade,
	Entidade,
	ParametroAtividade,
	TipoAtividade
} from '$lib/types';
import { inserirEntidade, listarEntidadesPorRegistro } from './entidades';

interface AtividadeRow {
	id: string;
	registro_id: string;
	tipo: TipoAtividade;
	agente_id: string;
	data_hora: string;
	descricao: string | null;
	local: string | null;
	instrumento: string | null;
	processo: string | null;
	parametros: string | null;
	ambiente_execucao: string | null;
}

function mapRow(
	row: AtividadeRow,
	entidadesUsadas: string[],
	entidadeGeradaId: string | null
): Atividade {
	return {
		id: row.id,
		registroId: row.registro_id,
		tipo: row.tipo,
		agenteId: row.agente_id,
		dataHora: row.data_hora,
		descricao: row.descricao,
		entidadesUsadas,
		entidadeGeradaId,
		local: row.local,
		instrumento: row.instrumento,
		processo: row.processo,
		parametros: row.parametros ? (JSON.parse(row.parametros) as ParametroAtividade[]) : null,
		ambienteExecucao: row.ambiente_execucao
			? (JSON.parse(row.ambiente_execucao) as AmbienteExecucao)
			: null
	};
}

function entidadesUsadasDe(atividadeId: string): string[] {
	const rows = db
		.prepare('SELECT entidade_id FROM atividade_entidades_usadas WHERE atividade_id = @atividadeId')
		.all({ atividadeId }) as { entidade_id: string }[];
	return rows.map((r) => r.entidade_id);
}

/** entidadeGeradaId nao tem coluna propria (evita FK circular) — consulta reversa, ver especificacao.md §3. */
function entidadeGeradaPor(atividadeId: string): string | null {
	const row = db
		.prepare('SELECT id FROM entidades WHERE gerada_por_atividade_id = @atividadeId')
		.get({ atividadeId }) as { id: string } | undefined;
	return row?.id ?? null;
}

export function listarAtividadesPorRegistro(registroId: string): Atividade[] {
	const rows = db
		.prepare('SELECT * FROM atividades WHERE registro_id = @registroId ORDER BY data_hora')
		.all({ registroId }) as AtividadeRow[];
	return rows.map((row) => mapRow(row, entidadesUsadasDe(row.id), entidadeGeradaPor(row.id)));
}

export function obterAtividade(id: string): Atividade | null {
	const row = db.prepare('SELECT * FROM atividades WHERE id = @id').get({ id }) as
		AtividadeRow | undefined;
	if (!row) return null;
	return mapRow(row, entidadesUsadasDe(row.id), entidadeGeradaPor(row.id));
}

export interface NovaEntidadeInput {
	nome: string;
	descricao?: string | null;
	formato?: string | null;
	localizacao?: string | null;
	licenca?: string | null;
}

export interface CriarAtividadeInput {
	tipo: TipoAtividade;
	agenteId: string;
	dataHora: string;
	descricao?: string | null;
	entidadesUsadas: string[];
	local?: string | null;
	instrumento?: string | null;
	processo?: string | null;
	parametros?: ParametroAtividade[] | null;
	ambienteExecucao?: AmbienteExecucao | null;
	/** obrigatoria em criacao/transformacao; opcional (0 ou 1) em analise. */
	entidadeGerada?: NovaEntidadeInput | null;
}

/** Regra de cardinalidade por tipo — CONTEXT.md: Criacao usa 0 gera 1, Transformacao usa 1+ gera 1, Analise usa 1+ gera 0|1. */
export class RegraCardinalidadeError extends Error {}

function validarCardinalidade(input: CriarAtividadeInput): void {
	const usadas = input.entidadesUsadas.length;
	const gera = !!input.entidadeGerada;
	if (input.tipo === 'criacao') {
		if (usadas !== 0) throw new RegraCardinalidadeError('Criacao nao usa Entidades existentes.');
		if (!gera) throw new RegraCardinalidadeError('Criacao deve gerar exatamente 1 Entidade.');
	} else if (input.tipo === 'transformacao') {
		if (usadas < 1) throw new RegraCardinalidadeError('Transformacao usa 1 ou mais Entidades.');
		if (!gera) throw new RegraCardinalidadeError('Transformacao deve gerar exatamente 1 Entidade.');
	} else {
		if (usadas < 1) throw new RegraCardinalidadeError('Analise usa 1 ou mais Entidades.');
	}
}

const inserirAtividadeStmt = db.prepare(
	`INSERT INTO atividades (id, registro_id, tipo, agente_id, data_hora, descricao, local, instrumento, processo, parametros, ambiente_execucao)
	 VALUES (@id, @registroId, @tipo, @agenteId, @dataHora, @descricao, @local, @instrumento, @processo, @parametros, @ambienteExecucao)`
);
const inserirUsoStmt = db.prepare(
	'INSERT INTO atividade_entidades_usadas (atividade_id, entidade_id) VALUES (@atividadeId, @entidadeId)'
);

const criarAtividadeTx = db.transaction((registroId: string, input: CriarAtividadeInput) => {
	validarCardinalidade(input);

	const entidadesDoRegistro = new Set(listarEntidadesPorRegistro(registroId).map((e) => e.id));
	for (const entidadeId of input.entidadesUsadas) {
		if (!entidadesDoRegistro.has(entidadeId)) {
			throw new RegraCardinalidadeError(`Entidade ${entidadeId} nao pertence a este Registro.`);
		}
	}

	const atividadeId = uuidv7();
	inserirAtividadeStmt.run({
		id: atividadeId,
		registroId,
		tipo: input.tipo,
		agenteId: input.agenteId,
		dataHora: input.dataHora,
		descricao: input.descricao ?? null,
		local: input.local ?? null,
		instrumento: input.instrumento ?? null,
		processo: input.processo ?? null,
		parametros: input.parametros ? JSON.stringify(input.parametros) : null,
		ambienteExecucao: input.ambienteExecucao ? JSON.stringify(input.ambienteExecucao) : null
	});

	for (const entidadeId of input.entidadesUsadas) {
		inserirUsoStmt.run({ atividadeId, entidadeId });
	}

	let entidadeGerada: Entidade | null = null;
	if (input.entidadeGerada) {
		entidadeGerada = {
			id: uuidv7(),
			registroId,
			nome: input.entidadeGerada.nome,
			descricao: input.entidadeGerada.descricao ?? null,
			formato: input.entidadeGerada.formato ?? null,
			localizacao: input.entidadeGerada.localizacao ?? null,
			licenca: input.entidadeGerada.licenca ?? null,
			geradaPorAtividadeId: atividadeId
		};
		inserirEntidade(entidadeGerada);
	}

	return { atividade: obterAtividade(atividadeId)!, entidadeGerada };
});

/** Sempre permitido, mesmo em Registro finalizado — finalizado so bloqueia editar/excluir historico (ADR-0003). */
export function criarAtividade(registroId: string, input: CriarAtividadeInput) {
	return criarAtividadeTx(registroId, input);
}
