import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { db } from './client';
import { criarBackup, validarBackup, restaurarBackup, BackupInvalidoError } from './backup';
import { criarUsuario } from './repositories/usuarios';
import { criarRegistro } from './repositories/registros';

describe('criarBackup', () => {
	it('produz um Buffer com o cabecalho de arquivo SQLite', () => {
		const buffer = criarBackup();
		expect(buffer.subarray(0, 16).toString('latin1')).toBe('SQLite format 3\0');
	});
});

describe('validarBackup', () => {
	it('aceita um backup real (mesmo schema, tabela registros presente)', () => {
		expect(() => validarBackup(criarBackup())).not.toThrow();
	});

	it('rejeita um buffer que nao e um arquivo SQLite', () => {
		expect(() => validarBackup(Buffer.from('nao e um banco sqlite'))).toThrow(BackupInvalidoError);
	});

	it('rejeita um SQLite valido sem o schema do MyProvenance', () => {
		const outro = new Database(':memory:');
		outro.exec('CREATE TABLE qualquer (id INTEGER)');
		const buffer = outro.serialize();
		outro.close();
		expect(() => validarBackup(buffer)).toThrow(BackupInvalidoError);
	});
});

describe('restaurarBackup', () => {
	it('troca o conteudo da conexao viva sem invalidar Statements ja preparados', () => {
		const dono = criarUsuario({ username: 'teste_restore_a', pin: '123456' });
		criarRegistro(dono.id, { titulo: 'Antes da restauracao' });
		const snapshot = criarBackup();

		criarUsuario({ username: 'teste_restore_b', pin: '123456' });

		restaurarBackup(snapshot);

		// listarUsuarios ja tinha Statement preparado antes da restauracao (import de admin.ts) —
		// continua funcionando e reflete o estado restaurado (sem teste_restore_b).
		const usernames = (
			db.prepare('SELECT username FROM usuarios').all() as Array<{ username: string }>
		).map((u) => u.username);
		expect(usernames).toContain('teste_restore_a');
		expect(usernames).not.toContain('teste_restore_b');
	});

	it('desfaz tudo (rollback) se o backup enviado violar integridade referencial', () => {
		const dono = criarUsuario({ username: 'teste_restore_fk', pin: '123456' });
		criarRegistro(dono.id, { titulo: 'Preservado apos rollback' });

		const corrompido = new Database(':memory:');
		corrompido.pragma('foreign_keys = OFF');
		corrompido.exec(
			`CREATE TABLE usuarios (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL, criado_em TEXT NOT NULL);
			 CREATE TABLE registros (id TEXT PRIMARY KEY, usuario_id TEXT REFERENCES usuarios(id), titulo TEXT NOT NULL, descricao TEXT, status TEXT NOT NULL DEFAULT 'rascunho', criado_em TEXT NOT NULL, finalizado_em TEXT, direcao_diagrama TEXT NOT NULL DEFAULT 'LR', token_compartilhamento TEXT);`
		);
		corrompido
			.prepare(
				`INSERT INTO registros (id, usuario_id, titulo, criado_em) VALUES ('r-orfao', 'inexistente', 'orfao', '2026-01-01')`
			)
			.run();
		const bufferCorrompido = corrompido.serialize();
		corrompido.close();

		expect(() => restaurarBackup(bufferCorrompido)).toThrow(BackupInvalidoError);

		const registro = db
			.prepare('SELECT 1 FROM registros WHERE titulo = ?')
			.get('Preservado apos rollback');
		expect(registro).toBeTruthy();
		expect(db.prepare("SELECT 1 FROM registros WHERE id = 'r-orfao'").get()).toBeUndefined();
	});
});
