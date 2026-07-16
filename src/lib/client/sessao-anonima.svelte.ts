/**
 * Sessao anonima (sem conta) — ADR-0009. Roda 100% no navegador: nenhuma chamada de
 * rede, tudo em memoria (perdido ao fechar a aba, salvo o que for exportado/importado
 * como JSON). Espelha 1:1 as regras de negocio dos repositories do servidor.
 */
import { uuidv7 } from 'uuidv7';
import { RegraCardinalidadeError, validarCardinalidade } from '$lib/cardinalidade';
import { sanitizarHtmlRico } from '$lib/sanitize';
import type { RegistroExportadoValidado } from '$lib/schemas';
import type {
	Agente,
	AmbienteExecucao,
	Atividade,
	Entidade,
	ParametroAtividade,
	RegistroDetalhado,
	RegistroProvenencia,
	TipoAgente,
	TipoAtividade
} from '$lib/types';

export class RegistroJaFinalizadoError extends Error {}
export class RegistroNaoEncontradoError extends Error {}
export class AgenteEmUsoError extends Error {}
export class EntidadeEmUsoError extends Error {}

interface EstadoSessao {
	registros: RegistroProvenencia[];
	entidades: Entidade[];
	atividades: Atividade[];
	agentes: Agente[];
}

const estado = $state<EstadoSessao>({ registros: [], entidades: [], atividades: [], agentes: [] });

