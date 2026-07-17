<script lang="ts">
	import { untrack } from 'svelte';
	import { formatarData } from '$lib/format';
	import { gerarDiagramaMermaid } from '$lib/mermaid';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import MermaidDiagram from '$lib/components/mermaid-diagram.svelte';
	import { idiomaAtual, t } from '$lib/i18n/estado.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const registro = $derived(data.detalhe.registro);
	const entidades = $derived(data.detalhe.entidades);
	const atividades = $derived(data.detalhe.atividades);
	const agentesEnvolvidos = $derived(data.detalhe.agentesEnvolvidos);

	// Toggle e' so visual aqui — nao ha nada para persistir (link publico e' somente leitura).
	let direcaoDiagrama = $state<'LR' | 'TD'>(untrack(() => data.detalhe.registro.direcaoDiagrama));
	const diagrama = $derived(
		gerarDiagramaMermaid(
			{ entidades, atividades, agentesEnvolvidos },
			{ direcao: direcaoDiagrama, locale: idiomaAtual.valor }
		)
	);
	const nomeEntidade = $derived(new Map(entidades.map((e) => [e.id, e.nome])));
	const nomeAgente = $derived(new Map(agentesEnvolvidos.map((a) => [a.id, a.nome])));
</script>

<svelte:head><title>{registro.titulo} — MyProvenance</title></svelte:head>

<div class="flex flex-col gap-8">
	<p
		class="border-border bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border p-3 text-xs"
	>
		<i class="bx bx-share-alt"></i>
		{t('share.public_view_notice')}
	</p>

	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-semibold tracking-tight">{registro.titulo}</h1>
				<Badge variant={registro.status === 'finalizado' ? 'default' : 'secondary'}>
					{t('status.' + registro.status)}
				</Badge>
			</div>
			<p class="text-muted-foreground text-xs">
				{t('common.created_at', { data: formatarData(registro.criadoEm, idiomaAtual.valor) })}
			</p>
			{#if registro.descricao}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitizado antes de persistir (sanitizarHtmlRico, allowlist fixo — server e cliente). -->
				<div class="prose prose-sm dark:prose-invert max-w-none">{@html registro.descricao}</div>
			{/if}
		</div>
		<div class="flex shrink-0 flex-wrap gap-2">
			<Button variant="outline" href="export.json">
				<i class="bx bx-download"></i>
				{t('records.export_json')}
			</Button>
			<Button variant="outline" href="export.md">
				<i class="bx bx-file"></i>
				{t('records.export_report')}
			</Button>
		</div>
	</div>

	<section class="flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-medium">{t('records.diagram.title')}</h2>
			{#if entidades.length > 0}
				<Button
					variant="outline"
					size="sm"
					aria-label={t('diagram.layout_toggle')}
					onclick={() => (direcaoDiagrama = direcaoDiagrama === 'LR' ? 'TD' : 'LR')}
				>
					{direcaoDiagrama === 'LR' ? t('diagram.layout.horizontal') : t('diagram.layout.vertical')}
				</Button>
			{/if}
		</div>
		{#if entidades.length === 0}
			<p class="text-muted-foreground text-sm">{t('records.diagram.empty')}</p>
		{:else}
			<MermaidDiagram codigo={diagrama} />
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-medium">{t('activities.heading')}</h2>
		{#if atividades.length === 0}
			<p class="text-muted-foreground text-sm">{t('activities.empty')}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each atividades as atividade (atividade.id)}
					<li class="border-border bg-card flex flex-col gap-1 rounded-lg border p-3 text-sm">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="outline">{t('activity.type.' + atividade.tipo)}</Badge>
							<span class="text-muted-foreground text-xs"
								>{formatarData(atividade.dataHora, idiomaAtual.valor)}</span
							>
							<span class="text-muted-foreground text-xs"
								>· {nomeAgente.get(atividade.agenteId) ?? t('agents.singular')}</span
							>
						</div>
						{#if atividade.descricao}<p>{atividade.descricao}</p>{/if}
						<p class="text-muted-foreground text-xs">
							{#if atividade.entidadesUsadas.length > 0}
								{atividade.entidadesUsadas.map((id) => nomeEntidade.get(id) ?? id).join(', ')}
								<i class="bx bx-right-arrow-alt"></i>
							{/if}
							{atividade.entidadesGeradas.length > 0
								? atividade.entidadesGeradas.map((id) => nomeEntidade.get(id) ?? id).join(', ')
								: t('activities.no_output')}
						</p>
						{#if atividade.local || atividade.instrumento}
							<p class="text-muted-foreground text-xs">
								{[atividade.local, atividade.instrumento].filter(Boolean).join(' · ')}
							</p>
						{/if}
						{#if atividade.processo}
							<pre
								class="bg-muted overflow-x-auto rounded p-2 text-xs whitespace-pre-wrap">{atividade.processo}</pre>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-medium">{t('entities.heading')}</h2>
		{#if entidades.length === 0}
			<p class="text-muted-foreground text-sm">{t('entities.empty')}</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{t('report.th.name')}</Table.Head>
						<Table.Head>{t('report.th.format')}</Table.Head>
						<Table.Head>{t('report.th.location')}</Table.Head>
						<Table.Head>{t('report.th.license')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each entidades as entidade (entidade.id)}
						<Table.Row>
							<Table.Cell>{entidade.nome}</Table.Cell>
							<Table.Cell>{entidade.formato ?? '—'}</Table.Cell>
							<Table.Cell>{entidade.localizacao ?? '—'}</Table.Cell>
							<Table.Cell>{entidade.licenca ?? '—'}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-medium">{t('report.section.agents')}</h2>
		{#if agentesEnvolvidos.length === 0}
			<p class="text-muted-foreground text-sm">{t('agents.empty')}</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{t('report.th.name')}</Table.Head>
						<Table.Head>{t('report.th.type')}</Table.Head>
						<Table.Head>{t('report.th.affiliation')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each agentesEnvolvidos as agente (agente.id)}
						<Table.Row>
							<Table.Cell>{agente.nome}</Table.Cell>
							<Table.Cell>{t('agent.type.' + agente.tipo)}</Table.Cell>
							<Table.Cell>{agente.afiliacao ?? '—'}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</section>
</div>
