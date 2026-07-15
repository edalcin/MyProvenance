<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { formatarData } from '$lib/format';
	import { gerarDiagramaMermaid } from '$lib/mermaid';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import RichTextEditor from '$lib/components/rich-text-editor.svelte';
	import MermaidDiagram from '$lib/components/mermaid-diagram.svelte';
	import ActivityForm from '$lib/components/activity-form.svelte';
	import { usuarioAtual } from '$lib/client/usuario-atual.svelte';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import { exportarComoArquivo, exportarRelatorioComoArquivo } from '$lib/client/exportar-importar';
	import * as dados from '$lib/client/dados';
	import { TIPO_ATIVIDADE_LABEL, type Agente, type Atividade, type Entidade } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// untrack: seed unica na montagem — a pagina gerencia o grafo localmente apos criar Atividades.
	// Anonimo: data.detalhe sempre null (nao ha nada no servidor) — busca na sessao local do
	// navegador pelo id da rota. ponytail: SSR nao ve a sessao do navegador (so existe no client),
	// entao um reload direto nesta pagina anonima pode piscar "nao encontrado" ate a hidratacao
	// re-rodar com o estado real; navegacao client-side (o caminho comum, vindo da listagem) nao
	// tem esse problema. Upgrade: desligar ssr so nesta rota, se isso incomodar no uso real.
	const detalheInicial = untrack(
		() => data.detalhe ?? sessaoAnonima.obterRegistroDetalhado(page.params.id!)
	);

	let registro = $state(detalheInicial?.registro ?? null);
	let entidades = $state(detalheInicial?.entidades ?? []);
	let atividades = $state(detalheInicial?.atividades ?? []);
	let agentesEnvolvidos = $state(detalheInicial?.agentesEnvolvidos ?? []);

	onMount(() => {
		if (!detalheInicial) {
			toast.error('Registro não encontrado.');
			goto(resolve('/registros'));
		}
	});

	const diagrama = $derived(gerarDiagramaMermaid({ entidades, atividades, agentesEnvolvidos }));
	const nomeEntidade = $derived(new Map(entidades.map((e) => [e.id, e.nome])));
	const nomeAgente = $derived(new Map(agentesEnvolvidos.map((a) => [a.id, a.nome])));

	let dialogAtividadeAberto = $state(false);
	let abaAtiva = $state('criacao');
	let finalizando = $state(false);
	let atividadeEmEdicao: Atividade | null = $state(null);
	let dialogEdicaoAberto = $state(false);

	let dialogEdicaoRegistroAberto = $state(false);
	let tituloEmEdicao = $state('');
	let descricaoEmEdicao = $state('');
	let salvandoRegistro = $state(false);

	function abrirEdicaoRegistro() {
		if (!registro) return;
		tituloEmEdicao = registro.titulo;
		descricaoEmEdicao = registro.descricao ?? '';
		dialogEdicaoRegistroAberto = true;
	}

	async function salvarEdicaoRegistro(event: SubmitEvent) {
		event.preventDefault();
		if (!registro || !tituloEmEdicao.trim()) return;
		salvandoRegistro = true;
		try {
			registro = await dados.atualizarRegistro(registro.id, {
				titulo: tituloEmEdicao,
				descricao: descricaoEmEdicao || null
			});
			toast.success('Registro atualizado.');
			dialogEdicaoRegistroAberto = false;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erro ao atualizar Registro.');
		} finally {
			salvandoRegistro = false;
		}
	}

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

	function abrirEdicaoAtividade(atividade: Atividade) {
		atividadeEmEdicao = atividade;
		dialogEdicaoAberto = true;
	}

	function aoAtividadeAtualizada(resultado: {
		atividade: Atividade;
		entidadesGeradas: Entidade[];
		agente: Agente | null;
	}) {
		atividades = atividades
			.map((a) => (a.id === resultado.atividade.id ? resultado.atividade : a))
			.sort((a, b) => a.dataHora.localeCompare(b.dataHora));

		// Entidades geradas por esta Atividade podem ter sido adicionadas/editadas/removidas —
		// substitui o conjunto antigo pelo atual retornado pelo servidor/sessao.
		entidades = [
			...entidades.filter((e) => e.geradaPorAtividadeId !== resultado.atividade.id),
			...resultado.entidadesGeradas
		];

		// Recalcula Agentes envolvidos: remove os que ficaram sem nenhuma Atividade, adiciona o novo.
		const idsEmUso = new Set(atividades.map((a) => a.agenteId));
		let novosAgentes = agentesEnvolvidos.filter((a) => idsEmUso.has(a.id));
		if (resultado.agente && !novosAgentes.some((a) => a.id === resultado.agente!.id)) {
			novosAgentes = [...novosAgentes, resultado.agente];
		}
		agentesEnvolvidos = novosAgentes;

		dialogEdicaoAberto = false;
	}

	async function excluirAtividade(atividade: Atividade) {
		if (
			!confirm(
				'Excluir esta Atividade? As Entidades geradas por ela tambem serao removidas (se nao estiverem em uso por outra Atividade).'
			)
		)
			return;
		if (!registro) return;
		try {
			await dados.excluirAtividade(registro.id, atividade.id);
			atividades = atividades.filter((a) => a.id !== atividade.id);
			entidades = entidades.filter((e) => e.geradaPorAtividadeId !== atividade.id);
			const idsEmUso = new Set(atividades.map((a) => a.agenteId));
			agentesEnvolvidos = agentesEnvolvidos.filter((a) => idsEmUso.has(a.id));
			toast.success('Atividade excluida.');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erro ao excluir Atividade.');
		}
	}

	async function finalizar() {
		if (!registro) return;
		finalizando = true;
		try {
			registro = await dados.finalizarRegistro(registro.id);
			toast.success('Registro finalizado.');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erro ao finalizar Registro.');
		} finally {
			finalizando = false;
		}
	}

	async function excluirRegistro() {
		if (!registro) return;
		if (
			!confirm(
				`Excluir o Registro "${registro.titulo}"? Esta acao remove todas as Entidades e Atividades.`
			)
		)
			return;
		try {
			await dados.excluirRegistro(registro.id);
			toast.success('Registro excluido.');
			goto(resolve('/registros'));
		} catch {
			toast.error('Erro ao excluir Registro.');
		}
	}

	let exportandoJson = $state(false);

	async function exportarJson() {
		if (!registro) return;
		if (registro.status === 'rascunho') {
			const confirmado = confirm(
				'Exportar o JSON finaliza o Registro — o historico existente nao podera mais ser editado depois disso. Continuar?'
			);
			if (!confirmado) return;
		}
		exportandoJson = true;
		try {
			if (usuarioAtual.valor) {
				const idAtual = registro.id;
				const resposta = await fetch(`/registros/${idAtual}/export.json`);
				if (!resposta.ok) {
					toast.error('Erro ao exportar JSON.');
					return;
				}
				const texto = await resposta.text();
				registro = JSON.parse(texto).registro;
				const cabecalho = resposta.headers.get('content-disposition') ?? '';
				const nomeArquivo = /filename="([^"]+)"/.exec(cabecalho)?.[1] ?? `${idAtual}.json`;
				const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
				const ancora = document.createElement('a');
				ancora.href = url;
				ancora.download = nomeArquivo;
				ancora.click();
				URL.revokeObjectURL(url);
			} else {
				if (registro.status === 'rascunho') registro = sessaoAnonima.finalizarRegistro(registro.id);
				exportarComoArquivo(sessaoAnonima.obterRegistroDetalhado(registro.id)!);
			}
			toast.success('JSON exportado.');
		} finally {
			exportandoJson = false;
		}
	}

	function exportarMd() {
		if (!registro || usuarioAtual.valor) return; // autenticado usa o <a href> direto abaixo
		exportarRelatorioComoArquivo(sessaoAnonima.obterRegistroDetalhado(registro.id)!);
	}
