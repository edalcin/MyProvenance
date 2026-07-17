import type { Entidade } from './types';
import { traduzir, type Idioma } from './i18n';

/** Sufixo " (revisão de X)" / " (derivação)" para o nome de uma Entidade gerada; '' se sem relação. */
export function sufixoRelacaoOrigem(
	entidade: Entidade,
	nomePorId: (id: string) => string | undefined,
	locale: Idioma
): string {
	if (entidade.tipoRelacaoOrigem === 'revisao') {
		const nome = entidade.revisaoDeId ? (nomePorId(entidade.revisaoDeId) ?? '') : '';
		return ` (${traduzir(locale, 'relation.revision_of', { nome })})`;
	}
	if (entidade.tipoRelacaoOrigem === 'derivacao')
		return ` (${traduzir(locale, 'relation.derivation')})`;
	return '';
}
