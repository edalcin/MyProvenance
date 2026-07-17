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
	import { sufixoRelacaoOrigem } from '$lib/relacao';
	import type { Agente, Atividade, Entidade } from '$lib/types';
	import { idiomaAtual, t, msgErro } from '$lib/i18n/estado.svelte';
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
			toast.error(t('error.record_not_found'));
			goto(resolve('/registros'));
		}
	});

	let direcaoDiagrama = $state<'LR' | 'TD'>(detalheInicial?.registro.direcaoDiagrama ?? 'LR');
	const diagrama = $derived(
		gerarDiagramaMermaid(
			{ entidades, atividades, agentesEnvolvidos },
			{ direcao: direcaoDiagrama, locale: idiomaAtual.valor }
		)
	);
	const nomeEntidade = $derived(new Map(entidades.map((e) => [e.id, e.nome])));
	const entidadePorId = $derived(new Map(entidades.map((e) => [e.id, e])));
	const nomeAgente = $derived(new Map(agentesEnvolvidos.map((a) => [a.id, a.nome])));

	async function alternarDirecaoDiagrama() {
		if (!registro) return;
		const anterior = direcaoDiagrama;
		const nova = anterior === 'LR' ? 'TD' : 'LR';
		direcaoDiagrama = nova; // resposta visual imediata
		try {
			registro = await dados.alterarDirecaoDiagrama(registro.id, nova);
		} catch (err) {
			direcaoDiagrama = anterior;
			toast.error(msgErro(err, 'error.update_record_failed'));
		}
	}

	let dialogCompartilharAberto = $state(false);
	let compartilhando = $state(false);
	const urlPublica = $derived(
		registro?.tokenCompartilhamento
			? `${data.urlBase}${resolve('/compartilhar/[token]', { token: registro.tokenCompartilhamento })}`
			: ''
	);

	async function ativarCompartilhamento() {
		if (!registro) return;
		compartilhando = true;
		try {
			registro = await dados.ativarCompartilhamento(registro.id);
		} catch (err) {
			toast.error(msgErro(err, 'error.update_record_failed'));
		} finally {
			compartilhando = false;
		}
	}

	async function desativarCompartilhamento() {
		if (!registro) return;
		compartilhando = true;
		try {
			registro = await dados.desativarCompartilhamento(registro.id);
			toast.success(t('share.deactivated'));
		} catch (err) {
			toast.error(msgErro(err, 'error.update_record_failed'));
		} finally {
			compartilhando = false;
		}
	}

	function copiarUrlPublica() {
		navigator.clipboard.writeText(urlPublica);
		toast.success(t('share.copied'));
	}

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
			toast.success(t('success.record_updated'));
			dialogEdicaoRegistroAberto = false;
		} catch (err) {
			toast.error(msgErro(err, 'error.update_record_failed'));
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
		if (!confirm(t('confirm.delete_activity'))) return;
		if (!registro) return;
		try {
			await dados.excluirAtividade(registro.id, atividade.id);
			atividades = atividades.filter((a) => a.id !== atividade.id);
			entidades = entidades.filter((e) => e.geradaPorAtividadeId !== atividade.id);
			const idsEmUso = new Set(atividades.map((a) => a.agenteId));
			agentesEnvolvidos = agentesEnvolvidos.filter((a) => idsEmUso.has(a.id));
			toast.success(t('success.activity_deleted'));
		} catch (err) {
			toast.error(msgErro(err, 'error.delete_activity_failed'));
		}
	}

	async function finalizar() {
		if (!registro) return;
		finalizando = true;
		try {
			registro = await dados.finalizarRegistro(registro.id);
			toast.success(t('success.record_finalized'));
		} catch (err) {
			toast.error(msgErro(err, 'error.finalize_record_failed'));
		} finally {
			finalizando = false;
		}
	}

	async function excluirRegistro() {
		if (!registro) return;
		if (!confirm(t('confirm.delete_record', { titulo: registro.titulo }))) return;
		try {
			await dados.excluirRegistro(registro.id);
			toast.success(t('success.record_deleted'));
			goto(resolve('/registros'));
		} catch {
			toast.error(t('error.delete_record_failed'));
		}
	}

	let exportandoJson = $state(false);

	async function exportarJson() {
		if (!registro) return;
		exportandoJson = true;
		try {
			if (usuarioAtual.valor) {
				const idAtual = registro.id;
				const resposta = await fetch(`/registros/${idAtual}/export.json`);
				if (!resposta.ok) {
					toast.error(t('error.export_json_failed'));
					return;
				}
				const texto = await resposta.text();
				const cabecalho = resposta.headers.get('content-disposition') ?? '';
				const nomeArquivo = /filename="([^"]+)"/.exec(cabecalho)?.[1] ?? `${idAtual}.json`;
				const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
				const ancora = document.createElement('a');
				ancora.href = url;
				ancora.download = nomeArquivo;
				ancora.click();
				URL.revokeObjectURL(url);
			} else {
				exportarComoArquivo(sessaoAnonima.obterRegistroDetalhado(registro.id)!);
			}
			toast.success(t('success.json_exported'));
		} finally {
			exportandoJson = false;
		}
	}

	function exportarMd() {
		if (!registro || usuarioAtual.valor) return; // autenticado usa o <a href> direto abaixo
		exportarRelatorioComoArquivo(
			sessaoAnonima.obterRegistroDetalhado(registro.id)!,
			idiomaAtual.valor
		);
	}
