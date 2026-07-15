import { error, json } from '@sveltejs/kit';
import { registroExportadoSchema } from '$lib/schemas';
import { SCHEMA_VERSION } from '$lib/types';
import { parseBody } from '$lib/server/api-utils';
import { importarRegistro } from '$lib/server/db/repositories/import';
import { obterRegistroDetalhado } from '$lib/server/db/repositories/registros';
import type { RequestHandler } from './$types';

/** Upload de JSON exportado — upsert por id, ADR-0004. */
export const POST: RequestHandler = async ({ request }) => {
	const dados = await parseBody(request, registroExportadoSchema);
	if (dados.schemaVersion !== SCHEMA_VERSION) {
		error(400, `schemaVersion ${dados.schemaVersion} nao suportado (esperado ${SCHEMA_VERSION}).`);
	}
	importarRegistro(dados);
	return json(obterRegistroDetalhado(dados.registro.id), { status: 200 });
};
