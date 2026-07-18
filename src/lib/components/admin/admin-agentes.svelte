<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { t } from '$lib/i18n/estado.svelte';
	import type { TipoAgente } from '$lib/types';
	import type { AgenteAdmin } from '$lib/server/db/repositories/admin';

	let { agentes }: { agentes: AgenteAdmin[] } = $props();

	let itens = $state(untrack(() => agentes));
	let busca = $state('');
	const filtrados = $derived(
		itens.filter((a) => a.nome.toLowerCase().includes(busca.trim().toLowerCase()))
	);

	const tiposAgente = (['pessoa', 'instituicao', 'software'] as const).map((valor) => ({
		valor,
		rotulo: t('agent.type.' + valor)
	}));

	let dialogAberto = $state(false);
	let editando: AgenteAdmin | null = $state(null);
	let formNome = $state('');
	let formTipo: TipoAgente = $state('pessoa');
	let formAfiliacao = $state('');
	let formIdentificador = $state('');
	let salvando = $state(false);

	function abrirEdicao(agente: AgenteAdmin) {
		editando = agente;
		formNome = agente.nome;
		formTipo = agente.tipo;
		formAfiliacao = agente.afiliacao ?? '';
		formIdentificador = agente.identificadorExterno ?? '';
		dialogAberto = true;
	}

	async function salvar(event: SubmitEvent) {
		event.preventDefault();
		if (!editando || !formNome.trim()) return;
		salvando = true;
		try {
			const resposta = await fetch('/admin/agentes', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					id: editando.id,
					nome: formNome.trim(),
					tipo: formTipo,
					afiliacao: formAfiliacao || null,
					identificadorExterno: formIdentificador || null
				})
			});
			if (!resposta.ok) {
				const e = await resposta.json().catch(() => ({}));
				toast.error(t(e.message ?? 'error.save_agent_failed'));
				return;
			}
			const atualizado = (await resposta.json()) as AgenteAdmin;
			itens = itens.map((item) => (item.id === atualizado.id ? atualizado : item));
			toast.success(t('admin.success.agent_updated'));
			dialogAberto = false;
		} finally {
			salvando = false;
		}
	}

	async function excluir(agente: AgenteAdmin) {
		if (!confirm(t('confirm.delete_agent', { nome: agente.nome }))) return;
		const resposta = await fetch('/admin/agentes', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ id: agente.id })
		});
		if (!resposta.ok) {
			const e = await resposta.json().catch(() => ({}));
			toast.error(t(e.message ?? 'error.agent_in_use'));
			return;
		}
		itens = itens.filter((item) => item.id !== agente.id);
		toast.success(t('admin.success.agent_deleted'));
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<Input placeholder={t('admin.search_placeholder')} bind:value={busca} class="max-w-sm" />

	{#if filtrados.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">{t('admin.empty.agents')}</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each filtrados as agente (agente.id)}
			<li
				class="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4"
			>
				<div class="flex flex-col gap-0.5">
					<span class="font-medium">{agente.nome}</span>
					<span class="text-muted-foreground text-xs">
						{t('admin.owner')}: {agente.donoUsername ?? '—'}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline">{t('agent.type.' + agente.tipo)}</Badge>
					<Button variant="ghost" size="icon-sm" onclick={() => abrirEdicao(agente)}>
						<i class="bx bx-edit-alt"></i>
					</Button>
					<Button variant="ghost" size="icon-sm" onclick={() => excluir(agente)}>
						<i class="bx bx-trash text-destructive"></i>
					</Button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<Dialog.Root bind:open={dialogAberto}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{t('agents.edit_title')}</Dialog.Title>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={salvar}>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-agente-nome">{t('common.name_label')}</Label>
				<Input id="admin-agente-nome" bind:value={formNome} required maxlength={200} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-agente-tipo">{t('common.type_label')}</Label>
				<Select.Root type="single" bind:value={formTipo}>
					<Select.Trigger id="admin-agente-tipo">{t('agent.type.' + formTipo)}</Select.Trigger>
					<Select.Content>
						{#each tiposAgente as { valor, rotulo } (valor)}
							<Select.Item value={valor} label={rotulo} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-agente-afiliacao">{t('report.th.affiliation')}</Label>
				<Input id="admin-agente-afiliacao" bind:value={formAfiliacao} maxlength={300} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-agente-identificador">{t('agents.external_id_label')}</Label>
				<Input id="admin-agente-identificador" bind:value={formIdentificador} maxlength={200} />
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={salvando || !formNome.trim()}>
					{salvando ? t('common.saving') : t('common.save_changes')}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
