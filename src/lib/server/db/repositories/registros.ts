import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type {
	Agente,
	DirecaoDiagrama,
	PapelAcesso,
	RegistroDetalhado,
	RegistroProvenencia,
	StatusRegistro
} from '$lib/types';
import { papelAtendeMinimo } from '$lib/types';
import { gerarTokenCompartilhamento } from '$lib/server/auth';
import { obterAgentePorId } from './agentes';
import { listarEntidadesPorRegistro } from './entidades';
import { listarAtividadesPorRegistro } from './atividades';

interface RegistroRow {
	id: string;
	usuario_id: string | null;
	titulo: string;
	descricao: string | null;
	status: StatusRegistro;
	criado_em: string;
	finalizado_em: string | null;
	direcao_diagrama: DirecaoDiagrama;
	token_compartilhamento: string | null;
	papel: PapelAcesso;
	dono_username: string | null;
}

function mapRow(row: RegistroRow): RegistroProvenencia {
	return {
		id: row.id,
		titulo: row.titulo,
		descricao: row.descricao,
		status: row.status,
		criadoEm: row.criado_em,
		finalizadoEm: row.finalizado_em,
		direcaoDiagrama: row.direcao_diagrama,
		tokenCompartilhamento: row.token_compartilhamento,
		meuPapel: row.papel,
		donoUsername: row.papel === 'dono' ? null : row.dono_username
	};
}

export interface ListagemRegistros {
	items: RegistroProvenencia[];
	nextOffset: number | null;
}

/**
 * Base comum de leitura: um Registro e' visivel para o dono e para quem tem acesso via
 * `registro_compartilhamentos` — `papel` resolve qual dos dois casos e' este, numa unica consulta.
 */
const SELECT_COM_ACESSO = `
	SELECT r.*,
		CASE WHEN r.usuario_id = @usuarioId THEN 'dono' ELSE rc.papel END AS papel,
		u.username AS dono_username
	FROM registros r
	LEFT JOIN registro_compartilhamentos rc ON rc.registro_id = r.id AND rc.usuario_id = @usuarioId
	LEFT JOIN usuarios u ON u.id = r.usuario_id
`;

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
						`${SELECT_COM_ACESSO}
						 WHERE (r.usuario_id = @usuarioId OR rc.usuario_id = @usuarioId) AND r.titulo LIKE '%' || @busca || '%'
						 ORDER BY r.criado_em DESC LIMIT @limit OFFSET @offset`
					)
					.all({ usuarioId, busca, limit: limit + 1, offset })
			: db
					.prepare(
						`${SELECT_COM_ACESSO}
						 WHERE (r.usuario_id = @usuarioId OR rc.usuario_id = @usuarioId)
						 ORDER BY r.criado_em DESC LIMIT @limit OFFSET @offset`
					)
					.all({ usuarioId, limit: limit + 1, offset })
	) as RegistroRow[];
	const hasMore = rows.length > limit;
	return { items: rows.slice(0, limit).map(mapRow), nextOffset: hasMore ? offset + limit : null };
}

