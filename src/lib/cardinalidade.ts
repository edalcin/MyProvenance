/**
 * Regra de cardinalidade de Atividade — pura, sem dependencia de DB. Roda tanto no
 * repository do servidor quanto na sessao anonima do cliente (ADR-0009), garantindo
 * a mesma validacao nos dois modos.
 *
 * CONTEXT.md: Criacao usa 0 gera 1+, Transformacao usa 1+ gera 1+, Analise usa 1+ gera 0+.
 */
import type { TipoAtividade, TipoRelacaoOrigem } from './types';

export class RegraCardinalidadeError extends Error {}

export function validarCardinalidade(input: {
	tipo: TipoAtividade;
	entidadesUsadas: string[];
	entidadesGeradas?: unknown[];
}): void {
	const usadas = input.entidadesUsadas.length;
	const geradas = input.entidadesGeradas?.length ?? 0;
	if (input.tipo === 'criacao') {
		if (usadas !== 0) throw new RegraCardinalidadeError('error.cardinality.creation_uses_entities');
		if (geradas < 1) throw new RegraCardinalidadeError('error.cardinality.creation_needs_output');
	} else if (input.tipo === 'transformacao') {
		if (usadas < 1)
			throw new RegraCardinalidadeError('error.cardinality.transformation_needs_input');
		if (geradas < 1) {
			throw new RegraCardinalidadeError('error.cardinality.transformation_needs_output');
		}
	} else if (usadas < 1) {
		throw new RegraCardinalidadeError('error.cardinality.analysis_needs_input');
	}
}

/** Regra de origem das Entidades geradas: Revisão exige revisaoDeId ∈ entidadesUsadas. Derivação/null ignoram revisaoDeId. */
export function validarRelacoesGeradas(input: {
	entidadesUsadas: string[];
	entidadesGeradas?: Array<{
		tipoRelacaoOrigem?: TipoRelacaoOrigem | null;
		revisaoDeId?: string | null;
	}>;
}): void {
	const usadas = new Set(input.entidadesUsadas);
	for (const gerada of input.entidadesGeradas ?? []) {
		if (gerada.tipoRelacaoOrigem === 'revisao') {
			if (!gerada.revisaoDeId) throw new RegraCardinalidadeError('error.revision_needs_source');
			if (!usadas.has(gerada.revisaoDeId))
				throw new RegraCardinalidadeError('error.revision_source_not_used');
		}
	}
}
