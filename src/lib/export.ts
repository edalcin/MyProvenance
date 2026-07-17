import { SCHEMA_VERSION, type RegistroDetalhado, type RegistroExportado } from '$lib/types';

/** Formato do JSON exportado/importado — docs/especificacao.md §4. */
export function gerarJsonExportado(detalhe: RegistroDetalhado): RegistroExportado {
	const { id, titulo, descricao, status, criadoEm, finalizadoEm } = detalhe.registro;
	return {
		schemaVersion: SCHEMA_VERSION,
		registro: { id, titulo, descricao, status, criadoEm, finalizadoEm },
		agentes: detalhe.agentesEnvolvidos,
		entidades: detalhe.entidades,
		atividades: detalhe.atividades
	};
}
