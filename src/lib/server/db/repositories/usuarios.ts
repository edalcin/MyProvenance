import { uuidv7 } from 'uuidv7';
import { db } from '../client';
import type { Usuario } from '$lib/types';
import { gerarSaltHex, hashPin, verificarPin } from '$lib/server/auth';

interface UsuarioRow {
	id: string;
	username: string;
	pin_hash: string;
	pin_salt: string;
}

export interface UsuarioComHash extends Usuario {
	pinHash: string;
	pinSalt: string;
}

function mapRow(row: UsuarioRow): UsuarioComHash {
	return { id: row.id, username: row.username, pinHash: row.pin_hash, pinSalt: row.pin_salt };
}

export interface UsuarioInput {
	username: string;
	pin: string;
}

export function criarUsuario(input: UsuarioInput): Usuario {
	const id = uuidv7();
	const pinSalt = gerarSaltHex();
	const pinHash = hashPin(input.pin, pinSalt);
	db.prepare(
		`INSERT INTO usuarios (id, username, pin_hash, pin_salt, criado_em)
		 VALUES (@id, @username, @pinHash, @pinSalt, @criadoEm)`
	).run({ id, username: input.username, pinHash, pinSalt, criadoEm: new Date().toISOString() });
	return { id, username: input.username };
}

export function obterUsuarioPorUsername(username: string): UsuarioComHash | null {
	const row = db.prepare('SELECT * FROM usuarios WHERE username = @username').get({
		username
	}) as UsuarioRow | undefined;
	return row ? mapRow(row) : null;
}

export function obterUsuarioPorId(id: string): Usuario | null {
	const row = db.prepare('SELECT * FROM usuarios WHERE id = @id').get({ id }) as
		UsuarioRow | undefined;
	return row ? { id: row.id, username: row.username } : null;
}

/** Verifica username+PIN; retorna o usuário se válido, null caso contrário. */
export function autenticar(username: string, pin: string): Usuario | null {
	const usuario = obterUsuarioPorUsername(username);
	if (!usuario) return null;
	if (!verificarPin(pin, usuario.pinSalt, usuario.pinHash)) return null;
	return { id: usuario.id, username: usuario.username };
}
