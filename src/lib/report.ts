import { gerarDiagramaMermaid } from '$lib/mermaid';
import { formatarData } from '$lib/format';
import { TIPO_ATIVIDADE_LABEL } from '$lib/types';
import type { RegistroDetalhado } from './types';

function escaparCelula(texto: string): string {
	return texto.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}

/** Relatorio .md — cabecalho, diagrama, Entidades, linha do tempo, Agentes — docs/especificacao.md §6. */
export function gerarRelatorioMarkdown(detalhe: RegistroDetalhado, exportadoEm: string): string {
	const { registro, entidades, atividades, agentesEnvolvidos } = detalhe;
	const nomeEntidade = new Map(entidades.map((e) => [e.id, e.nome]));
	const nomeAgente = new Map(agentesEnvolvidos.map((a) => [a.id, a.nome]));

	const linhas: string[] = [];

	linhas.push(`# ${registro.titulo}`, '');
	if (registro.descricao) linhas.push(registro.descricao, '');
	linhas.push(`**Status:** ${registro.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}`);
	linhas.push(`**Exportado em:** ${formatarData(exportadoEm)}`, '');

	linhas.push(
		'## Diagrama',
		'',
		'```mermaid',
		gerarDiagramaMermaid({ entidades, atividades, agentesEnvolvidos }),
		'```',
		''
	);

	linhas.push('## Entidades', '');
	if (entidades.length === 0) {
		linhas.push('_Nenhuma Entidade._', '');
	} else {
		linhas.push('| Nome | Formato | Localização | Licença |', '|---|---|---|---|');
		for (const e of entidades) {
			linhas.push(
				`| ${escaparCelula(e.nome)} | ${e.formato ?? '—'} | ${e.localizacao ?? '—'} | ${e.licenca ?? '—'} |`
			);
		}
		linhas.push('');
	}

	linhas.push('## Linha do tempo de Atividades', '');
	if (atividades.length === 0) {
		linhas.push('_Nenhuma Atividade._', '');
	} else {
		linhas.push(
			'| Tipo | Data/hora | Agente | Entidades usadas → Entidades geradas | Detalhes |',
			'|---|---|---|---|---|'
		);
		for (const a of atividades) {
			const usadas = a.entidadesUsadas.map((id) => nomeEntidade.get(id) ?? id).join(', ');
			const geradas = a.entidadesGeradas.length
				? a.entidadesGeradas.map((id) => nomeEntidade.get(id) ?? id).join(', ')
				: '(sem saída)';
			const fluxo = usadas ? `${usadas} → ${geradas}` : geradas;

			const detalhesPartes: string[] = [];
			if (a.descricao) detalhesPartes.push(a.descricao);
			if (a.local) detalhesPartes.push(`Local: ${a.local}`);
			if (a.instrumento) detalhesPartes.push(`Ferramenta ou Software: ${a.instrumento}`);
			if (a.processo) detalhesPartes.push(`Processo: ${a.processo}`);
			if (a.parametros?.length) {
				detalhesPartes.push(
					`Parâmetros: ${a.parametros.map((p) => `${p.chave}=${p.valor}`).join(', ')}`
				);
			}
			if (a.ambienteExecucao?.sistemaOperacional)
				detalhesPartes.push(`SO: ${a.ambienteExecucao.sistemaOperacional}`);
			if (a.ambienteExecucao?.pacotes?.length) {
				detalhesPartes.push(
					`Pacotes: ${a.ambienteExecucao.pacotes.map((p) => `${p.nome}@${p.versao}`).join(', ')}`
				);
			}

			linhas.push(
				`| ${TIPO_ATIVIDADE_LABEL[a.tipo]} | ${formatarData(a.dataHora)} | ${nomeAgente.get(a.agenteId) ?? '—'} | ${escaparCelula(fluxo)} | ${escaparCelula(detalhesPartes.join('; ') || '—')} |`
			);
		}
		linhas.push('');
	}

	linhas.push('## Agentes envolvidos', '');
	if (agentesEnvolvidos.length === 0) {
		linhas.push('_Nenhum Agente._', '');
	} else {
		linhas.push('| Nome | Tipo | Afiliação |', '|---|---|---|');
		for (const ag of agentesEnvolvidos) {
			linhas.push(`| ${escaparCelula(ag.nome)} | ${ag.tipo} | ${ag.afiliacao ?? '—'} |`);
		}
		linhas.push('');
	}

	return linhas.join('\n');
}
