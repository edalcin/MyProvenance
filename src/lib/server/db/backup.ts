/**
 * Backup/restauracao do SQLite pela area administrativa (ADM_PWD) — mesmo padrao usado nos
 * outros projetos (Go: ATTACH/copy na conexao viva, sem reiniciar o processo).
 *
 * Backup: `db.serialize()` — snapshot sincrono e consistente da conexao ja aberta.
 *
 * Restauracao: os repositories preparam Statements uma vez no import, presos a conexao `db`
 * original — trocar o ARQUIVO em disco nao os atualizaria. Por isso a restauracao acontece
 * dentro da MESMA conexao: o backup enviado e' ANEXADO (`ATTACH DATABASE`) como schema `origem` e
 * o conteudo de cada tabela e' trocado (DELETE + INSERT) numa unica transacao — o schema/conexao
 * nao mudam, so os dados, entao os Statements ja preparados continuam validos sem reiniciar nada.
 * `foreign_key_check` roda dentro da transacao: qualquer inconsistencia desfaz tudo (rollback
 * automatico do better-sqlite3 ao lancar dentro de `db.transaction`), sem corromper o banco vivo.
 *
 * Validacao (e ATTACH) sempre abrem um ARQUIVO temporario, nunca `new Database(buffer)` direto —
 * o modo buffer (`sqlite3_deserialize`) do better-sqlite3 nao suporta `{ readonly: true }`
 * (SQLITE_CANTOPEN); via arquivo e' o caminho documentado, reaproveitado tambem pelo ATTACH.
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { db } from './client';

export class BackupInvalidoError extends Error {}

/** Tabela usada para confirmar que o arquivo enviado e' um banco do MyProvenance, nao so um SQLite qualquer. */
const TABELA_ESPERADA = 'registros';

export function criarBackup(): Buffer {
	return db.serialize();
}

function validarArquivoSqlite(caminho: string): void {
	let temp: InstanceType<typeof Database> | undefined;
	try {
		temp = new Database(caminho, { readonly: true });
		if (temp.pragma('integrity_check', { simple: true }) !== 'ok') {
			throw new BackupInvalidoError('error.backup_corrupted');
		}
		const tabela = temp
			.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get(TABELA_ESPERADA);
		if (!tabela) throw new BackupInvalidoError('error.backup_wrong_schema');
	} catch (err) {
		if (err instanceof BackupInvalidoError) throw err;
		throw new BackupInvalidoError('error.backup_invalid_file');
	} finally {
		temp?.close();
	}
}

/** Grava o buffer num arquivo temporario so pra validar (integridade + schema), sem tocar a conexao viva. */
export function validarBackup(buffer: Buffer): void {
	const tempPath = join(tmpdir(), `myprovenance-validate-${randomUUID()}.sqlite`);
	writeFileSync(tempPath, buffer);
	try {
		validarArquivoSqlite(tempPath);
	} finally {
		if (existsSync(tempPath)) rmSync(tempPath);
	}
}

export function restaurarBackup(buffer: Buffer): void {
	// Nomes de tabela vem do schema VIVO (nosso, confiavel) — nunca interpolamos nome de tabela
	// vindo do arquivo enviado, so os dados (via bind param), pra nao abrir injecao de SQL.
	const tabelas = (
		db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
			.all() as Array<{ name: string }>
	).map((r) => r.name);

	const tempPath = join(tmpdir(), `myprovenance-restore-${randomUUID()}.sqlite`);
	writeFileSync(tempPath, buffer);
	try {
		validarArquivoSqlite(tempPath);

		db.pragma('foreign_keys = OFF');
		try {
			db.prepare('ATTACH DATABASE ? AS origem').run(tempPath);
			try {
				const existeNoOrigemStmt = db.prepare(
					"SELECT 1 FROM origem.sqlite_master WHERE type = 'table' AND name = ?"
				);
				const restaurar = db.transaction(() => {
					for (const nome of tabelas) {
						if (!existeNoOrigemStmt.get(nome)) continue;
						db.exec(`DELETE FROM main."${nome}"`);
						db.exec(`INSERT INTO main."${nome}" SELECT * FROM origem."${nome}"`);
					}
					const violacoes = db.pragma('foreign_key_check') as unknown[];
					if (violacoes.length > 0) throw new BackupInvalidoError('error.backup_wrong_schema');
				});
				restaurar();
			} finally {
				db.exec('DETACH DATABASE origem');
			}
		} finally {
			db.pragma('foreign_keys = ON');
		}
	} finally {
		if (existsSync(tempPath)) rmSync(tempPath);
	}
}
