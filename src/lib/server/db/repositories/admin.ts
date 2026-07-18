/**
 * Area administrativa (senha via `ADM_PWD`) — consultas GLOBAIS, sem escopo de Conta. Diferente
 * dos demais repositories (filtram por `usuario_id`/papel), estas funcoes sao privilegiadas e so
 * podem ser chamadas atras de um guard `locals.admin` (docs admin-area-plan). Alias SQL
 * snake→camel no mesmo padrao de compartilhamentos.ts.
 */
import { db } from '../client';
import { gerarSaltHex, hashPin } from '$lib/server/auth';
import type { Agente, StatusRegistro } from '$lib/types';
import type { AgenteInput } from './agentes';

export interface UsuarioAdmin {
	id: string;
	username: string;
	criadoEm: string;
}

export interface RegistroAdmin {
	id: string;
	titulo: string;
	descricao: string | null;
	status: StatusRegistro;
	criadoEm: string;
	finalizadoEm: string | null;
	donoUsername: string | null;
}

export interface AgenteAdmin extends Agente {
	donoUsername: string | null;
}

export interface CompartilhamentoAdmin {
	registroId: string;
	registroTitulo: string;
	usuarioId: string;
	username: string;
	papel: 'editor' | 'administrador';
	criadoEm: string;
}

const listarUsuariosStmt = db.prepare(
	'SELECT id, username, criado_em AS criadoEm FROM usuarios ORDER BY criado_em DESC'
);

export function listarUsuarios(): UsuarioAdmin[] {
	return listarUsuariosStmt.all() as UsuarioAdmin[];
}

const obterUsuarioAdminStmt = db.prepare(
	'SELECT id, username, criado_em AS criadoEm FROM usuarios WHERE id = @id'
);

export function atualizarUsuario(
	id: string,
	input: { username: string; pin?: string }
): UsuarioAdmin {
	db.prepare('UPDATE usuarios SET username = @username WHERE id = @id').run({
		id,
		username: input.username
	});
	if (input.pin) {
		const salt = gerarSaltHex();
		db.prepare('UPDATE usuarios SET pin_hash = @pinHash, pin_salt = @pinSalt WHERE id = @id').run({
			id,
			pinHash: hashPin(input.pin, salt),
			pinSalt: salt
		});
	}
	return obterUsuarioAdminStmt.get({ id }) as UsuarioAdmin;
}

/**
 * Ordem obrigatoria — bancos legados nao tem `ON DELETE CASCADE` de agentes/registros→usuarios
 * (client.ts: `ALTER TABLE … ADD COLUMN usuario_id` sem `ON DELETE`). Atividades dos proprios
 * Registros precisam sumir (passo 1) antes de excluir os Agentes que elas referenciam (passo 2) —
 * senao um Agente ainda usado por Atividade de OUTRA Conta (compartilhamento) dispara
 * SQLITE_CONSTRAINT_FOREIGNKEY e a transacao inteira reverte (o endpoint devolve 409).
 */
export const excluirUsuario = db.transaction((id: string): void => {
	db.prepare('DELETE FROM registros WHERE usuario_id = @id').run({ id });
	db.prepare('DELETE FROM agentes WHERE usuario_id = @id').run({ id });
	db.prepare('DELETE FROM registro_compartilhamentos WHERE usuario_id = @id').run({ id });
	db.prepare('DELETE FROM sessoes WHERE usuario_id = @id').run({ id });
	db.prepare('DELETE FROM usuarios WHERE id = @id').run({ id });
});

const SELECT_TODOS_REGISTROS = `
	SELECT r.id, r.titulo, r.descricao, r.status, r.criado_em AS criadoEm,
	       r.finalizado_em AS finalizadoEm, u.username AS donoUsername
	FROM registros r LEFT JOIN usuarios u ON u.id = r.usuario_id
`;
const listarTodosRegistrosStmt = db.prepare(`${SELECT_TODOS_REGISTROS} ORDER BY r.criado_em DESC`);
const obterRegistroAdminStmt = db.prepare(`${SELECT_TODOS_REGISTROS} WHERE r.id = @id`);

