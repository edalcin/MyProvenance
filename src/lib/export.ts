import { SCHEMA_VERSION, type RegistroDetalhado, type RegistroExportado } from '$lib/types';

/** Formato do JSON exportado/importado — docs/especificacao.md §4. */
export function gerarJsonExportado(detalhe: RegistroDetalhado): RegistroExportado {
	return {
		schemaVersion: SCHEMA_VERSION,
		registro: detalhe.registro,
		agentes: detalhe.agentesEnvolvidos,
		entidades: detalhe.entidades,
		atividades: detalhe.atividades
	};
}
