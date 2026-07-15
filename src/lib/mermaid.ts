import type { Agente, Atividade, Entidade, TipoAtividade } from './types';

/** Diagrama Mermaid a partir do grafo de um Registro — regras em docs/especificacao.md §5. */

const TIPO_LABEL: Record<TipoAtividade, string> = {
	criacao: 'Criação',
	transformacao: 'Transformação',
	analise: 'Análise'
};

function escapar(texto: string): string {
	return texto.replace(/"/g, "'").replace(/[\r\n]+/g, ' ');
}

export function gerarDiagramaMermaid(dados: {
	entidades: Entidade[];
	atividades: Atividade[];
	agentesEnvolvidos: Agente[];
}): string {
	const nomeAgente = new Map(dados.agentesEnvolvidos.map((a) => [a.id, a.nome]));
	const idDoNo = new Map(dados.entidades.map((e, i) => [e.id, `E${i + 1}`]));

	const linhas: string[] = ['flowchart LR'];

	for (const entidade of dados.entidades) {
		const rotulo = entidade.formato ? `${entidade.nome} (${entidade.formato})` : entidade.nome;
		linhas.push(`  ${idDoNo.get(entidade.id)}["${escapar(rotulo)}"]`);
	}

	for (const atividade of dados.atividades) {
		// Analise sem saida nao gera no novo, nao aparece no diagrama (so na tabela de Atividades do relatorio).
		if (!atividade.entidadeGeradaId) continue;
		const destino = idDoNo.get(atividade.entidadeGeradaId);
		if (!destino) continue;
		// Criacao (sem entrada) e no sem seta de entrada — raiz da lineage.
		if (atividade.entidadesUsadas.length === 0) continue;

		const agente = nomeAgente.get(atividade.agenteId) ?? 'Agente';
		const data = atividade.dataHora.slice(0, 10);
		const resumo = atividade.descricao ? `: ${escapar(atividade.descricao)}` : '';
		const rotulo = `${TIPO_LABEL[atividade.tipo]}${resumo} (${escapar(agente)}, ${data})`;

		for (const usadaId of atividade.entidadesUsadas) {
			const origem = idDoNo.get(usadaId);
			if (!origem) continue;
			linhas.push(`  ${origem} -->|"${rotulo}"| ${destino}`);
		}
	}

	return linhas.join('\n');
}
