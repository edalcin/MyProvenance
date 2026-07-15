<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { formatarData } from '$lib/format';
	import { gerarDiagramaMermaid } from '$lib/mermaid';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import MermaidDiagram from '$lib/components/mermaid-diagram.svelte';
	import ActivityForm from '$lib/components/activity-form.svelte';
	import { TIPO_ATIVIDADE_LABEL, type Agente, type Atividade, type Entidade } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// untrack: seed unica na montagem — a pagina gerencia o grafo localmente apos criar Atividades.
	let registro = $state(untrack(() => data.detalhe.registro));
	let entidades = $state(untrack(() => data.detalhe.entidades));
	let atividades = $state(untrack(() => data.detalhe.atividades));
	let agentesEnvolvidos = $state(untrack(() => data.detalhe.agentesEnvolvidos));

	const diagrama = $derived(gerarDiagramaMermaid({ entidades, atividades, agentesEnvolvidos }));
	const nomeEntidade = $derived(new Map(entidades.map((e) => [e.id, e.nome])));
	const nomeAgente = $derived(new Map(agentesEnvolvidos.map((a) => [a.id, a.nome])));

	let dialogAtividadeAberto = $state(false);
	let abaAtiva = $state('criacao');
	let finalizando = $state(false);

	function aoAtividadeCriada(resultado: {
		atividade: Atividade;
		entidadesGeradas: Entidade[];
		agente: Agente | null;
	}) {
		atividades = [...atividades, resultado.atividade].sort((a, b) =>
			a.dataHora.localeCompare(b.dataHora)
		);
		if (resultado.entidadesGeradas.length)
			entidades = [...entidades, ...resultado.entidadesGeradas];
		if (resultado.agente && !agentesEnvolvidos.some((a) => a.id === resultado.agente!.id)) {
			agentesEnvolvidos = [...agentesEnvolvidos, resultado.agente];
		}
		dialogAtividadeAberto = false;
	}

	async function finalizar() {
		finalizando = true;
		try {
			const resposta = await fetch(`/registros/${registro.id}/finalizar`, { method: 'POST' });
			if (!resposta.ok) {
				const erro = await resposta
					.json()
					.catch(() => ({ message: 'Erro ao finalizar Registro.' }));
				toast.error(erro.message ?? 'Erro ao finalizar Registro.');
				return;
			}
			registro = await resposta.json();
			toast.success('Registro finalizado.');
		} finally {
			finalizando = false;
		}
	}

	async function excluirRegistro() {
		if (
			!confirm(
				`Excluir o Registro "${registro.titulo}"? Esta acao remove todas as Entidades e Atividades.`
			)
		)
			return;
		const resposta = await fetch(`/registros/${registro.id}`, { method: 'DELETE' });
		if (!resposta.ok) {
			toast.error('Erro ao excluir Registro.');
			return;
		}
		toast.success('Registro excluido.');
		goto(resolve('/registros'));
	}

	let exportandoJson = $state(false);

	async function exportarJson() {
		if (registro.status === 'rascunho') {
			const confirmado = confirm(
				'Exportar o JSON finaliza o Registro — o historico existente nao podera mais ser editado depois disso. Continuar?'
			);
			if (!confirmado) return;
		}
		exportandoJson = true;
		try {
			const resposta = await fetch(`/registros/${registro.id}/export.json`);
			if (!resposta.ok) {
				toast.error('Erro ao exportar JSON.');
				return;
			}
			const texto = await resposta.text();
			registro = JSON.parse(texto).registro;
			const cabecalho = resposta.headers.get('content-disposition') ?? '';
			const nomeArquivo = /filename="([^"]+)"/.exec(cabecalho)?.[1] ?? `${registro.id}.json`;
			const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
			const ancora = document.createElement('a');
			ancora.href = url;
			ancora.download = nomeArquivo;
			ancora.click();
			URL.revokeObjectURL(url);
			toast.success('JSON exportado.');
		} finally {
			exportandoJson = false;
		}
	}
</script>