</script>

<svelte:head><title>{registro?.titulo ?? t('records.singular')} — MyProvenance</title></svelte:head>

{#if registro}
	<div class="flex flex-col gap-8">
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
				<Dialog.Root bind:open={dialogEdicaoRegistroAberto}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props} onclick={abrirEdicaoRegistro}>
								<i class="bx bx-edit-alt"></i>
								{t('common.edit')}
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-lg">
						<Dialog.Header>
							<Dialog.Title>{t('records.dialog.edit_title')}</Dialog.Title>
							<Dialog.Description>
								{t('records.dialog.edit_description')}
							</Dialog.Description>
						</Dialog.Header>
						<form class="flex flex-col gap-4" onsubmit={salvarEdicaoRegistro}>
							<div class="flex flex-col gap-1.5">
								<Label for="titulo-edicao">{t('common.title_label')}</Label>
								<Input id="titulo-edicao" bind:value={tituloEmEdicao} required maxlength={300} />
							</div>
							<div class="flex flex-col gap-1.5">
								<Label for="descricao-edicao">{t('common.description_label')}</Label>
								<RichTextEditor bind:value={descricaoEmEdicao} />
							</div>
							<Dialog.Footer>
								<Button type="submit" disabled={salvandoRegistro || !tituloEmEdicao.trim()}>
									{salvandoRegistro ? t('common.saving') : t('common.save_changes')}
								</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>
				{#if registro.status === 'rascunho'}
					<Button variant="outline" onclick={finalizar} disabled={finalizando}>
						<i class="bx bx-check-circle"></i>
						{finalizando ? t('records.finalizing') : t('records.finalize')}
					</Button>
				{/if}
				<Button variant="outline" onclick={exportarJson} disabled={exportandoJson}>
					<i class="bx bx-download"></i>
					{exportandoJson ? t('common.exporting') : t('records.export_json')}
				</Button>
				{#if usuarioAtual.valor}
					<Button variant="outline" href="/registros/{registro.id}/export.md">
						<i class="bx bx-file"></i>
						{t('records.export_report')}
					</Button>
				{:else}
					<Button variant="outline" onclick={exportarMd}>
						<i class="bx bx-file"></i>
						{t('records.export_report')}
					</Button>
				{/if}
				{#if usuarioAtual.valor}
					<Dialog.Root bind:open={dialogCompartilharAberto}>
						<Dialog.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>
									<i class="bx bx-share-alt"></i>
									{t('records.share')}
								</Button>
							{/snippet}
						</Dialog.Trigger>
						<Dialog.Content class="sm:max-w-lg">
							<Dialog.Header>
								<Dialog.Title>{t('share.dialog_title')}</Dialog.Title>
								<Dialog.Description>{t('share.dialog_description')}</Dialog.Description>
							</Dialog.Header>
							{#if registro.tokenCompartilhamento}
								<div class="flex flex-col gap-3">
									<div class="flex gap-2">
										<Input readonly value={urlPublica} onclick={(e) => e.currentTarget.select()} />
										<Button variant="outline" onclick={copiarUrlPublica}>
											<i class="bx bx-copy"></i>
											{t('share.copy')}
										</Button>
									</div>
									<Button
										variant="destructive"
										onclick={desativarCompartilhamento}
										disabled={compartilhando}
									>
										<i class="bx bx-link-external"></i>
										{t('share.deactivate')}
									</Button>
								</div>
							{:else}
								<Button onclick={ativarCompartilhamento} disabled={compartilhando}>
									{compartilhando ? t('common.saving') : t('share.activate')}
								</Button>
							{/if}
						</Dialog.Content>
					</Dialog.Root>
				{/if}
				<Button variant="destructive" onclick={excluirRegistro}>
					<i class="bx bx-trash"></i>
					{t('records.delete')}
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
						onclick={alternarDirecaoDiagrama}
					>
						{direcaoDiagrama === 'LR'
							? t('diagram.layout.horizontal')
							: t('diagram.layout.vertical')}
					</Button>
				{/if}
			</div>
			{#if entidades.length === 0}
				<p class="text-muted-foreground text-sm">
					{t('records.diagram.empty')}
				</p>
			{:else}
				<MermaidDiagram codigo={diagrama} />
			{/if}
		</section>

		<section class="flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-medium">{t('activities.heading')}</h2>
				<Dialog.Root bind:open={dialogAtividadeAberto}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button {...props}><i class="bx bx-plus"></i> {t('activities.add')}</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-xl">
						<Dialog.Header>
							<Dialog.Title>{t('activities.add')}</Dialog.Title>
							<Dialog.Description>
								{t('activities.dialog.create_description')}
							</Dialog.Description>
						</Dialog.Header>
						<Tabs.Root bind:value={abaAtiva}>
							<Tabs.List class="grid w-full grid-cols-3">
								<Tabs.Trigger value="criacao">{t('activity.type.criacao')}</Tabs.Trigger>
								<Tabs.Trigger value="transformacao">{t('activity.type.transformacao')}</Tabs.Trigger
								>
								<Tabs.Trigger value="analise">{t('activity.type.analise')}</Tabs.Trigger>
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
				<p class="text-muted-foreground text-sm">{t('activities.empty')}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each atividades as atividade (atividade.id)}
						<li class="border-border bg-card flex flex-col gap-1 rounded-lg border p-3 text-sm">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant="outline">{t('activity.type.' + atividade.tipo)}</Badge>
									<span class="text-muted-foreground text-xs"
										>{formatarData(atividade.dataHora, idiomaAtual.valor)}</span
									>
									<span class="text-muted-foreground text-xs"
										>· {nomeAgente.get(atividade.agenteId) ?? t('agents.singular')}</span
									>
								</div>
								{#if registro.status === 'rascunho'}
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											onclick={() => abrirEdicaoAtividade(atividade)}
											aria-label={t('activities.edit_aria')}
										>
											<i class="bx bx-edit-alt"></i>
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onclick={() => excluirAtividade(atividade)}
											aria-label={t('activities.delete_aria')}
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
									? atividade.entidadesGeradas
											.map((id) => {
												const nome = nomeEntidade.get(id) ?? id;
												const e = entidadePorId.get(id);
												return e
													? nome +
															sufixoRelacaoOrigem(e, (x) => nomeEntidade.get(x), idiomaAtual.valor)
													: nome;
											})
											.join(', ')
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

		{#if atividadeEmEdicao}
			{#key atividadeEmEdicao.id}
				<Dialog.Root bind:open={dialogEdicaoAberto}>
					<Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-xl">
						<Dialog.Header>
							<Dialog.Title>{t('activities.dialog.edit_title')}</Dialog.Title>
							<Dialog.Description>
								{t('activities.dialog.edit_description', {
									tipo: t('activity.type.' + atividadeEmEdicao.tipo)
								})}
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
			<h2 class="text-lg font-medium">{t('entities.heading')}</h2>
			{#if entidades.length === 0}
				<p class="text-muted-foreground text-sm">{t('entities.empty')}</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>{t('report.th.name')}</Table.Head>
							<Table.Head>{t('common.description_label')}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each entidades as entidade (entidade.id)}
							<Table.Row>
								<Table.Cell>{entidade.nome}</Table.Cell>
								<Table.Cell>{entidade.descricao ?? '—'}</Table.Cell>
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
{/if}
