/**
 * Modelo de domínio — espelha docs/especificacao.md §2.
 * Linguagem ubíqua em português (ADR-0007): nomes de campo iguais ao SQLite/JSON exportado.
 */

export type StatusRegistro = 'rascunho' | 'finalizado';
export type TipoAtividade = 'criacao' | 'transformacao' | 'analise';
export type TipoAgente = 'pessoa' | 'instituicao' | 'software';
export type TipoRelacaoOrigem = 'derivacao' | 'revisao';

export interface Agente {
	id: string;
	nome: string;
	tipo: TipoAgente;
	afiliacao: string | null;
	identificadorExterno: string | null;
	/** true quando este Agente pertence a outra Conta que nao a de quem esta lendo — so calculado em
	 * agentesEnvolvidos de RegistroDetalhado (Registro compartilhado); undefined no catalogo proprio. */
	deOutraConta?: boolean;
}

export interface Usuario {
	id: string;
	username: string;
}

/**
 * Papel de acesso a um Registro compartilhado — hierarquia dono > administrador > editor
 * (docs/especificacao.md §2.6). Dono nunca aparece em `registro_compartilhamentos` (e' sempre
 * `registros.usuario_id`); administrador/editor sao concedidos via compartilhamento.
 */
export type PapelAcesso = 'dono' | 'administrador' | 'editor';

const RANK_PAPEL_ACESSO: Record<PapelAcesso, number> = { editor: 1, administrador: 2, dono: 3 };

/** true se `papel` atende ou supera `minimo` na hierarquia dono > administrador > editor. */
export function papelAtendeMinimo(
	papel: PapelAcesso | null | undefined,
	minimo: PapelAcesso
): boolean {
	return !!papel && RANK_PAPEL_ACESSO[papel] >= RANK_PAPEL_ACESSO[minimo];
}

/** Usuario com acesso a um Registro compartilhado, para exibir no dialog "Compartilhar". */
export interface AcessoRegistro {
	usuarioId: string;
	username: string;
	papel: PapelAcesso;
}

export type DirecaoDiagrama = 'LR' | 'TD';

export interface RegistroProvenencia {
	id: string;
	titulo: string;
	descricao: string | null;
	status: StatusRegistro;
	criadoEm: string;
	finalizadoEm: string | null;
	/** Orientacao do diagrama Mermaid — persistida para o relatorio .md respeitar a escolha (docs/especificacao.md §5-6). */
	direcaoDiagrama: DirecaoDiagrama;
	/** Token do link publico de leitura (compartilhamento); null = nao compartilhado. Nunca sai no JSON exportado. */
	tokenCompartilhamento: string | null;
	/**
	 * Papel do usuario que fez a consulta (dono/administrador/editor via compartilhamento).
	 * Ausente (undefined) em contextos sem esse conceito — sessao anonima, fixtures de teste —
	 * tratado pela UI como 'dono' (acesso total local, comportamento historico preservado).
	 */
	meuPapel?: PapelAcesso;
	/** username do dono, quando meuPapel !== 'dono' (Registro compartilhado comigo); null se sou o dono. */
	donoUsername?: string | null;
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
	/** Relação PROV desta Entidade com sua origem: derivação (wasDerivedFrom) ou revisão (wasRevisionOf). null = sem relação explícita. */
	tipoRelacaoOrigem: TipoRelacaoOrigem | null;
	/** Entidade de entrada revisada (só quando tipoRelacaoOrigem === 'revisao'); precisa estar entre as entidadesUsadas da Atividade geradora. */
	revisaoDeId: string | null;
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
	entidadesGeradas: string[];
	// Criação
	local: string | null;
	instrumento: string | null;
	// Transformação / Análise
	processo: string | null;
	parametros: ParametroAtividade[] | null;
	ambienteExecucao: AmbienteExecucao | null;
}

/**
 * Formato do JSON exportado/importado — docs/especificacao.md §4. Whitelist explicito (nao deriva
 * de RegistroProvenencia): direcaoDiagrama/tokenCompartilhamento sao metadados de UI/compartilhamento,
 * nunca fazem parte do snapshot portatil.
 */
export interface RegistroExportado {
	schemaVersion: number;
	registro: Pick<
		RegistroProvenencia,
		'id' | 'titulo' | 'descricao' | 'status' | 'criadoEm' | 'finalizadoEm'
	>;
	agentes: Agente[];
	entidades: Entidade[];
	atividades: Atividade[];
}

export const SCHEMA_VERSION = 3;

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

/** Registro + grafo completo — retornado por obterRegistroDetalhado (servidor e sessao anonima). */
export interface RegistroDetalhado {
	registro: RegistroProvenencia;
	entidades: Entidade[];
	atividades: Atividade[];
	agentesEnvolvidos: Agente[];
}
