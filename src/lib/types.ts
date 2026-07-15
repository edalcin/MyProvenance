/**
 * Modelo de domínio — espelha docs/especificacao.md §2.
 * Linguagem ubíqua em português (ADR-0007): nomes de campo iguais ao SQLite/JSON exportado.
 */

export type StatusRegistro = 'rascunho' | 'finalizado';
export type TipoAtividade = 'criacao' | 'transformacao' | 'analise';
export type TipoAgente = 'pessoa' | 'instituicao' | 'software';

export interface Agente {
	id: string;
	nome: string;
	tipo: TipoAgente;
	afiliacao: string | null;
	identificadorExterno: string | null;
}

export interface RegistroProvenencia {
	id: string;
	titulo: string;
	descricao: string | null;
	status: StatusRegistro;
	criadoEm: string;
	finalizadoEm: string | null;
}

export interface Entidade {
	id: string;
	registroId: string;
	nome: string;
	descricao: string | null;
	formato: string | null;
	localizacao: string | null;
	licenca: string | null;
	geradaPorAtividadeId: string;
}

export interface PacoteAmbiente {
	nome: string;
	versao: string;
}

export interface AmbienteExecucao {
	sistemaOperacional?: string;
	pacotes?: PacoteAmbiente[];
}

export interface ParametroAtividade {
	chave: string;
	valor: string;
}

export interface Atividade {
	id: string;
	registroId: string;
	tipo: TipoAtividade;
	agenteId: string;
	dataHora: string;
	descricao: string | null;
	entidadesUsadas: string[];
	entidadeGeradaId: string | null;
	// Criação
	local: string | null;
	instrumento: string | null;
	// Transformação / Análise
	processo: string | null;
	parametros: ParametroAtividade[] | null;
	ambienteExecucao: AmbienteExecucao | null;
}

/** Formato do JSON exportado/importado — docs/especificacao.md §4. */
export interface RegistroExportado {
	schemaVersion: number;
	registro: Omit<RegistroProvenencia, 'id'> & { id: string };
	agentes: Agente[];
	entidades: Entidade[];
	atividades: Atividade[];
}

export const SCHEMA_VERSION = 1;

export const FORMATOS_SUGERIDOS = [
	'CSV',
	'TSV',
	'XLSX',
	'ODS',
	'JSON',
	'Parquet',
	'GeoTIFF',
	'Shapefile',
	'GeoJSON'
] as const;
