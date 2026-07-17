import sobrePt from './sobre.pt.md?raw';
import sobreEn from './sobre.en.md?raw';
import type { Idioma } from '$lib/i18n';

const paginas = {
	sobre: { pt: sobrePt, en: sobreEn }
} as const;

/** Conteudo editavel da pagina estatica Sobre — arquivos .md em src/lib/content/. */
export function obterConteudoMarkdown(pagina: keyof typeof paginas, idioma: Idioma): string {
	return paginas[pagina][idioma];
}

/** Manual do usuario (multi-pagina, bilingue) — arquivos .md editaveis em manual/{pt,en}/ na raiz do repo. */
const arquivosManual = import.meta.glob('/manual/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export interface PaginaManual {
	slug: string;
	titulo: Record<Idioma, string>;
}

// Ordem canonica (indice + prev/proximo). README e o indice e NAO entra aqui.
export const PAGINAS_MANUAL: PaginaManual[] = [
	{ slug: '00-introducao', titulo: { pt: 'Introdução', en: 'Introduction' } },
	{ slug: '01-criar-registro', titulo: { pt: 'Criar registro', en: 'Create a record' } },
	{
		slug: '02-adicionar-atividade',
		titulo: { pt: 'Adicionar Atividade', en: 'Add an Activity' }
	},
	{
		slug: '03-editar',
		titulo: { pt: 'Editar Registro e Atividade', en: 'Edit Record and Activity' }
	},
	{ slug: '04-finalizar', titulo: { pt: 'Finalizar', en: 'Finalize' } },
	{ slug: '05-exportar-json', titulo: { pt: 'Exportar JSON', en: 'Export JSON' } },
	{
		slug: '06-exportar-relatorio-md',
		titulo: { pt: 'Exportar Relatório .md', en: 'Export .md report' }
	},
	{ slug: '07-compartilhar', titulo: { pt: 'Compartilhar', en: 'Share' } },
	{ slug: '08-excluir-registro', titulo: { pt: 'Excluir registro', en: 'Delete a record' } },
	{ slug: '09-exemplo-completo', titulo: { pt: 'Exemplo completo', en: 'Full example' } }
];

export function obterPaginaManual(idioma: Idioma, slug: string): string | null {
	return arquivosManual[`/manual/${idioma}/${slug}.md`] ?? null;
}

export function obterIndiceManual(idioma: Idioma): string {
	return arquivosManual[`/manual/${idioma}/README.md`] ?? '';
}
