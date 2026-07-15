<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { onVisible } from '$lib/actions/on-visible';
	import { formatarData } from '$lib/format';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import RichTextEditor from '$lib/components/rich-text-editor.svelte';
	import type { RegistroProvenencia } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// untrack: seed unica na montagem — a pagina gerencia a lista via fetch (busca/scroll infinito) dai em diante.
	let itens = $state(untrack(() => data.pagina.items));
	let proximoOffset = $state(untrack(() => data.pagina.nextOffset));
	let busca = $state('');
	let carregandoMais = $state(false);
	let carregandoBusca = $state(false);

	let dialogAberto = $state(false);
	let novoTitulo = $state('');
	let novaDescricao = $state('');
	let salvando = $state(false);

	let timerBusca: ReturnType<typeof setTimeout>;

	async function buscarPagina(reiniciar: boolean) {
		const params = new URLSearchParams({ limit: '20' });
		if (busca) params.set('busca', busca);
		if (!reiniciar && proximoOffset) params.set('offset', String(proximoOffset));
		const resposta = await fetch(`/registros?${params}`);
		const pagina: { items: RegistroProvenencia[]; nextOffset: number | null } = await resposta.json();
		itens = reiniciar ? pagina.items : [...itens, ...pagina.items];
		proximoOffset = pagina.nextOffset;
	}

	function aoDigitarBusca() {
		clearTimeout(timerBusca);
		carregandoBusca = true;
		timerBusca = setTimeout(() => {
			buscarPagina(true).finally(() => (carregandoBusca = false));
		}, 300);
	}

	async function carregarMais() {
		if (!proximoOffset || carregandoMais) return;
		carregandoMais = true;
		await buscarPagina(false);
		carregandoMais = false;
	}

	async function criarRegistro(event: SubmitEvent) {
		event.preventDefault();
		if (!novoTitulo.trim()) return;
		salvando = true;
		try {
			const resposta = await fetch('/registros', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ titulo: novoTitulo, descricao: novaDescricao || null })
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({ message: 'Erro ao criar Registro.' }));
				toast.error(erro.message ?? 'Erro ao criar Registro.');
				return;
			}
			const registro: RegistroProvenencia = await resposta.json();
			itens = [registro, ...itens];
			toast.success('Registro criado.');
			dialogAberto = false;
			novoTitulo = '';
			novaDescricao = '';
		} finally {
			salvando = false;
		}
	}

	let inputImportacao: HTMLInputElement;
	let importando = $state(false);

	async function aoSelecionarArquivo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const arquivo = input.files?.[0];
		if (!arquivo) return;
		importando = true;
		try {
			const texto = await arquivo.text();
			let dados: unknown;
			try {
				dados = JSON.parse(texto);
			} catch {
				toast.error('Arquivo nao e um JSON valido.');
				return;
			}
			const resposta = await fetch('/registros/import', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(dados)
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({ message: 'Erro ao importar Registro.' }));
				toast.error(erro.message ?? 'Erro ao importar Registro.');
				return;
			}
			const detalhe: { registro: RegistroProvenencia } = await resposta.json();
			const existe = itens.some((i) => i.id === detalhe.registro.id);
			itens = existe
				? itens.map((i) => (i.id === detalhe.registro.id ? detalhe.registro : i))
				: [detalhe.registro, ...itens];
			toast.success('Registro importado.');
		} finally {
			importando = false;
			input.value = '';
		}
	}
</script>

<svelte:head><title>Registros — MyProvenance</title></svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold tracking-tight">Registros de Proveniência</h1>
		<div class="flex flex-wrap gap-2">
			<input
				bind:this={inputImportacao}
				type="file"
				accept="application/json,.json"
				class="hidden"
				onchange={aoSelecionarArquivo}
			/>
			<Button variant="outline" onclick={() => inputImportacao.click()} disabled={importando}>
				<i class="bx bx-upload"></i>
				{importando ? 'Importando…' : 'Importar'}
			</Button>
		<Dialog.Root bind:open={dialogAberto}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props}><i class="bx bx-plus"></i> Novo Registro</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-lg">
				<Dialog.Header>
					<Dialog.Title>Novo Registro de Proveniência</Dialog.Title>
					<Dialog.Description>
						Cria um Registro em rascunho — Entidades e Atividades sao adicionadas depois.
					</Dialog.Description>
				</Dialog.Header>
				<form class="flex flex-col gap-4" onsubmit={criarRegistro}>
					<div class="flex flex-col gap-1.5">
						<Label for="titulo">Titulo</Label>
						<Input
							id="titulo"
							bind:value={novoTitulo}
							required
							maxlength={300}
							placeholder="Ex.: Levantamento de especies — Trilha do Ouro"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="descricao">Descricao</Label>
						<RichTextEditor bind:value={novaDescricao} />
					</div>
					<Dialog.Footer>
						<Button type="submit" disabled={salvando || !novoTitulo.trim()}>
							{salvando ? 'Criando…' : 'Criar Registro'}
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
		</div>
	</div>

	<Input placeholder="Buscar por titulo…" bind:value={busca} oninput={aoDigitarBusca} class="max-w-sm" />

	{#if itens.length === 0 && !carregandoBusca}
		<p class="text-muted-foreground py-12 text-center text-sm">Nenhum Registro ainda. Crie o primeiro acima.</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each itens as registro (registro.id)}
			<li>
				<a
					href="/registros/{registro.id}"
					class="border-border bg-card hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors"
				>
					<div class="flex flex-col gap-0.5">
						<span class="font-medium">{registro.titulo}</span>
						<span class="text-muted-foreground text-xs">Criado em {formatarData(registro.criadoEm)}</span>
					</div>
					<Badge variant={registro.status === 'finalizado' ? 'default' : 'secondary'}>
						{registro.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
					</Badge>
				</a>
			</li>
		{/each}
	</ul>

	{#if proximoOffset !== null}
		<div use:onVisible={carregarMais} class="text-muted-foreground py-4 text-center text-xs">
			{carregandoMais ? 'Carregando…' : ''}
		</div>
	{/if}
</div>
