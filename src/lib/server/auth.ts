/**
 * Hash de PIN (scrypt + salt) e geração/hash de token de sessão.
 * Usa apenas `node:crypto` — sem dependência nova (CLAUDE.md: minimizar deps).
 */
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const SCRYPT_KEYLEN = 64;

export function gerarSaltHex(): string {
	return randomBytes(16).toString('hex');
}

export function hashPin(pin: string, saltHex: string): string {
	return scryptSync(pin, saltHex, SCRYPT_KEYLEN).toString('hex');
}

export function verificarPin(pin: string, saltHex: string, hashHex: string): boolean {
	const calculado = scryptSync(pin, saltHex, SCRYPT_KEYLEN);
	const esperado = Buffer.from(hashHex, 'hex');
	if (calculado.length !== esperado.length) return false;
	return timingSafeEqual(calculado, esperado);
}

export function gerarTokenSessao(): string {
	return randomBytes(32).toString('hex');
}

/** Token opaco do link publico de compartilhamento (Registro somente leitura) — 24 bytes, URL-safe. */
export function gerarTokenCompartilhamento(): string {
	return randomBytes(24).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}
