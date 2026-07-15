import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import schema from './schema.sql?raw';

const DB_PATH = env.DB_PATH || './data/myprovenance.sqlite';

if (DB_PATH !== ':memory:') {
	mkdirSync(dirname(resolve(DB_PATH)), { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(schema);

// Migracao idempotente: bancos criados antes das contas opcionais nao tem
// usuario_id em registros/agentes (CREATE TABLE IF NOT EXISTS nao adiciona
// colunas em tabelas ja existentes).
function colunaExiste(tabela: string, coluna: string): boolean {
	const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all() as Array<{ name: string }>;
	return colunas.some((c) => c.name === coluna);
}

for (const tabela of ['registros', 'agentes']) {
	if (!colunaExiste(tabela, 'usuario_id')) {
		db.exec(`ALTER TABLE ${tabela} ADD COLUMN usuario_id TEXT REFERENCES usuarios(id)`);
	}
}
