/**
 * Compartilhamento de edicao de um Registro entre Contas (docs/especificacao.md §2.6/§7).
 * Dono (registros.usuario_id) nunca aparece em registro_compartilhamentos; administrador tem
 * paridade com o dono (exceto ser removido); editor fica restrito a conteudo.
 */
import { db } from '../client';
import type { AcessoRegistro, PapelAcesso } from '$lib/types';
import { papelAtendeMinimo } from '$lib/types';
import { obterRegistro, RegistroNaoEncontradoError } from './registros';
import { obterUsuarioPorUsername } from './usuarios';

export class UsuarioNaoEncontradoError extends Error {}
export class AutoCompartilhamentoError extends Error {}

interface AcessoRow {
	usuarioId: string;
	username: string;
	papel: PapelAcesso;
}

const listarAcessosStmt = db.prepare(
	`SELECT r.usuario_id AS usuarioId, u.username, 'dono' AS papel
	 FROM registros r JOIN usuarios u ON u.id = r.usuario_id WHERE r.id = @registroId
	 UNION ALL
	 SELECT rc.usuario_id AS usuarioId, u.username, rc.papel
	 FROM registro_compartilhamentos rc JOIN usuarios u ON u.id = rc.usuario_id
	 WHERE rc.registro_id = @registroId`
);

/** Dono + coeditores com acesso ao Registro, para exibir no dialog "Compartilhar". Leitura: editor+. */
export function listarAcessos(registroId: string, usuarioId: string): AcessoRegistro[] {
	if (!obterRegistro(registroId, usuarioId)) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	return listarAcessosStmt.all({ registroId }) as AcessoRow[];
}

const upsertCompartilhamentoStmt = db.prepare(
	`INSERT INTO registro_compartilhamentos (registro_id, usuario_id, papel, criado_em)
	 VALUES (@registroId, @usuarioId, @papel, @criadoEm)
	 ON CONFLICT (registro_id, usuario_id) DO UPDATE SET papel = excluded.papel`
);

/**
 * Dono/administrador convidam por username; idempotente (compartilhar de novo so atualiza o
 * papel, nunca duplica linha nem rotaciona nada). Requer administrador+.
 */
export function compartilharComUsuario(
	registroId: string,
	usuarioId: string,
	input: { username: string; papel: PapelAcesso }
): AcessoRegistro[] {
	const registro = obterRegistro(registroId, usuarioId);
	if (!registro || !papelAtendeMinimo(registro.meuPapel, 'administrador')) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	const alvo = obterUsuarioPorUsername(input.username);
	if (!alvo) throw new UsuarioNaoEncontradoError('error.user_not_found');
	if (alvo.id === usuarioId) throw new AutoCompartilhamentoError('error.cannot_share_with_self');
	const donoRow = db
		.prepare('SELECT usuario_id FROM registros WHERE id = @registroId')
		.get({ registroId }) as { usuario_id: string } | undefined;
	if (donoRow?.usuario_id === alvo.id) {
		throw new AutoCompartilhamentoError('error.cannot_share_with_owner');
	}
	upsertCompartilhamentoStmt.run({
		registroId,
		usuarioId: alvo.id,
		papel: input.papel,
		criadoEm: new Date().toISOString()
	});
	return listarAcessos(registroId, usuarioId);
}

const removerCompartilhamentoStmt = db.prepare(
	'DELETE FROM registro_compartilhamentos WHERE registro_id = @registroId AND usuario_id = @usuarioAlvoId'
);

/**
 * Dono/administrador removem qualquer coeditor; qualquer coeditor pode sair (remover a si
 * mesmo). Dono nunca esta na tabela — DELETE nele e' sempre no-op (inalcancavel pela UI).
 */
export function removerCompartilhamento(
	registroId: string,
	usuarioId: string,
	usuarioAlvoId: string
): void {
	const registro = obterRegistro(registroId, usuarioId);
	if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
	const autoRemocao = usuarioAlvoId === usuarioId;
	if (!autoRemocao && !papelAtendeMinimo(registro.meuPapel, 'administrador')) {
		throw new RegistroNaoEncontradoError('error.record_not_found');
	}
	removerCompartilhamentoStmt.run({ registroId, usuarioAlvoId });
}
