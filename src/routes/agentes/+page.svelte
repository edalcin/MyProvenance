<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { onVisible } from '$lib/actions/on-visible';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import type { Agente, TipoAgente } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const TIPO_LABEL: Record<TipoAgente, string> = { pessoa: 'Pessoa', instituicao: 'Instituição', software: 'Software' };

	// untrack: seed unica na montagem — a pagina gerencia a lista via fetch (busca/scroll infinito) dai em diante.
	let itens = $state(untrack(() => data.pagina.items));
	let proximoOffset = $state(untrack(() => data.pagina.nextOffset));
	let busca = $state('');
	let carregandoMais = $state(false);
	let carregandoBusca = $state(false);
	let timerBusca: ReturnType<typeof setTimeout>;

	let dialogAberto = $state(false);
	let editandoId: string | null = $state(null);
	let formNome = $state('');
	let formTipo: TipoAgente = $state('pessoa');
	let formAfiliacao = $state('');
	let formIdentificador = $state('');
	let salvando = $state(false);

	async function buscarPagina(reiniciar: boolean) {
		const params = new URLSearchParams({ limit: '30' });
		if (busca) params.set('busca', busca);
		if (!reiniciar && proximoOffset) params.set('offset', String(proximoOffset));
		const resposta = await fetch(`/agentes?${params}`);
		const pagina: { items: Agente[]; nextOffset: number | null } = await resposta.json();
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

	function abrirNovo() {
		editandoId = null;
		formNome = '';
		formTipo = 'pessoa';
		formAfiliacao = '';
		formIdentificador = '';
		dialogAberto = true;
	}

	function abrirEdicao(agente: Agente) {
		editandoId = agente.id;
		formNome = agente.nome;
		formTipo = agente.tipo;
		formAfiliacao = agente.afiliacao ?? '';
		formIdentificador = agente.identificadorExterno ?? '';
		dialogAberto = true;
	}

	async function salvar(event: SubmitEvent) {
		event.preventDefault();
		if (!formNome.trim()) return;
		salvando = true;
		try {
			const corpo = {
				nome: formNome,
				tipo: formTipo,
				afiliacao: formAfiliacao || null,
				identificadorExterno: formIdentificador || null
			};
			const resposta = await fetch(editandoId ? `/agentes/${editandoId}` : '/agentes', {
				method: editandoId ? 'PATCH' : 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(corpo)
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({ message: 'Erro ao salvar Agente.' }));
				toast.error(erro.message ?? 'Erro ao salvar Agente.');
				return;
			}
			const agente: Agente = await resposta.json();
			itens = editandoId ? itens.map((item) => (item.id === agente.id ? agente : item)) : [agente, ...itens];
			toast.success(editandoId ? 'Agente atualizado.' : 'Agente criado.');
			dialogAberto = false;
		} finally {
			salvando = false;
		}
	}

	async function excluir(agente: Agente) {
		if (!confirm(`Excluir o Agente "${agente.nome}"?`)) return;
		const resposta = await fetch(`/agentes/${agente.id}`, { method: 'DELETE' });
		if (!resposta.ok) {
			const erro = await resposta.json().catch(() => ({ message: 'Erro ao excluir Agente.' }));
			toast.error(erro.message ?? 'Erro ao excluir Agente.');
			return;
		}
		itens = itens.filter((item) => item.id !== agente.id);
		toast.success('Agente excluido.');
	}
</script>

<svelte:head><title>Agentes — MyProvenance</title></svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold tracking-tight">Agentes</h1>
		<Dialog.Root bind:open={dialogAberto}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} onclick={abrirNovo}><i class="bx bx-plus"></i> Novo Agente</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>{editandoId ? 'Editar Agente' : 'Novo Agente'}</Dialog.Title>
					<Dialog.Description>Cadastro global, reutilizavel entre Registros.</Dialog.Description>
				</Dialog.Header>
				<form class="flex flex-col gap-4" onsubmit={salvar}>
					<div class="flex flex-col gap-1.5">
						<Label for="nome">Nome</Label>
						<Input id="nome" bind:value={formNome} required maxlength={200} />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="tipo">Tipo</Label>
						<Select.Root type="single" bind:value={formTipo}>
							<Select.Trigger id="tipo">{TIPO_LABEL[formTipo]}</Select.Trigger>
							<Select.Content>
								{#each Object.entries(TIPO_LABEL) as [valor, rotulo] (valor)}
									<Select.Item value={valor} label={rotulo} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="afiliacao">Afiliacao</Label>
						<Input id="afiliacao" bind:value={formAfiliacao} maxlength={300} placeholder="Ex.: UFRJ" />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="identificador">Identificador externo</Label>
						<Input id="identificador" bind:value={formIdentificador} maxlength={200} placeholder="ORCID, RRID…" />
					</div>
					<Dialog.Footer>
						<Button type="submit" disabled={salvando || !formNome.trim()}>
							{salvando ? 'Salvando…' : editandoId ? 'Salvar alteracoes' : 'Criar Agente'}
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<Input placeholder="Buscar por nome…" bind:value={busca} oninput={aoDigitarBusca} class="max-w-sm" />

	{#if itens.length === 0 && !carregandoBusca}
		<p class="text-muted-foreground py-12 text-center text-sm">Nenhum Agente cadastrado ainda.</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each itens as agente (agente.id)}
			<li class="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4">
				<div class="flex flex-col gap-0.5">
					<span class="font-medium">{agente.nome}</span>
					<span class="text-muted-foreground text-xs">
						{agente.afiliacao ?? '—'}
						{#if agente.identificadorExterno}· {agente.identificadorExterno}{/if}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline">{TIPO_LABEL[agente.tipo]}</Badge>
					<Button variant="ghost" size="icon-sm" onclick={() => abrirEdicao(agente)} aria-label="Editar Agente">
						<i class="bx bx-edit-alt"></i>
					</Button>
					<Button variant="ghost" size="icon-sm" onclick={() => excluir(agente)} aria-label="Excluir Agente">
						<i class="bx bx-trash text-destructive"></i>
					</Button>
				</div>
			</li>
		{/each}
	</ul>

	{#if proximoOffset !== null}
		<div use:onVisible={carregarMais} class="text-muted-foreground py-4 text-center text-xs">
			{carregandoMais ? 'Carregando…' : ''}
		</div>
	{/if}
</div>
