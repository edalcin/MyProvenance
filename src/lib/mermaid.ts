import type { Agente, Atividade, Entidade } from './types';
import { traduzir, type Idioma } from './i18n';

/** Diagrama Mermaid a partir do grafo de um Registro — regras em docs/especificacao.md §5. */

function escapar(texto: string): string {
	return texto.replace(/"/g, "'").replace(/[\r\n]+/g, ' ');
}

export function gerarDiagramaMermaid(
	dados: { entidades: Entidade[]; atividades: Atividade[]; agentesEnvolvidos: Agente[] },
	opts: { direcao?: 'LR' | 'TD'; locale?: Idioma } = {}
): string {
	const { direcao = 'LR', locale = 'pt' } = opts;
	const nomeAgente = new Map(dados.agentesEnvolvidos.map((a) => [a.id, a.nome]));
	const idDoNo = new Map(dados.entidades.map((e, i) => [e.id, `E${i + 1}`]));

	const linhas: string[] = [`flowchart ${direcao}`];

	for (const entidade of dados.entidades) {
		const rotulo = entidade.formato ? `${entidade.nome} (${entidade.formato})` : entidade.nome;
		linhas.push(`  ${idDoNo.get(entidade.id)}["${escapar(rotulo)}"]`);
	}

	for (const atividade of dados.atividades) {
		// Analise sem saida nao gera no novo, nao aparece no diagrama (so na tabela de Atividades do relatorio).
		if (atividade.entidadesGeradas.length === 0) continue;
		// Criacao (sem entrada) e no sem seta de entrada — raiz da lineage.
		if (atividade.entidadesUsadas.length === 0) continue;

		const agente = nomeAgente.get(atividade.agenteId) ?? traduzir(locale, 'agents.singular');
		const data = atividade.dataHora.slice(0, 10);
		const resumo = atividade.descricao ? `: ${escapar(atividade.descricao)}` : '';
		const tipoLabel = traduzir(locale, `activity.type.${atividade.tipo}`);
		const rotulo = `${tipoLabel}${resumo} (${escapar(agente)}, ${data})`;

		for (const geradaId of atividade.entidadesGeradas) {
			const destino = idDoNo.get(geradaId);
			if (!destino) continue;
			for (const usadaId of atividade.entidadesUsadas) {
				const origem = idDoNo.get(usadaId);
				if (!origem) continue;
				linhas.push(`  ${origem} -->|"${rotulo}"| ${destino}`);
			}
		}
	}

	return linhas.join('\n');
}
