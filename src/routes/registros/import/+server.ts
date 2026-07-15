import { error, json } from '@sveltejs/kit';
import { registroExportadoSchema } from '$lib/schemas';
import { SCHEMA_VERSION } from '$lib/types';
import { parseBody } from '$lib/server/api-utils';
import { importarRegistro } from '$lib/server/db/repositories/import';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import type { RequestHandler } from './$types';

/**
 * Upload de JSON exportado — upsert por id, ADR-0004.
 * Aceita schemaVersion <= atual (ADR-0005: evoluir o formato sem quebrar uploads antigos) — o
 * parse Zod ja tolera campos de versoes anteriores ausentes (default). So versoes futuras
 * (geradas por uma instancia mais nova) sao rejeitadas, para nao importar um formato desconhecido.
 */
export const POST: RequestHandler = async ({ request }) => {
	const dados = await parseBody(request, registroExportadoSchema);
	if (dados.schemaVersion < 1 || dados.schemaVersion > SCHEMA_VERSION) {
		error(400, `schemaVersion ${dados.schemaVersion} nao suportado (maximo ${SCHEMA_VERSION}).`);
	}
	importarRegistro(dados);
	return json(obterRegistroDetalhado(dados.registro.id), { status: 200 });
};
