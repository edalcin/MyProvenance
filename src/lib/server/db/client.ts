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
// Indices fora do `if`: idx_registros_usuario/idx_agentes_usuario precisam ser criados aqui (nao
// no schema.sql estatico) porque um exec incondicional sobre registros(usuario_id)/agentes(usuario_id)
// quebraria com "no such column" num banco legado antes da migracao acima rodar.
db.exec('CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros(usuario_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_agentes_usuario ON agentes(usuario_id)');

// Migracao idempotente: bancos criados antes da orientacao de diagrama persistida e do
// compartilhamento publico nao tem essas colunas em registros.
if (!colunaExiste('registros', 'direcao_diagrama')) {
	db.exec(
		`ALTER TABLE registros ADD COLUMN direcao_diagrama TEXT NOT NULL CHECK (direcao_diagrama IN ('LR','TD')) DEFAULT 'LR'`
	);
}
if (!colunaExiste('registros', 'token_compartilhamento')) {
	db.exec('ALTER TABLE registros ADD COLUMN token_compartilhamento TEXT');
}
// Indice fora do `if`: precisa existir tanto em banco novo (coluna ja veio do CREATE TABLE,
// nunca entra no if acima) quanto em banco migrado (coluna acabou de ser adicionada).
db.exec(
	'CREATE UNIQUE INDEX IF NOT EXISTS idx_registros_token_compartilhamento ON registros(token_compartilhamento)'
);
