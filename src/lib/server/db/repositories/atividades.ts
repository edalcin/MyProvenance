import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type {
	AmbienteExecucao,
	Atividade,
	Entidade,
	ParametroAtividade,
	TipoAtividade
} from '$lib/types';
import { RegistroNaoEncontradoError, RegistroJaFinalizadoError } from './registros';
import { RegraCardinalidadeError, validarCardinalidade } from '$lib/cardinalidade';
import {
	inserirEntidade,
	listarEntidadesPorRegistro,
	atualizarEntidade,
	excluirEntidade,
	obterEntidade
} from './entidades';

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
	entidadesGeradas: string[]
): Atividade {
	return {
		id: row.id,
		registroId: row.registro_id,
		tipo: row.tipo,
		agenteId: row.agente_id,
		dataHora: row.data_hora,
		descricao: row.descricao,
		entidadesUsadas,
		entidadesGeradas,
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

/** entidadesGeradas nao tem coluna propria (evita FK circular) — consulta reversa, ver especificacao.md §3. */
function entidadesGeradasPor(atividadeId: string): string[] {
	const rows = db
		.prepare('SELECT id FROM entidades WHERE gerada_por_atividade_id = @atividadeId')
		.all({ atividadeId }) as { id: string }[];
	return rows.map((r) => r.id);
}

export function listarAtividadesPorRegistro(registroId: string): Atividade[] {
	const rows = db
		.prepare('SELECT * FROM atividades WHERE registro_id = @registroId ORDER BY data_hora')
		.all({ registroId }) as AtividadeRow[];
	return rows.map((row) => mapRow(row, entidadesUsadasDe(row.id), entidadesGeradasPor(row.id)));
}

export function obterAtividade(id: string): Atividade | null {
	const row = db.prepare('SELECT * FROM atividades WHERE id = @id').get({ id }) as
		AtividadeRow | undefined;
	if (!row) return null;
	return mapRow(row, entidadesUsadasDe(row.id), entidadesGeradasPor(row.id));
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
	/** obrigatorio 1+ em criacao/transformacao; opcional (0+) em analise. */
	entidadesGeradas?: NovaEntidadeInput[];
}

const inserirAtividadeStmt = db.prepare(
	`INSERT INTO atividades (id, registro_id, tipo, agente_id, data_hora, descricao, local, instrumento, processo, parametros, ambiente_execucao)
	 VALUES (@id, @registroId, @tipo, @agenteId, @dataHora, @descricao, @local, @instrumento, @processo, @parametros, @ambienteExecucao)`
);
const inserirUsoStmt = db.prepare(
	'INSERT INTO atividade_entidades_usadas (atividade_id, entidade_id) VALUES (@atividadeId, @entidadeId)'
);

const verificarRegistroDoUsuarioStmt = db.prepare(
	'SELECT 1 FROM registros WHERE id = @registroId AND usuario_id = @usuarioId'
);

const criarAtividadeTx = db.transaction(
	(usuarioId: string, registroId: string, input: CriarAtividadeInput) => {
		if (!verificarRegistroDoUsuarioStmt.get({ registroId, usuarioId })) {
			throw new RegistroNaoEncontradoError('error.record_not_found');
		}
		validarCardinalidade(input);

		const entidadesDoRegistro = new Set(listarEntidadesPorRegistro(registroId).map((e) => e.id));
		for (const entidadeId of input.entidadesUsadas) {
			if (!entidadesDoRegistro.has(entidadeId)) {
				throw new RegraCardinalidadeError('error.entity_not_in_record');
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

		const entidadesGeradas: Entidade[] = (input.entidadesGeradas ?? []).map((nova) => {
			const entidade: Entidade = {
				id: uuidv7(),
				registroId,
				nome: nova.nome,
				descricao: nova.descricao ?? null,
				formato: nova.formato ?? null,
				localizacao: nova.localizacao ?? null,
				licenca: nova.licenca ?? null,
				geradaPorAtividadeId: atividadeId
			};
			inserirEntidade(entidade);
			return entidade;
		});

		return { atividade: obterAtividade(atividadeId)!, entidadesGeradas };
	}
);

/** Sempre permitido, mesmo em Registro finalizado — finalizado so bloqueia editar/excluir historico (ADR-0003). */
export function criarAtividade(usuarioId: string, registroId: string, input: CriarAtividadeInput) {
	return criarAtividadeTx(usuarioId, registroId, input);
}

export interface EntidadeGeradaEditInput extends NovaEntidadeInput {
	/** presente = edita a Entidade existente; ausente = cria uma nova. */
	id?: string;
}

export interface AtualizarAtividadeInput {
	agenteId: string;
	dataHora: string;
	descricao?: string | null;
	entidadesUsadas: string[];
	local?: string | null;
	instrumento?: string | null;
	processo?: string | null;
	parametros?: ParametroAtividade[] | null;
	ambienteExecucao?: AmbienteExecucao | null;
	entidadesGeradas?: EntidadeGeradaEditInput[];
}

const obterStatusRegistroDoUsuarioStmt = db.prepare(
	'SELECT status FROM registros WHERE id = @registroId AND usuario_id = @usuarioId'
);

const atualizarAtividadeStmt = db.prepare(
	`UPDATE atividades SET agente_id = @agenteId, data_hora = @dataHora, descricao = @descricao,
	 local = @local, instrumento = @instrumento, processo = @processo, parametros = @parametros,
	 ambiente_execucao = @ambienteExecucao WHERE id = @id`
);

const limparUsoStmt = db.prepare(
	'DELETE FROM atividade_entidades_usadas WHERE atividade_id = @atividadeId'
);

/** Edicao so em Registro Rascunho (ADR-0003) — tipo e imutavel, cardinalidade revalidada com o tipo original. */
const atualizarAtividadeTx = db.transaction(
	(usuarioId: string, registroId: string, atividadeId: string, input: AtualizarAtividadeInput) => {
		const registro = obterStatusRegistroDoUsuarioStmt.get({ registroId, usuarioId }) as
			{ status: string } | undefined;
		if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
		if (registro.status === 'finalizado') {
			throw new RegistroJaFinalizadoError('error.record_read_only');
		}

		const atual = obterAtividade(atividadeId);
		if (!atual || atual.registroId !== registroId) {
			throw new RegistroNaoEncontradoError('error.activity_not_found');
		}

		validarCardinalidade({
			tipo: atual.tipo,
			entidadesUsadas: input.entidadesUsadas,
			entidadesGeradas: input.entidadesGeradas
		});

		const entidadesDoRegistro = new Set(listarEntidadesPorRegistro(registroId).map((e) => e.id));
		for (const entidadeId of input.entidadesUsadas) {
			if (!entidadesDoRegistro.has(entidadeId)) {
				throw new RegraCardinalidadeError('error.entity_not_in_record');
			}
		}

		atualizarAtividadeStmt.run({
			id: atividadeId,
			agenteId: input.agenteId,
			dataHora: input.dataHora,
			descricao: input.descricao ?? null,
			local: input.local ?? null,
			instrumento: input.instrumento ?? null,
			processo: input.processo ?? null,
			parametros: input.parametros ? JSON.stringify(input.parametros) : null,
			ambienteExecucao: input.ambienteExecucao ? JSON.stringify(input.ambienteExecucao) : null
		});

		limparUsoStmt.run({ atividadeId });
		for (const entidadeId of input.entidadesUsadas) {
			inserirUsoStmt.run({ atividadeId, entidadeId });
		}

		// Entidades geradas: mantidas com id sao atualizadas, sem id sao novas, as que sobraram
		// da versao anterior sao excluidas — a FK bloqueia (409) se estiverem em uso como entrada
		// de outra Atividade.
		const geradasAntesIds = new Set(entidadesGeradasPor(atividadeId));
		const mantidas = new Set<string>();
		const entidadesGeradas: Entidade[] = [];
		for (const nova of input.entidadesGeradas ?? []) {
			if (nova.id) {
				if (!geradasAntesIds.has(nova.id)) {
					throw new RegraCardinalidadeError('error.entity_not_in_activity');
				}
				atualizarEntidade(nova.id, nova);
				mantidas.add(nova.id);
				entidadesGeradas.push(obterEntidade(nova.id)!);
			} else {
				const entidade: Entidade = {
					id: uuidv7(),
					registroId,
					nome: nova.nome,
					descricao: nova.descricao ?? null,
					formato: nova.formato ?? null,
					localizacao: nova.localizacao ?? null,
					licenca: nova.licenca ?? null,
					geradaPorAtividadeId: atividadeId
				};
				inserirEntidade(entidade);
				entidadesGeradas.push(entidade);
			}
		}
		for (const idAntiga of geradasAntesIds) {
			if (!mantidas.has(idAntiga)) excluirEntidade(idAntiga);
		}

		return { atividade: obterAtividade(atividadeId)!, entidadesGeradas };
	}
);

export function atualizarAtividade(
	usuarioId: string,
	registroId: string,
	atividadeId: string,
	input: AtualizarAtividadeInput
) {
	return atualizarAtividadeTx(usuarioId, registroId, atividadeId, input);
}

const excluirAtividadeStmt = db.prepare('DELETE FROM atividades WHERE id = @id');

/**
 * So em Registro Rascunho (ADR-0003). Entidades geradas por esta Atividade sao removidas
 * junto — a FK bloqueia (409) se alguma delas estiver em uso como entrada de outra Atividade.
 */
const excluirAtividadeTx = db.transaction(
	(usuarioId: string, registroId: string, atividadeId: string) => {
		const registro = obterStatusRegistroDoUsuarioStmt.get({ registroId, usuarioId }) as
			{ status: string } | undefined;
		if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
		if (registro.status === 'finalizado') {
			throw new RegistroJaFinalizadoError('error.record_read_only');
		}

		const atual = obterAtividade(atividadeId);
		if (!atual || atual.registroId !== registroId) {
			throw new RegistroNaoEncontradoError('error.activity_not_found');
		}

		for (const entidadeId of entidadesGeradasPor(atividadeId)) {
			excluirEntidade(entidadeId);
		}
		limparUsoStmt.run({ atividadeId });
		excluirAtividadeStmt.run({ id: atividadeId });
	}
);

export function excluirAtividade(usuarioId: string, registroId: string, atividadeId: string): void {
	excluirAtividadeTx(usuarioId, registroId, atividadeId);
}
