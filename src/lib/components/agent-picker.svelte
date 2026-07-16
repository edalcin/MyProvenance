<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import * as dados from '$lib/client/dados';
	import type { Agente } from '$lib/types';
	import { t, msgErro } from '$lib/i18n/estado.svelte';

	let {
		// eslint-disable-next-line no-useless-assignment -- prop $bindable: lido pelo pai via bind:value, nao localmente.
		value = $bindable(''),
		inicial = null,
		onAgente
	}: { value?: string; inicial?: Agente | null; onAgente?: (agente: Agente) => void } = $props();

	let aberto = $state(false);
	let busca = $state('');
	let resultados: Agente[] = $state([]);
	let carregando = $state(false);
	let selecionado: Agente | null = $state(untrack(() => inicial));
	let timer: ReturnType<typeof setTimeout>;

	async function pesquisar(texto: string) {
		carregando = true;
		const pagina = await dados.listarAgentes({ limit: 10, busca: texto || undefined });
		resultados = pagina.items;
		carregando = false;
	}

	$effect(() => {
		const texto = busca;
		clearTimeout(timer);
		timer = setTimeout(() => pesquisar(texto), 250);
	});

	function escolher(agente: Agente) {
		selecionado = agente;
		value = agente.id;
		aberto = false;
		onAgente?.(agente);
	}

	async function criarRapido() {
		const nome = busca.trim();
		if (!nome) return;
		try {
			const agente = await dados.criarAgente({ nome, tipo: 'pessoa' });
			escolher(agente);
		} catch (err) {
			toast.error(msgErro(err, 'error.create_agent_failed'));
		}
	}
</script>

<Popover.Root bind:open={aberto}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} type="button" variant="outline" class="w-full justify-start font-normal">
				<i class="bx bx-user"></i>
				{selecionado?.nome ?? t('agents.picker_placeholder')}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0">
		<Command.Root shouldFilter={false}>
			<Command.Input placeholder={t('agents.picker_search_placeholder')} bind:value={busca} />
			<Command.List>
				{#if !carregando && resultados.length === 0}
					<Command.Empty>
						<div class="flex flex-col items-center gap-2 py-2">
							<span>{t('agents.picker_empty')}</span>
							{#if busca.trim()}
								<Button type="button" size="sm" variant="secondary" onclick={criarRapido}>
									<i class="bx bx-plus"></i>
									{t('agents.picker_create', { nome: busca.trim() })}
								</Button>
							{/if}
						</div>
					</Command.Empty>
				{/if}
				{#each resultados as agente (agente.id)}
					<Command.Item onSelect={() => escolher(agente)}>
						{agente.nome}
						<span class="text-muted-foreground ml-auto text-xs"
							>{t('agent.type.' + agente.tipo)}</span
						>
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
