import { error } from '@sveltejs/kit';
import type { ZodType } from 'zod';
import { RegraCardinalidadeError } from './db/repositories/atividades';
import { RegistroJaFinalizadoError, RegistroNaoEncontradoError } from './db/repositories/registros';

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
	let corpo: unknown;
	try {
		corpo = await request.json();
	} catch {
		error(400, 'Corpo da requisicao precisa ser JSON valido.');
	}
	const resultado = schema.safeParse(corpo);
	if (!resultado.success) {
		error(400, resultado.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
	}
	return resultado.data;
}

export function parsePaginationParams(url: URL): { busca?: string; offset: number; limit: number } {
	const busca = url.searchParams.get('busca')?.trim() || undefined;
	const offsetParam = Number(url.searchParams.get('offset'));
	const limitParam = Number(url.searchParams.get('limit'));
	const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? Math.floor(offsetParam) : 0;
	const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 30;
	return { busca, offset, limit };
}

/** Traduz erros de dominio/SQLite para respostas HTTP consistentes nas rotas de API. */
export function toApiError(err: unknown): never {
	if (err instanceof RegraCardinalidadeError) error(400, err.message);
	if (err instanceof RegistroJaFinalizadoError) error(409, err.message);
	if (err instanceof RegistroNaoEncontradoError) error(404, err.message);
	if (err instanceof Error && 'code' in err) {
		// better-sqlite3 anexa .code do erro nativo do SQLite; sem tipo publico exportado, cast pontual justificado.
		const codigo = (err as Error & { code: string }).code;
		if (codigo === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
			error(409, 'Recurso em uso por outro dado e nao pode ser excluido.');
		}
	}
	throw err;
}