export const sessaoAnonima = {
	get registros() {
		return estado.registros;
	},
	get entidades() {
		return estado.entidades;
	},
	get atividades() {
		return estado.atividades;
	},
	get agentes() {
		return estado.agentes;
	},
	get temDadosNaoSalvos(): boolean {
		return estado.registros.length > 0 || estado.agentes.length > 0;
	},

	limparSessao(): void {
		estado.registros = [];
		estado.entidades = [];
		estado.atividades = [];
		estado.agentes = [];
	},

	// --- Registros ---------------------------------------------------------

	criarRegistro(input: { titulo: string; descricao?: string | null }): RegistroProvenencia {
		const registro: RegistroProvenencia = {
			id: uuidv7(),
			titulo: input.titulo,
			descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : (input.descricao ?? null),
			status: 'rascunho',
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- valor transiente (string), nunca fica em $state.
			criadoEm: new Date().toISOString(),
			finalizadoEm: null
		};
		estado.registros = [registro, ...estado.registros];
		return registro;
	},

	/** Titulo/descricao sao metadados do container — editaveis em qualquer status (§3). */
	atualizarRegistro(
		id: string,
		input: { titulo: string; descricao?: string | null }
	): RegistroProvenencia {
		const registro = this.obterRegistro(id);
		if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
		const atualizado: RegistroProvenencia = {
			...registro,
			titulo: input.titulo,
			descricao: input.descricao ? sanitizarHtmlRico(input.descricao) : (input.descricao ?? null)
		};
		estado.registros = estado.registros.map((r) => (r.id === id ? atualizado : r));
		return atualizado;
	},

	/** Upsert por id (ADR-0004), local — mesma semantica do upload autenticado. */
	importarRegistro(dados: RegistroExportadoValidado): RegistroProvenencia {
		for (const agente of dados.agentes) {
			estado.agentes = estado.agentes.some((a) => a.id === agente.id)
				? estado.agentes.map((a) => (a.id === agente.id ? agente : a))
				: [...estado.agentes, agente];
		}

		const registro: RegistroProvenencia = {
			...dados.registro,
			descricao: dados.registro.descricao ? sanitizarHtmlRico(dados.registro.descricao) : null
		};
		estado.registros = estado.registros.some((r) => r.id === registro.id)
			? estado.registros.map((r) => (r.id === registro.id ? registro : r))
			: [registro, ...estado.registros];

		for (const entidade of dados.entidades) {
			estado.entidades = estado.entidades.some((e) => e.id === entidade.id)
				? estado.entidades.map((e) => (e.id === entidade.id ? entidade : e))
				: [...estado.entidades, entidade];
		}

		for (const atividade of dados.atividades) {
			estado.atividades = estado.atividades.some((a) => a.id === atividade.id)
				? estado.atividades.map((a) => (a.id === atividade.id ? atividade : a))
				: [...estado.atividades, atividade];
		}

		return registro;
	},

	obterRegistro(id: string): RegistroProvenencia | null {
		return estado.registros.find((r) => r.id === id) ?? null;
	},

	finalizarRegistro(id: string): RegistroProvenencia {
		const registro = this.obterRegistro(id);
		if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
		if (registro.status === 'finalizado') {
			throw new RegistroJaFinalizadoError('error.record_already_finalized');
		}
		const atualizado: RegistroProvenencia = {
			...registro,
			status: 'finalizado',
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- valor transiente (string), nunca fica em $state.
			finalizadoEm: new Date().toISOString()
		};
		estado.registros = estado.registros.map((r) => (r.id === id ? atualizado : r));
		return atualizado;
	},

	excluirRegistro(id: string): void {
		estado.registros = estado.registros.filter((r) => r.id !== id);
		estado.entidades = estado.entidades.filter((e) => e.registroId !== id);
		estado.atividades = estado.atividades.filter((a) => a.registroId !== id);
	},

	obterRegistroDetalhado(id: string): RegistroDetalhado | null {
		const registro = this.obterRegistro(id);
		if (!registro) return null;
		const entidades = estado.entidades.filter((e) => e.registroId === id);
		const atividades = estado.atividades.filter((a) => a.registroId === id);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const idsAgentes = new Set(atividades.map((a) => a.agenteId));
		const agentesEnvolvidos = estado.agentes.filter((ag) => idsAgentes.has(ag.id));
		return { registro, entidades, atividades, agentesEnvolvidos };
	},

	// --- Atividades ----------------------------------------------------------

	criarAtividade(
		registroId: string,
		input: {
			tipo: TipoAtividade;
			agenteId: string;
			dataHora: string;
			descricao?: string | null;
			entidadesUsadas: string[];
			local?: string | null;
			instrumento?: string | null;
			processo?: string | null;
			parametros?: ParametroAtividade[] | null;
			ambienteExecucao?: AmbienteExecucao | null;
			entidadesGeradas?: {
				nome: string;
				descricao?: string | null;
				formato?: string | null;
				localizacao?: string | null;
				licenca?: string | null;
			}[];
		}
	): { atividade: Atividade; entidadesGeradas: Entidade[] } {
		if (!this.obterRegistro(registroId)) {
			throw new RegistroNaoEncontradoError('error.record_not_found');
		}
		validarCardinalidade(input);

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const entidadesDoRegistro = new Set(
			estado.entidades.filter((e) => e.registroId === registroId).map((e) => e.id)
		);
		for (const entidadeId of input.entidadesUsadas) {
			if (!entidadesDoRegistro.has(entidadeId)) {
				throw new RegraCardinalidadeError('error.entity_not_in_record');
			}
		}

		const atividadeId = uuidv7();
		const entidadesGeradas: Entidade[] = (input.entidadesGeradas ?? []).map((nova) => ({
			id: uuidv7(),
			registroId,
			nome: nova.nome,
			descricao: nova.descricao ?? null,
			formato: nova.formato ?? null,
			localizacao: nova.localizacao ?? null,
			licenca: nova.licenca ?? null,
			geradaPorAtividadeId: atividadeId
		}));

		const atividade: Atividade = {
			id: atividadeId,
			registroId,
			tipo: input.tipo,
			agenteId: input.agenteId,
			dataHora: input.dataHora,
			descricao: input.descricao ?? null,
			entidadesUsadas: input.entidadesUsadas,
			entidadesGeradas: entidadesGeradas.map((e) => e.id),
			local: input.local ?? null,
			instrumento: input.instrumento ?? null,
			processo: input.processo ?? null,
			parametros: input.parametros ?? null,
			ambienteExecucao: input.ambienteExecucao ?? null
		};

		estado.atividades = [...estado.atividades, atividade];
		estado.entidades = [...estado.entidades, ...entidadesGeradas];

		return { atividade, entidadesGeradas };
	},

	/** Edicao so em Registro Rascunho (ADR-0003) — tipo e imutavel. */
	atualizarAtividade(
		registroId: string,
		atividadeId: string,
		input: {
			agenteId: string;
			dataHora: string;
			descricao?: string | null;
			entidadesUsadas: string[];
			local?: string | null;
			instrumento?: string | null;
			processo?: string | null;
			parametros?: ParametroAtividade[] | null;
			ambienteExecucao?: AmbienteExecucao | null;
			entidadesGeradas?: {
				id?: string;
				nome: string;
				descricao?: string | null;
				formato?: string | null;
				localizacao?: string | null;
				licenca?: string | null;
			}[];
		}
	): { atividade: Atividade; entidadesGeradas: Entidade[] } {
		const registro = this.obterRegistro(registroId);
		if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
		if (registro.status === 'finalizado') {
			throw new RegistroJaFinalizadoError('error.record_read_only');
		}
		const atual = estado.atividades.find(
			(a) => a.id === atividadeId && a.registroId === registroId
		);
		if (!atual) throw new RegistroNaoEncontradoError('error.activity_not_found');

		validarCardinalidade({
			tipo: atual.tipo,
			entidadesUsadas: input.entidadesUsadas,
			entidadesGeradas: input.entidadesGeradas
		});

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const entidadesDoRegistro = new Set(
			estado.entidades.filter((e) => e.registroId === registroId).map((e) => e.id)
		);
		for (const entidadeId of input.entidadesUsadas) {
			if (!entidadesDoRegistro.has(entidadeId)) {
				throw new RegraCardinalidadeError('error.entity_not_in_record');
			}
		}

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const geradasAntesIds = new Set(
			estado.entidades.filter((e) => e.geradaPorAtividadeId === atividadeId).map((e) => e.id)
		);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const mantidas = new Set<string>();
		const entidadesGeradas: Entidade[] = [];
		let entidades = estado.entidades;

		for (const nova of input.entidadesGeradas ?? []) {
			if (nova.id) {
				if (!geradasAntesIds.has(nova.id)) {
					throw new RegraCardinalidadeError('error.entity_not_in_activity');
				}
				const editada: Entidade = {
					id: nova.id,
					registroId,
					nome: nova.nome,
					descricao: nova.descricao ?? null,
					formato: nova.formato ?? null,
					localizacao: nova.localizacao ?? null,
					licenca: nova.licenca ?? null,
					geradaPorAtividadeId: atividadeId
				};
				entidades = entidades.map((e) => (e.id === nova.id ? editada : e));
				mantidas.add(nova.id);
				entidadesGeradas.push(editada);
			} else {
				const criada: Entidade = {
					id: uuidv7(),
					registroId,
					nome: nova.nome,
					descricao: nova.descricao ?? null,
					formato: nova.formato ?? null,
					localizacao: nova.localizacao ?? null,
					licenca: nova.licenca ?? null,
					geradaPorAtividadeId: atividadeId
				};
				entidades = [...entidades, criada];
				entidadesGeradas.push(criada);
			}
		}

		for (const idAntiga of geradasAntesIds) {
			if (mantidas.has(idAntiga)) continue;
			const emUso = estado.atividades.some(
				(a) => a.id !== atividadeId && a.entidadesUsadas.includes(idAntiga)
			);
			if (emUso) {
				throw new EntidadeEmUsoError('error.entity_in_use');
			}
			entidades = entidades.filter((e) => e.id !== idAntiga);
		}

		const atividadeAtualizada: Atividade = {
			...atual,
			agenteId: input.agenteId,
			dataHora: input.dataHora,
			descricao: input.descricao ?? null,
			entidadesUsadas: input.entidadesUsadas,
			entidadesGeradas: entidadesGeradas.map((e) => e.id),
			local: input.local ?? null,
			instrumento: input.instrumento ?? null,
			processo: input.processo ?? null,
			parametros: input.parametros ?? null,
			ambienteExecucao: input.ambienteExecucao ?? null
		};

		estado.entidades = entidades;
		estado.atividades = estado.atividades.map((a) =>
			a.id === atividadeId ? atividadeAtualizada : a
		);

		return { atividade: atividadeAtualizada, entidadesGeradas };
	},

	/** So em Registro Rascunho (ADR-0003). Remove tambem as Entidades geradas — bloqueado se
	 * alguma delas estiver em uso como entrada de outra Atividade. */
	excluirAtividade(registroId: string, atividadeId: string): void {
		const registro = this.obterRegistro(registroId);
		if (!registro) throw new RegistroNaoEncontradoError('error.record_not_found');
		if (registro.status === 'finalizado') {
			throw new RegistroJaFinalizadoError('error.record_read_only');
		}
		const atual = estado.atividades.find(
			(a) => a.id === atividadeId && a.registroId === registroId
		);
		if (!atual) throw new RegistroNaoEncontradoError('error.activity_not_found');

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const geradasIds = new Set(
			estado.entidades.filter((e) => e.geradaPorAtividadeId === atividadeId).map((e) => e.id)
		);
		for (const entidadeId of geradasIds) {
			const emUso = estado.atividades.some(
				(a) => a.id !== atividadeId && a.entidadesUsadas.includes(entidadeId)
			);
			if (emUso) {
				throw new EntidadeEmUsoError('error.entity_in_use');
			}
		}

		estado.entidades = estado.entidades.filter((e) => !geradasIds.has(e.id));
		estado.atividades = estado.atividades.filter((a) => a.id !== atividadeId);
	},

	// --- Agentes ---------------------------------------------------------

	criarAgente(input: {
		nome: string;
		tipo: TipoAgente;
		afiliacao?: string | null;
		identificadorExterno?: string | null;
	}): Agente {
		const agente: Agente = {
			id: uuidv7(),
			nome: input.nome,
			tipo: input.tipo,
			afiliacao: input.afiliacao ?? null,
			identificadorExterno: input.identificadorExterno ?? null
		};
		estado.agentes = [...estado.agentes, agente];
		return agente;
	},

	obterAgente(id: string): Agente | null {
		return estado.agentes.find((a) => a.id === id) ?? null;
	},

	atualizarAgente(
		id: string,
		input: Partial<{
			nome: string;
			tipo: TipoAgente;
			afiliacao: string | null;
			identificadorExterno: string | null;
		}>
	): Agente | null {
		const atual = this.obterAgente(id);
		if (!atual) return null;
		const atualizado: Agente = {
			...atual,
			nome: input.nome ?? atual.nome,
			tipo: input.tipo ?? atual.tipo,
			afiliacao: input.afiliacao !== undefined ? input.afiliacao : atual.afiliacao,
			identificadorExterno:
				input.identificadorExterno !== undefined
					? input.identificadorExterno
					: atual.identificadorExterno
		};
		estado.agentes = estado.agentes.map((a) => (a.id === id ? atualizado : a));
		return atualizado;
	},

	excluirAgente(id: string): void {
		const emUso = estado.atividades.some((a) => a.agenteId === id);
		if (emUso) throw new AgenteEmUsoError('error.agent_in_use');
		estado.agentes = estado.agentes.filter((a) => a.id !== id);
	}
};
