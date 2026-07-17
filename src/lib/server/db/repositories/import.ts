import { db } from '../client';
import { sanitizarHtmlRico } from '$lib/sanitize';
import type { RegistroExportadoValidado } from '$lib/schemas';

/**
 * Upload de JSON faz upsert por id (ADR-0004) — sem resolucao de conflito, o upload
 * sempre substitui o estado local daquele Registro. Ordem de insercao respeita FKs:
 * agentes -> registro -> atividades -> entidades -> uso (junction, precisa dos dois lados).
 */

const upsertAgenteStmt = db.prepare(`
	INSERT INTO agentes (id, usuario_id, nome, tipo, afiliacao, identificador_externo)
	VALUES (@id, @usuarioId, @nome, @tipo, @afiliacao, @identificadorExterno)
	ON CONFLICT(id) DO UPDATE SET
		nome = excluded.nome, tipo = excluded.tipo,
		afiliacao = excluded.afiliacao, identificador_externo = excluded.identificador_externo
	WHERE agentes.usuario_id = excluded.usuario_id
`);

const upsertRegistroStmt = db.prepare(`
	INSERT INTO registros (id, usuario_id, titulo, descricao, status, criado_em, finalizado_em)
	VALUES (@id, @usuarioId, @titulo, @descricao, @status, @criadoEm, @finalizadoEm)
	ON CONFLICT(id) DO UPDATE SET
		titulo = excluded.titulo, descricao = excluded.descricao, status = excluded.status,
		criado_em = excluded.criado_em, finalizado_em = excluded.finalizado_em
	WHERE registros.usuario_id = excluded.usuario_id
`);

const upsertAtividadeStmt = db.prepare(`
	INSERT INTO atividades (id, registro_id, tipo, agente_id, data_hora, descricao, local, instrumento, processo, parametros, ambiente_execucao)
	VALUES (@id, @registroId, @tipo, @agenteId, @dataHora, @descricao, @local, @instrumento, @processo, @parametros, @ambienteExecucao)
	ON CONFLICT(id) DO UPDATE SET
		registro_id = excluded.registro_id, tipo = excluded.tipo, agente_id = excluded.agente_id,
		data_hora = excluded.data_hora, descricao = excluded.descricao, local = excluded.local,
		instrumento = excluded.instrumento, processo = excluded.processo,
		parametros = excluded.parametros, ambiente_execucao = excluded.ambiente_execucao
`);

const upsertEntidadeStmt = db.prepare(`
	INSERT INTO entidades (id, registro_id, nome, descricao, formato, localizacao, licenca, gerada_por_atividade_id, tipo_relacao_origem, revisao_de_id)
	VALUES (@id, @registroId, @nome, @descricao, @formato, @localizacao, @licenca, @geradaPorAtividadeId, @tipoRelacaoOrigem, @revisaoDeId)
	ON CONFLICT(id) DO UPDATE SET
		registro_id = excluded.registro_id, nome = excluded.nome, descricao = excluded.descricao,
		formato = excluded.formato, localizacao = excluded.localizacao, licenca = excluded.licenca,
		gerada_por_atividade_id = excluded.gerada_por_atividade_id, tipo_relacao_origem = excluded.tipo_relacao_origem, revisao_de_id = excluded.revisao_de_id
`);

const limparUsoStmt = db.prepare(
	'DELETE FROM atividade_entidades_usadas WHERE atividade_id = @atividadeId'
);
const inserirUsoStmt = db.prepare(
	'INSERT INTO atividade_entidades_usadas (atividade_id, entidade_id) VALUES (@atividadeId, @entidadeId)'
);

export const importarRegistro = db.transaction(
	(usuarioId: string, dados: RegistroExportadoValidado) => {
		for (const agente of dados.agentes) {
			upsertAgenteStmt.run({ ...agente, usuarioId });
		}

		upsertRegistroStmt.run({
			id: dados.registro.id,
			usuarioId,
			titulo: dados.registro.titulo,
			descricao: dados.registro.descricao
				? sanitizarHtmlRico(dados.registro.descricao)
				: dados.registro.descricao,
			status: dados.registro.status,
			criadoEm: dados.registro.criadoEm,
			finalizadoEm: dados.registro.finalizadoEm
		});

		for (const atividade of dados.atividades) {
			upsertAtividadeStmt.run({
				id: atividade.id,
				registroId: atividade.registroId,
				tipo: atividade.tipo,
				agenteId: atividade.agenteId,
				dataHora: atividade.dataHora,
				descricao: atividade.descricao,
				local: atividade.local,
				instrumento: atividade.instrumento,
				processo: atividade.processo,
				parametros: atividade.parametros ? JSON.stringify(atividade.parametros) : null,
				ambienteExecucao: atividade.ambienteExecucao
					? JSON.stringify(atividade.ambienteExecucao)
					: null
			});
		}

		for (const entidade of dados.entidades) {
			upsertEntidadeStmt.run(entidade);
		}

		for (const atividade of dados.atividades) {
			limparUsoStmt.run({ atividadeId: atividade.id });
			for (const entidadeId of atividade.entidadesUsadas) {
				inserirUsoStmt.run({ atividadeId: atividade.id, entidadeId });
			}
		}
	}
);
