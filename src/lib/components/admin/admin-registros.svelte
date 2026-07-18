<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import RichTextEditor from '$lib/components/rich-text-editor.svelte';
	import { t } from '$lib/i18n/estado.svelte';
	import type { StatusRegistro } from '$lib/types';
	import type { RegistroAdmin } from '$lib/server/db/repositories/admin';

	let { registros }: { registros: RegistroAdmin[] } = $props();

	let itens = $state(untrack(() => registros));
	let busca = $state('');
	const filtrados = $derived(
		itens.filter((r) => r.titulo.toLowerCase().includes(busca.trim().toLowerCase()))
	);

	const statusOpcoes = (['rascunho', 'finalizado'] as const).map((valor) => ({
		valor,
		rotulo: t('status.' + valor)
	}));

	let dialogAberto = $state(false);
	let editando: RegistroAdmin | null = $state(null);
	let formTitulo = $state('');
	let formDescricao = $state('');
	let formStatus: StatusRegistro = $state('rascunho');
	let salvando = $state(false);

	function abrirEdicao(registro: RegistroAdmin) {
		editando = registro;
		formTitulo = registro.titulo;
		formDescricao = registro.descricao ?? '';
		formStatus = registro.status;
		dialogAberto = true;
	}

	async function salvar(event: SubmitEvent) {
		event.preventDefault();
		if (!editando || !formTitulo.trim()) return;
		salvando = true;
		try {
			const resposta = await fetch('/admin/registros', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					id: editando.id,
					titulo: formTitulo.trim(),
					descricao: formDescricao || null,
					status: formStatus
				})
			});
			if (!resposta.ok) {
				const e = await resposta.json().catch(() => ({}));
				toast.error(t(e.message ?? 'error.update_record_failed'));
				return;
			}
			const atualizado = (await resposta.json()) as RegistroAdmin;
			itens = itens.map((item) => (item.id === atualizado.id ? atualizado : item));
			toast.success(t('admin.success.record_updated'));
			dialogAberto = false;
		} finally {
			salvando = false;
		}
	}

	async function excluir(registro: RegistroAdmin) {
		if (!confirm(t('confirm.delete_record', { titulo: registro.titulo }))) return;
		const resposta = await fetch('/admin/registros', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ id: registro.id })
		});
		if (!resposta.ok) {
			const e = await resposta.json().catch(() => ({}));
			toast.error(t(e.message ?? 'error.delete_record_failed'));
			return;
		}
		itens = itens.filter((item) => item.id !== registro.id);
		toast.success(t('admin.success.record_deleted'));
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<Input placeholder={t('admin.search_placeholder')} bind:value={busca} class="max-w-sm" />

	{#if filtrados.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">{t('admin.empty.records')}</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each filtrados as registro (registro.id)}
			<li
				class="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4"
			>
				<div class="flex flex-col gap-0.5">
					<span class="font-medium">{registro.titulo}</span>
					<span class="text-muted-foreground text-xs">
						{t('admin.owner')}: {registro.donoUsername ?? '—'}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline">{t('status.' + registro.status)}</Badge>
					<Button variant="ghost" size="icon-sm" onclick={() => abrirEdicao(registro)}>
						<i class="bx bx-edit-alt"></i>
					</Button>
					<Button variant="ghost" size="icon-sm" onclick={() => excluir(registro)}>
						<i class="bx bx-trash text-destructive"></i>
					</Button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<Dialog.Root bind:open={dialogAberto}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{t('records.dialog.edit_title')}</Dialog.Title>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={salvar}>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-registro-titulo">{t('common.title_label')}</Label>
				<Input id="admin-registro-titulo" bind:value={formTitulo} required maxlength={300} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-registro-descricao">{t('common.description_label')}</Label>
				<RichTextEditor bind:value={formDescricao} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-registro-status">{t('report.status_label')}</Label>
				<Select.Root type="single" bind:value={formStatus}>
					<Select.Trigger id="admin-registro-status">{t('status.' + formStatus)}</Select.Trigger>
					<Select.Content>
						{#each statusOpcoes as { valor, rotulo } (valor)}
							<Select.Item value={valor} label={rotulo} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={salvando || !formTitulo.trim()}>
					{salvando ? t('common.saving') : t('common.save_changes')}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
