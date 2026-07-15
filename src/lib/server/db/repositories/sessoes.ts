import { db } from '../client';
import type { Usuario } from '$lib/types';
import { gerarTokenSessao, hashToken } from '$lib/server/auth';

const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias, renovada a cada uso (sliding)

interface SessaoRow {
	usuario_id: string;
	username: string;
}

export function criarSessao(usuarioId: string): { token: string; expiraEm: string } {
	const token = gerarTokenSessao();
	const agora = new Date();
	const expiraEm = new Date(agora.getTime() + DURACAO_SESSAO_MS).toISOString();
	db.prepare(
		`INSERT INTO sessoes (token_hash, usuario_id, criado_em, expira_em)
		 VALUES (@tokenHash, @usuarioId, @criadoEm, @expiraEm)`
	).run({ tokenHash: hashToken(token), usuarioId, criadoEm: agora.toISOString(), expiraEm });
	return { token, expiraEm };
}

export function obterUsuarioPorToken(token: string): Usuario | null {
	const tokenHash = hashToken(token);
	const row = db
		.prepare(
			`SELECT s.usuario_id, u.username FROM sessoes s
			 JOIN usuarios u ON u.id = s.usuario_id
			 WHERE s.token_hash = @tokenHash AND s.expira_em > @agora`
		)
		.get({ tokenHash, agora: new Date().toISOString() }) as SessaoRow | undefined;
	if (!row) return null;

	// Sliding expiration: renova a validade a cada uso.
	const novaExpiracao = new Date(Date.now() + DURACAO_SESSAO_MS).toISOString();
	db.prepare('UPDATE sessoes SET expira_em = @novaExpiracao WHERE token_hash = @tokenHash').run({
		novaExpiracao,
		tokenHash
	});

	return { id: row.usuario_id, username: row.username };
}

export function encerrarSessao(token: string): void {
	db.prepare('DELETE FROM sessoes WHERE token_hash = @tokenHash').run({
		tokenHash: hashToken(token)
	});
}
