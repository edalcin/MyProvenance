<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { onVisible } from '$lib/actions/on-visible';
	import { formatarData } from '$lib/format';
	import { idiomaAtual, t, msgErro } from '$lib/i18n/estado.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import RichTextEditor from '$lib/components/rich-text-editor.svelte';
	import { usuarioAtual } from '$lib/client/usuario-atual.svelte';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import { importarDeArquivo } from '$lib/client/exportar-importar';
	import * as dados from '$lib/client/dados';
	import type { RegistroProvenencia } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// untrack: seed unica na montagem — autenticado vem do load do servidor, anonimo da sessao local
	// (que ja pode ter dados de navegacao anterior — o load do servidor sempre volta vazio p/ anonimo).
	let itens = $state(
		untrack(() => (usuarioAtual.valor ? data.pagina.items : sessaoAnonima.registros))
	);
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
		const pagina = await dados.listarRegistros({
			busca: busca || undefined,
			offset: !reiniciar && proximoOffset ? proximoOffset : undefined,
			limit: 20
		});
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
			const registro = await dados.criarRegistro({
				titulo: novoTitulo,
				descricao: novaDescricao || null
			});
			itens = [registro, ...itens];
			toast.success(t('success.record_created'));
			dialogAberto = false;
			novoTitulo = '';
			novaDescricao = '';
		} catch (err) {
			toast.error(msgErro(err, 'error.create_record_failed'));
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
			const validado = await importarDeArquivo(arquivo);
			const registro: RegistroProvenencia = await dados.importarRegistro(validado);
			const existe = itens.some((i) => i.id === registro.id);
			itens = existe
				? itens.map((i) => (i.id === registro.id ? registro : i))
				: [registro, ...itens];
			toast.success(t('success.record_imported'));
		} catch (err) {
			toast.error(msgErro(err, 'error.import_record_failed'));
		} finally {
			importando = false;
			input.value = '';
		}
	}
</script>

<svelte:head><title>{t('records.page_title')}</title></svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold tracking-tight">{t('records.heading')}</h1>
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
				{importando ? t('common.importing') : t('common.import')}
			</Button>
			<Dialog.Root bind:open={dialogAberto}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props}><i class="bx bx-plus"></i> {t('records.new')}</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-lg">
					<Dialog.Header>
						<Dialog.Title>{t('records.dialog.create_title')}</Dialog.Title>
						<Dialog.Description>
							{t('records.dialog.create_description')}
						</Dialog.Description>
					</Dialog.Header>
					<form class="flex flex-col gap-4" onsubmit={criarRegistro}>
						<div class="flex flex-col gap-1.5">
							<Label for="titulo">{t('common.title_label')}</Label>
							<Input
								id="titulo"
								bind:value={novoTitulo}
								required
								maxlength={300}
								placeholder={t('records.title_placeholder')}
							/>
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="descricao">{t('common.description_label')}</Label>
							<RichTextEditor bind:value={novaDescricao} />
						</div>
						<Dialog.Footer>
							<Button type="submit" disabled={salvando || !novoTitulo.trim()}>
								{salvando ? t('common.creating') : t('records.create_button')}
							</Button>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<Input
		placeholder={t('records.search_placeholder')}
		bind:value={busca}
		oninput={aoDigitarBusca}
		class="max-w-sm"
	/>

	{#if itens.length === 0 && !carregandoBusca}
		<p class="text-muted-foreground py-12 text-center text-sm">
			{t('records.empty')}
		</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each itens as registro (registro.id)}
			<li>
				<a
					href={resolve('/registros/[id]', { id: registro.id })}
					class="border-border bg-card hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors"
				>
					<div class="flex flex-col gap-0.5">
						<span class="font-medium">{registro.titulo}</span>
						<span class="text-muted-foreground text-xs"
							>{t('common.created_at', {
								data: formatarData(registro.criadoEm, idiomaAtual.valor)
							})}</span
						>
					</div>
					<Badge variant={registro.status === 'finalizado' ? 'default' : 'secondary'}>
						{t('status.' + registro.status)}
					</Badge>
				</a>
			</li>
		{/each}
	</ul>

	{#if proximoOffset !== null}
		<div use:onVisible={carregarMais} class="text-muted-foreground py-4 text-center text-xs">
			{carregandoMais ? t('common.loading') : ''}
		</div>
	{/if}
</div>