/** LEFT JOIN: `usuario_id` pode ser NULL em registros anonimos legados. */
export function listarTodosRegistros(): RegistroAdmin[] {
	return listarTodosRegistrosStmt.all() as RegistroAdmin[];
}

export function atualizarRegistroAdmin(
	id: string,
	input: { titulo: string; descricao: string | null; status: StatusRegistro }
): RegistroAdmin {
	db.prepare(
		`UPDATE registros
		 SET titulo = @titulo, descricao = @descricao, status = @status,
		     finalizado_em = CASE WHEN @status = 'finalizado' THEN COALESCE(finalizado_em, @agora) ELSE NULL END
		 WHERE id = @id`
	).run({ ...input, id, agora: new Date().toISOString() });
	return obterRegistroAdminStmt.get({ id }) as RegistroAdmin;
}

/** Cascateia atividades/entidades/compartilhamentos via FK ON DELETE CASCADE em registro_id. */
export function excluirRegistroAdmin(id: string): void {
	db.prepare('DELETE FROM registros WHERE id = @id').run({ id });
}

const listarTodosAgentesStmt = db.prepare(
	`SELECT a.id, a.nome, a.tipo, a.afiliacao, a.identificador_externo AS identificadorExterno,
	        u.username AS donoUsername
	 FROM agentes a LEFT JOIN usuarios u ON u.id = a.usuario_id
	 ORDER BY a.nome COLLATE NOCASE`
);

export function listarTodosAgentes(): AgenteAdmin[] {
	return listarTodosAgentesStmt.all() as AgenteAdmin[];
}

const obterAgenteAdminStmt = db.prepare(
	`SELECT a.id, a.nome, a.tipo, a.afiliacao, a.identificador_externo AS identificadorExterno,
	        u.username AS donoUsername
	 FROM agentes a LEFT JOIN usuarios u ON u.id = a.usuario_id
	 WHERE a.id = @id`
);

export function atualizarAgenteAdmin(id: string, input: AgenteInput): AgenteAdmin {
	db.prepare(
		`UPDATE agentes SET nome = @nome, tipo = @tipo, afiliacao = @afiliacao,
		        identificador_externo = @identificadorExterno
		 WHERE id = @id`
	).run({
		id,
		nome: input.nome,
		tipo: input.tipo,
		afiliacao: input.afiliacao ?? null,
		identificadorExterno: input.identificadorExterno ?? null
	});
	return obterAgenteAdminStmt.get({ id }) as AgenteAdmin;
}

/** Dispara FK 409 (SQLITE_CONSTRAINT_FOREIGNKEY) se o Agente estiver em uso por alguma Atividade. */
export function excluirAgenteAdmin(id: string): void {
	db.prepare('DELETE FROM agentes WHERE id = @id').run({ id });
}

const listarTodosCompartilhamentosStmt = db.prepare(
	`SELECT rc.registro_id AS registroId, r.titulo AS registroTitulo, rc.usuario_id AS usuarioId,
	        u.username, rc.papel, rc.criado_em AS criadoEm
	 FROM registro_compartilhamentos rc
	 JOIN registros r ON r.id = rc.registro_id
	 JOIN usuarios u ON u.id = rc.usuario_id
	 ORDER BY rc.criado_em DESC`
);

export function listarTodosCompartilhamentos(): CompartilhamentoAdmin[] {
	return listarTodosCompartilhamentosStmt.all() as CompartilhamentoAdmin[];
}

export function atualizarCompartilhamentoAdmin(
	registroId: string,
	usuarioId: string,
	papel: 'editor' | 'administrador'
): void {
	db.prepare(
		'UPDATE registro_compartilhamentos SET papel = @papel WHERE registro_id = @registroId AND usuario_id = @usuarioId'
	).run({ registroId, usuarioId, papel });
}

export function excluirCompartilhamentoAdmin(registroId: string, usuarioId: string): void {
	db.prepare(
		'DELETE FROM registro_compartilhamentos WHERE registro_id = @registroId AND usuario_id = @usuarioId'
	).run({ registroId, usuarioId });
}
