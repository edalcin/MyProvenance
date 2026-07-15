/**
 * Export/import 100% locais (ADR-0009) — sem round-trip de rede. Mesmo formato JSON
 * (docs/especificacao.md §4) e relatorio .md usados pela conta autenticada, gerados/
 * validados pelos mesmos modulos puros ($lib/export, $lib/report, Zod).
 */
import { SCHEMA_VERSION, type RegistroDetalhado } from '$lib/types';
import { gerarJsonExportado } from '$lib/export';
import { gerarRelatorioMarkdown } from '$lib/report';
import { registroExportadoSchema, type RegistroExportadoValidado } from '$lib/schemas';
import { slugify } from '$lib/slug';

function baixarArquivo(conteudo: string, tipo: string, nomeArquivo: string): void {
	const blob = new Blob([conteudo], { type: tipo });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = nomeArquivo;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

/** Dispara o download do JSON como arquivo — Blob + link sintetico, sem servidor. */
export function exportarComoArquivo(detalhe: RegistroDetalhado): void {
	const corpo = JSON.stringify(gerarJsonExportado(detalhe), null, 2);
	baixarArquivo(corpo, 'application/json', `${slugify(detalhe.registro.titulo)}-provenance.json`);
}

/** Dispara o download do relatorio .md — mesmo gerador usado pela conta autenticada. */
export function exportarRelatorioComoArquivo(detalhe: RegistroDetalhado): void {
	const conteudo = gerarRelatorioMarkdown(detalhe, new Date().toISOString());
	baixarArquivo(conteudo, 'text/markdown', `${slugify(detalhe.registro.titulo)}-provenance.md`);
}

export class ArquivoInvalidoError extends Error {}

/** Le e valida um arquivo JSON exportado — mesmo schema usado no upload autenticado (ADR-0004). */
export async function importarDeArquivo(file: File): Promise<RegistroExportadoValidado> {
	const texto = await file.text();
	let bruto: unknown;
	try {
		bruto = JSON.parse(texto);
	} catch {
		throw new ArquivoInvalidoError('Arquivo nao e um JSON valido.');
	}
	const resultado = registroExportadoSchema.safeParse(bruto);
	if (!resultado.success) {
		throw new ArquivoInvalidoError(
			resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
		);
	}
	if (resultado.data.schemaVersion < 1 || resultado.data.schemaVersion > SCHEMA_VERSION) {
		throw new ArquivoInvalidoError(
			`schemaVersion ${resultado.data.schemaVersion} nao suportado (maximo ${SCHEMA_VERSION}).`
		);
	}
	return resultado.data;
}