</script>

<svelte:head><title>{registro?.titulo ?? 'Registro'} — MyProvenance</title></svelte:head>

{#if registro}
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
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitizado antes de persistir (sanitizarHtmlRico, allowlist fixo — server e cliente). -->
					<div class="prose prose-sm dark:prose-invert max-w-none">{@html registro.descricao}</div>
				{/if}
			</div>
			<div class="flex shrink-0 flex-wrap gap-2">
				<Dialog.Root bind:open={dialogEdicaoRegistroAberto}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props} onclick={abrirEdicaoRegistro}>
								<i class="bx bx-edit-alt"></i> Editar
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-lg">
						<Dialog.Header>
							<Dialog.Title>Editar Registro de Proveniência</Dialog.Title>
							<Dialog.Description>
								Titulo e descricao sao metadados do Registro — editaveis mesmo apos finalizado.
							</Dialog.Description>
						</Dialog.Header>
						<form class="flex flex-col gap-4" onsubmit={salvarEdicaoRegistro}>
							<div class="flex flex-col gap-1.5">
								<Label for="titulo-edicao">Titulo</Label>
								<Input id="titulo-edicao" bind:value={tituloEmEdicao} required maxlength={300} />
							</div>
							<div class="flex flex-col gap-1.5">
								<Label for="descricao-edicao">Descricao</Label>
								<RichTextEditor bind:value={descricaoEmEdicao} />
							</div>
							<Dialog.Footer>
								<Button type="submit" disabled={salvandoRegistro || !tituloEmEdicao.trim()}>
									{salvandoRegistro ? 'Salvando…' : 'Salvar alterações'}
								</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>
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
				{#if usuarioAtual.valor}
					<Button variant="outline" href="/registros/{registro.id}/export.md">
						<i class="bx bx-file"></i> Exportar relatório .md
					</Button>
				{:else}
					<Button variant="outline" onclick={exportarMd}>
						<i class="bx bx-file"></i> Exportar relatório .md
					</Button>
				{/if}
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
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant="outline">{TIPO_ATIVIDADE_LABEL[atividade.tipo]}</Badge>
									<span class="text-muted-foreground text-xs"
										>{formatarData(atividade.dataHora)}</span
									>
									<span class="text-muted-foreground text-xs"
										>· {nomeAgente.get(atividade.agenteId) ?? 'Agente'}</span
									>
								</div>
								{#if registro.status === 'rascunho'}
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											onclick={() => abrirEdicaoAtividade(atividade)}
											aria-label="Editar Atividade"
										>
											<i class="bx bx-edit-alt"></i>
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onclick={() => excluirAtividade(atividade)}
											aria-label="Excluir Atividade"
										>
											<i class="bx bx-trash text-destructive"></i>
										</Button>
									</div>
								{/if}
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

		{#if atividadeEmEdicao}
			{#key atividadeEmEdicao.id}
				<Dialog.Root bind:open={dialogEdicaoAberto}>
					<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-xl">
						<Dialog.Header>
							<Dialog.Title>Editar Atividade</Dialog.Title>
							<Dialog.Description>
								O tipo ({TIPO_ATIVIDADE_LABEL[atividadeEmEdicao.tipo]}) nao pode ser alterado.
							</Dialog.Description>
						</Dialog.Header>
						<ActivityForm
							tipo={atividadeEmEdicao.tipo}
							registroId={registro.id}
							entidadesDisponiveis={entidades}
							atividadeParaEditar={atividadeEmEdicao}
							agenteAtual={agentesEnvolvidos.find((a) => a.id === atividadeEmEdicao!.agenteId) ??
								null}
							onAtualizada={aoAtividadeAtualizada}
							onCancelar={() => (dialogEdicaoAberto = false)}
						/>
					</Dialog.Content>
				</Dialog.Root>
			{/key}
		{/if}

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
{/if}
