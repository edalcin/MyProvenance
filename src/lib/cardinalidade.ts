/**
 * Regra de cardinalidade de Atividade — pura, sem dependencia de DB. Roda tanto no
 * repository do servidor quanto na sessao anonima do cliente (ADR-0009), garantindo
 * a mesma validacao nos dois modos.
 *
 * CONTEXT.md: Criacao usa 0 gera 1+, Transformacao usa 1+ gera 1+, Analise usa 1+ gera 0+.
 */
import type { TipoAtividade } from './types';

export class RegraCardinalidadeError extends Error {}

export function validarCardinalidade(input: {
	tipo: TipoAtividade;
	entidadesUsadas: string[];
	entidadesGeradas?: unknown[];
}): void {
	const usadas = input.entidadesUsadas.length;
	const geradas = input.entidadesGeradas?.length ?? 0;
	if (input.tipo === 'criacao') {
		if (usadas !== 0) throw new RegraCardinalidadeError('Criacao nao usa Entidades existentes.');
		if (geradas < 1) throw new RegraCardinalidadeError('Criacao deve gerar 1 ou mais Entidades.');
	} else if (input.tipo === 'transformacao') {
		if (usadas < 1) throw new RegraCardinalidadeError('Transformacao usa 1 ou mais Entidades.');
		if (geradas < 1) {
			throw new RegraCardinalidadeError('Transformacao deve gerar 1 ou mais Entidades.');
		}
	} else if (usadas < 1) {
		throw new RegraCardinalidadeError('Analise usa 1 ou mais Entidades.');
	}
}