/** Le por dono OU por acesso compartilhado (qualquer papel) — escrita mais restrita e' checada por chamador. */
export function obterRegistro(id: string, usuarioId: string): RegistroProvenencia | null {
	const row = db
		.prepare(
			`${SELECT_COM_ACESSO} WHERE r.id = @id AND (r.usuario_id = @usuarioId OR rc.usuario_id = @usuarioId)`
		)
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

export class RegistroJaFinalizadoError extends Error {}
export class RegistroNaoEncontradoError extends Error {}

/** Orientacao do diagrama Mermaid — respeitada no relatorio .md exportado (docs/especificacao.md §5-6). */
export function alterarDirecaoDiagrama(
	id: string,
	usuarioId: string,
	direcao: DirecaoDiagrama
): RegistroProvenencia {
	// Metadado de exibicao, mesma categoria de titulo/descricao — qualquer papel (editor+) altera.
	if (!obterRegistro(id, usuarioId)) throw new RegistroNaoEncontradoError('error.record_not_found');
	db.prepare('UPDATE registros SET direcao_diagrama = @direcao WHERE id = @id').run({
		id,
		direcao
	});
	return obterRegistro(id, usuarioId)!;
}

/** Idempotente: Registro ja compartilhado mantem o mesmo token (nao rotaciona por engano). Administrador+. */
export function ativarCompartilhamento(id: string, usuarioId: string): RegistroProvenencia {
	const registro = obterRegistro(id, usuarioId);
	if (!registro || !papelAtendeMinimo(registro.meuPapel, 'administrador')) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	if (registro.tokenCompartilhamento) return registro;
	const token = gerarTokenCompartilhamento();
	db.prepare('UPDATE registros SET token_compartilhamento = @token WHERE id = @id').run({
		id,
		token
	});
	return obterRegistro(id, usuarioId)!;
}

/** Administrador+ (mesmo nivel de ativarCompartilhamento). */
export function desativarCompartilhamento(id: string, usuarioId: string): RegistroProvenencia {
	const registro = obterRegistro(id, usuarioId);
	if (!registro || !papelAtendeMinimo(registro.meuPapel, 'administrador')) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	db.prepare('UPDATE registros SET token_compartilhamento = NULL WHERE id = @id').run({ id });
	return obterRegistro(id, usuarioId)!;
}

/** Titulo/descricao sao metadados do container, nao "historico" — editaveis em qualquer status (§3), editor+. */
export function atualizarRegistro(
	id: string,
	usuarioId: string,
	input: { titulo: string; descricao?: string | null }
): RegistroProvenencia {
	if (!obterRegistro(id, usuarioId)) throw new RegistroNaoEncontradoError('error.record_not_found');
	db.prepare(
		`UPDATE registros SET titulo = @titulo, descricao = @descricao
		 WHERE id = @id`
	).run({ id, titulo: input.titulo, descricao: input.descricao ?? null });
	return obterRegistro(id, usuarioId)!;
}

/** Administrador+. */
export function finalizarRegistro(id: string, usuarioId: string): RegistroProvenencia {
	const atual = obterRegistro(id, usuarioId);
	if (!atual || !papelAtendeMinimo(atual.meuPapel, 'administrador')) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	if (atual.status === 'finalizado')
		throw new RegistroJaFinalizadoError('error.record_already_finalized');
	const finalizadoEm = new Date().toISOString();
	db.prepare(
		`UPDATE registros SET status = 'finalizado', finalizado_em = @finalizadoEm
		 WHERE id = @id`
	).run({
		id,
		finalizadoEm
	});
	return obterRegistro(id, usuarioId)!;
}

/**
 * Cascata (atividades/entidades do Registro) e sempre permitida, em qualquer status — especificacao.md §3.
 * Administrador+.
 */
export function excluirRegistro(id: string, usuarioId: string): void {
	const registro = obterRegistro(id, usuarioId);
	if (!registro || !papelAtendeMinimo(registro.meuPapel, 'administrador')) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	db.prepare('DELETE FROM registros WHERE id = @id').run({ id });
}

export function obterRegistroDetalhado(id: string, usuarioId: string): RegistroDetalhado | null {
	const registro = obterRegistro(id, usuarioId);
	if (!registro) return null;
	const entidades = listarEntidadesPorRegistro(id);
	const atividades = listarAtividadesPorRegistro(id);
	const idsAgentes = new Set(atividades.map((a) => a.agenteId));
	// Sem filtro por conta: num Registro compartilhado, Atividades de coeditores diferentes
	// referenciam Agentes de contas diferentes — o acesso ja foi validado no nivel do Registro acima.
	const agentesEnvolvidos = [...idsAgentes]
		.map((agenteId) => obterAgentePorId(agenteId))
		.filter((a): a is Agente => a !== null);
	return { registro, entidades, atividades, agentesEnvolvidos };
}

/**
 * Leitura publica pelo token de compartilhamento (sem sessao/usuarioId) — o dono do Registro
 * ja foi validado quando o token foi gerado; aqui so resolvemos o usuario_id dono a partir da
 * linha para reaproveitar obterRegistroDetalhado (mesma logica, sem duplicar consultas).
 */
export function obterRegistroDetalhadoPorToken(token: string): RegistroDetalhado | null {
	const row = db
		.prepare('SELECT * FROM registros WHERE token_compartilhamento = @token')
		.get({ token }) as { id: string; usuario_id: string | null } | undefined;
	if (!row || !row.usuario_id) return null;
	return obterRegistroDetalhado(row.id, row.usuario_id);
}