<svelte:head><title>{registro.titulo} — MyProvenance</title></svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-semibold tracking-tight">{registro.titulo}</h1>
				<Badge variant={registro.status === 'finalizado' ? 'default' : 'secondary'}>
					{registro.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
				</Badge>
			</div>
			<p class="text-muted-foreground text-xs">Criado em {formatarData(registro.criadoEm)}</p>
			{#if registro.descricao}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitizado no servidor (sanitizarHtmlRico, allowlist fixo) antes de persistir. -->
				<div class="prose prose-sm dark:prose-invert max-w-none">{@html registro.descricao}</div>
			{/if}
		</div>
		<div class="flex shrink-0 flex-wrap gap-2">
			{#if registro.status === 'rascunho'}
				<Button variant="outline" onclick={finalizar} disabled={finalizando}>
					<i class="bx bx-check-circle"></i>
					{finalizando ? 'Finalizando…' : 'Finalizar'}
				</Button>
			{/if}
			<Button variant="outline" onclick={exportarJson} disabled={exportandoJson}>
				<i class="bx bx-download"></i>
				{exportandoJson ? 'Exportando…' : 'Exportar JSON'}
			</Button>
			<Button variant="outline" href="/registros/{registro.id}/export.md">
				<i class="bx bx-file"></i> Exportar relatório .md
			</Button>
			<Button variant="destructive" onclick={excluirRegistro}>
				<i class="bx bx-trash"></i> Excluir Registro
			</Button>
		</div>
	</div>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-medium">Diagrama de proveniência</h2>
		{#if entidades.length === 0}
			<p class="text-muted-foreground text-sm">
				Adicione a primeira Atividade (Criação) para iniciar a linhagem.
			</p>
		{:else}
			<MermaidDiagram codigo={diagrama} />
		{/if}
	</section>

	<section class="flex flex-col gap-3">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-medium">Atividades</h2>
			<Dialog.Root bind:open={dialogAtividadeAberto}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props}><i class="bx bx-plus"></i> Adicionar Atividade</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-xl">
					<Dialog.Header>
						<Dialog.Title>Adicionar Atividade</Dialog.Title>
						<Dialog.Description>
							Criação gera 1 Entidade nova. Transformação usa 1+ e gera 1. Análise usa 1+ e gera 0
							ou 1.
						</Dialog.Description>
					</Dialog.Header>
					<Tabs.Root bind:value={abaAtiva}>
						<Tabs.List class="grid w-full grid-cols-3">
							<Tabs.Trigger value="criacao">Criação</Tabs.Trigger>
							<Tabs.Trigger value="transformacao">Transformação</Tabs.Trigger>
							<Tabs.Trigger value="analise">Análise</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="criacao">
							<ActivityForm
								tipo="criacao"
								registroId={registro.id}
								entidadesDisponiveis={entidades}
								onCriada={aoAtividadeCriada}
							/>
						</Tabs.Content>
						<Tabs.Content value="transformacao">
							<ActivityForm
								tipo="transformacao"
								registroId={registro.id}
								entidadesDisponiveis={entidades}
								onCriada={aoAtividadeCriada}
							/>
						</Tabs.Content>
						<Tabs.Content value="analise">
							<ActivityForm
								tipo="analise"
								registroId={registro.id}
								entidadesDisponiveis={entidades}
								onCriada={aoAtividadeCriada}
							/>
						</Tabs.Content>
					</Tabs.Root>
				</Dialog.Content>
			</Dialog.Root>
		</div>

		{#if atividades.length === 0}
			<p class="text-muted-foreground text-sm">Nenhuma Atividade ainda.</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each atividades as atividade (atividade.id)}
					<li class="border-border bg-card flex flex-col gap-1 rounded-lg border p-3 text-sm">
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="outline">{TIPO_ATIVIDADE_LABEL[atividade.tipo]}</Badge>
							<span class="text-muted-foreground text-xs">{formatarData(atividade.dataHora)}</span>
							<span class="text-muted-foreground text-xs"
								>· {nomeAgente.get(atividade.agenteId) ?? 'Agente'}</span
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
								: '(sem Entidade gerada)'}
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
		<h2 class="text-lg font-medium">Entidades</h2>
		{#if entidades.length === 0}
			<p class="text-muted-foreground text-sm">Nenhuma Entidade ainda.</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Nome</Table.Head>
						<Table.Head>Formato</Table.Head>
						<Table.Head>Localização</Table.Head>
						<Table.Head>Licença</Table.Head>
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
		<h2 class="text-lg font-medium">Agentes envolvidos</h2>
		{#if agentesEnvolvidos.length === 0}
			<p class="text-muted-foreground text-sm">Nenhum Agente ainda.</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Nome</Table.Head>
						<Table.Head>Tipo</Table.Head>
						<Table.Head>Afiliação</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each agentesEnvolvidos as agente (agente.id)}
						<Table.Row>
							<Table.Cell>{agente.nome}</Table.Cell>
							<Table.Cell class="capitalize">{agente.tipo}</Table.Cell>
							<Table.Cell>{agente.afiliacao ?? '—'}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</section>
</div>
