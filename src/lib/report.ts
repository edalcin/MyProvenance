import { gerarDiagramaMermaid } from '$lib/mermaid';
import { formatarData, formatarDataSemHora } from '$lib/format';
import { traduzir, type Idioma } from '$lib/i18n';
import { sufixoRelacaoOrigem } from '$lib/relacao';
import type { RegistroDetalhado } from './types';

function escaparCelula(texto: string): string {
	return texto.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}

/** Relatorio .md — cabecalho, diagrama, Entidades, linha do tempo, Agentes — docs/especificacao.md §6. */
export function gerarRelatorioMarkdown(
	detalhe: RegistroDetalhado,
	exportadoEm: string,
	locale: Idioma = 'pt'
): string {
	const { registro, entidades, atividades, agentesEnvolvidos } = detalhe;
	const nomeEntidade = new Map(entidades.map((e) => [e.id, e.nome]));
	const entidadePorId = new Map(entidades.map((e) => [e.id, e]));
	const nomeAgente = new Map(agentesEnvolvidos.map((a) => [a.id, a.nome]));
	const t = (chave: string) => traduzir(locale, chave);

	const linhas: string[] = [];

	linhas.push(`# ${registro.titulo}`, '');
	if (registro.descricao) linhas.push(registro.descricao, '');
	linhas.push(`**${t('report.status_label')}:** ${t('status.' + registro.status)}`);
	linhas.push(`**${t('report.exported_at')}:** ${formatarData(exportadoEm, locale)}`, '');

	linhas.push(
		`## ${t('report.section.diagram')}`,
		'',
		'```mermaid',
		gerarDiagramaMermaid(
			{ entidades, atividades, agentesEnvolvidos },
			{ direcao: registro.direcaoDiagrama, locale }
		),
		'```',
		''
	);

	linhas.push(`## ${t('report.section.entities')}`, '');
	if (entidades.length === 0) {
		linhas.push(t('report.empty.entities'), '');
	} else {
		linhas.push(`| ${t('report.th.name')} | ${t('common.description_label')} |`, '|---|---|');
		for (const e of entidades) {
			const sufixo = sufixoRelacaoOrigem(e, (id) => nomeEntidade.get(id), locale);
			linhas.push(
				`| ${escaparCelula(e.nome + sufixo)} | ${e.descricao ? escaparCelula(e.descricao) : '—'} |`
			);
		}
		linhas.push('');
	}

	linhas.push(`## ${t('report.section.timeline')}`, '');
	if (atividades.length === 0) {
		linhas.push(t('report.empty.activities'), '');
	} else {
		linhas.push(
			`| ${t('report.th.type')} | ${t('report.th.date')} | ${t('report.th.agent')} | ${t('report.th.flow')} | ${t('report.th.details')} |`,
			'|---|---|---|---|---|'
		);
		for (const a of atividades) {
			const usadas = a.entidadesUsadas.map((id) => nomeEntidade.get(id) ?? id).join(', ');
			const geradas = a.entidadesGeradas.length
				? a.entidadesGeradas
						.map((id) => {
							const e = entidadePorId.get(id);
							const nome = nomeEntidade.get(id) ?? id;
							return e ? nome + sufixoRelacaoOrigem(e, (x) => nomeEntidade.get(x), locale) : nome;
						})
						.join(', ')
				: t('report.no_output');
			const fluxo = usadas ? `${usadas} → ${geradas}` : geradas;

			const detalhesPartes: string[] = [];
			if (a.descricao) detalhesPartes.push(a.descricao);
			if (a.local) detalhesPartes.push(`${t('report.detail.location')}: ${a.local}`);
			if (a.instrumento) detalhesPartes.push(`${t('report.detail.tool')}: ${a.instrumento}`);
			if (a.processo) detalhesPartes.push(`${t('report.detail.process')}: ${a.processo}`);
			if (a.parametros?.length) {
				detalhesPartes.push(
					`${t('report.detail.params')}: ${a.parametros.map((p) => `${p.chave}=${p.valor}`).join(', ')}`
				);
			}
			if (a.ambienteExecucao?.sistemaOperacional) {
				detalhesPartes.push(`${t('report.detail.os')}: ${a.ambienteExecucao.sistemaOperacional}`);
			}
			if (a.ambienteExecucao?.pacotes?.length) {
				detalhesPartes.push(
					`${t('report.detail.packages')}: ${a.ambienteExecucao.pacotes.map((p) => `${p.nome}@${p.versao}`).join(', ')}`
				);
			}

			linhas.push(
				`| ${t('activity.type.' + a.tipo)} | ${formatarDataSemHora(a.dataHora, locale)} | ${nomeAgente.get(a.agenteId) ?? '—'} | ${escaparCelula(fluxo)} | ${escaparCelula(detalhesPartes.join('; ') || '—')} |`
			);
		}
		linhas.push('');
	}

	linhas.push(`## ${t('report.section.agents')}`, '');
	if (agentesEnvolvidos.length === 0) {
		linhas.push(t('report.empty.agents'), '');
	} else {
		linhas.push(
			`| ${t('report.th.name')} | ${t('report.th.type')} | ${t('report.th.affiliation')} |`,
			'|---|---|---|'
		);
		for (const ag of agentesEnvolvidos) {
			linhas.push(
				`| ${escaparCelula(ag.nome)} | ${t('agent.type.' + ag.tipo)} | ${ag.afiliacao ?? '—'} |`
			);
		}
		linhas.push('');
	}

	return linhas.join('\n');
}
