/**
 * Fachada unica de acesso a dados no cliente (ADR-0009). Componentes de UI chamam
 * sempre estas funcoes, nunca `fetch` diretamente — internamente decidem servidor
 * (conta autenticada) vs sessao anonima local (sem rede), conforme `usuarioAtual`.
 * Erro sempre vira um `Error` com `.message` legivel, nos dois modos.
 */
import { usuarioAtual } from './usuario-atual.svelte';
import { sessaoAnonima } from './sessao-anonima.svelte';
import type {
	Agente,
	Atividade,
	Entidade,
	RegistroDetalhado,
	RegistroProvenencia,
	TipoAgente
} from '$lib/types';
import type {
	AtualizarAtividadeInput,
	CriarAtividadeInput,
	RegistroExportadoValidado
} from '$lib/schemas';

interface Pagina<T> {
	items: T[];
	nextOffset: number | null;
}

function autenticado(): boolean {
	return usuarioAtual.valor !== null;
}

async function extrairErro(resposta: Response, fallback: string): Promise<Error> {
	const corpo = await resposta.json().catch(() => null);
	return new Error(corpo?.message ?? fallback);
}

// --- Registros ---------------------------------------------------------

export async function listarRegistros(opts: {
	busca?: string;
	offset?: number;
	limit?: number;
}): Promise<Pagina<RegistroProvenencia>> {
	if (!autenticado()) {
		const termo = opts.busca?.trim().toLowerCase();
		const items = termo
			? sessaoAnonima.registros.filter((r) => r.titulo.toLowerCase().includes(termo))
			: sessaoAnonima.registros;
		return { items, nextOffset: null };
	}
	const params = new URLSearchParams({ limit: String(opts.limit ?? 20) });
	if (opts.busca) params.set('busca', opts.busca);
	if (opts.offset) params.set('offset', String(opts.offset));
	const resposta = await fetch(`/registros?${params}`);
	return resposta.json();
}

export async function criarRegistro(input: {
	titulo: string;
	descricao?: string | null;
}): Promise<RegistroProvenencia> {
	if (!autenticado()) return sessaoAnonima.criarRegistro(input);
	const resposta = await fetch('/registros', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao criar Registro.');
	return resposta.json();
}

export async function excluirRegistro(id: string): Promise<void> {
	if (!autenticado()) return sessaoAnonima.excluirRegistro(id);
	const resposta = await fetch(`/registros/${id}`, { method: 'DELETE' });
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao excluir Registro.');
}

export async function finalizarRegistro(id: string): Promise<RegistroProvenencia> {
	if (!autenticado()) return sessaoAnonima.finalizarRegistro(id);
	const resposta = await fetch(`/registros/${id}/finalizar`, { method: 'POST' });
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao finalizar Registro.');
	return resposta.json();
}

export async function obterRegistroDetalhado(id: string): Promise<RegistroDetalhado | null> {
	if (!autenticado()) return sessaoAnonima.obterRegistroDetalhado(id);
	const resposta = await fetch(`/registros/${id}`);
	if (resposta.status === 404) return null;
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao carregar Registro.');
	return resposta.json();
}

/** Upload/import upsert por id (ADR-0004) — retorna o Registro resultante nos dois modos. */
export async function importarRegistro(
	dados: RegistroExportadoValidado
): Promise<RegistroProvenencia> {
	if (!autenticado()) return sessaoAnonima.importarRegistro(dados);
	const resposta = await fetch('/registros/import', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(dados)
	});
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao importar Registro.');
	const detalhe: { registro: RegistroProvenencia } = await resposta.json();
	return detalhe.registro;
}

// --- Atividades ----------------------------------------------------------

export async function criarAtividade(
	registroId: string,
	input: CriarAtividadeInput
): Promise<{ atividade: Atividade; entidadesGeradas: Entidade[] }> {
	if (!autenticado()) return sessaoAnonima.criarAtividade(registroId, input);
	const resposta = await fetch(`/registros/${registroId}/atividades`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao criar Atividade.');
	return resposta.json();
}

export async function atualizarAtividade(
	registroId: string,
	atividadeId: string,
	input: AtualizarAtividadeInput
): Promise<{ atividade: Atividade; entidadesGeradas: Entidade[] }> {
	if (!autenticado()) return sessaoAnonima.atualizarAtividade(registroId, atividadeId, input);
	const resposta = await fetch(`/registros/${registroId}/atividades/${atividadeId}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao atualizar Atividade.');
	return resposta.json();
}

// --- Agentes -------------------------------------------------------------

export async function listarAgentes(opts: {
	busca?: string;
	offset?: number;
	limit?: number;
}): Promise<Pagina<Agente>> {
	if (!autenticado()) {
		const termo = opts.busca?.trim().toLowerCase();
		const items = termo
			? sessaoAnonima.agentes.filter((a) => a.nome.toLowerCase().includes(termo))
			: sessaoAnonima.agentes;
		return { items, nextOffset: null };
	}
	const params = new URLSearchParams({ limit: String(opts.limit ?? 30) });
	if (opts.busca) params.set('busca', opts.busca);
	if (opts.offset) params.set('offset', String(opts.offset));
	const resposta = await fetch(`/agentes?${params}`);
	return resposta.json();
}

export async function criarAgente(input: {
	nome: string;
	tipo: TipoAgente;
	afiliacao?: string | null;
	identificadorExterno?: string | null;
}): Promise<Agente> {
	if (!autenticado()) return sessaoAnonima.criarAgente(input);
	const resposta = await fetch('/agentes', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao criar Agente.');
	return resposta.json();
}

export async function atualizarAgente(
	id: string,
	input: Partial<{
		nome: string;
		tipo: TipoAgente;
		afiliacao: string | null;
		identificadorExterno: string | null;
	}>
): Promise<Agente> {
	if (!autenticado()) {
		const atualizado = sessaoAnonima.atualizarAgente(id, input);
		if (!atualizado) throw new Error('Agente nao encontrado.');
		return atualizado;
	}
	const resposta = await fetch(`/agentes/${id}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao salvar Agente.');
	return resposta.json();
}

export async function excluirAgente(id: string): Promise<void> {
	if (!autenticado()) return sessaoAnonima.excluirAgente(id);
	const resposta = await fetch(`/agentes/${id}`, { method: 'DELETE' });
	if (!resposta.ok) throw await extrairErro(resposta, 'Erro ao excluir Agente.');
}
