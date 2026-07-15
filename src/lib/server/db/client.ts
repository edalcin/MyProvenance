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
