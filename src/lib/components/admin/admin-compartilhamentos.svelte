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
	import type { CompartilhamentoAdmin } from '$lib/server/db/repositories/admin';

	let { compartilhamentos }: { compartilhamentos: CompartilhamentoAdmin[] } = $props();

	let itens = $state(untrack(() => compartilhamentos));
	let busca = $state('');
	const filtrados = $derived(
		itens.filter(
			(c) =>
				c.registroTitulo.toLowerCase().includes(busca.trim().toLowerCase()) ||
				c.username.toLowerCase().includes(busca.trim().toLowerCase())
		)
	);

	const papeis = (['editor', 'administrador'] as const).map((valor) => ({
		valor,
		rotulo: t('share.role.' + valor)
	}));

	function chave(c: CompartilhamentoAdmin): string {
		return `${c.registroId}:${c.usuarioId}`;
	}

	let dialogAberto = $state(false);
	let editando: CompartilhamentoAdmin | null = $state(null);
	let formPapel: 'editor' | 'administrador' = $state('editor');
	let salvando = $state(false);

	function abrirEdicao(item: CompartilhamentoAdmin) {
		editando = item;
		formPapel = item.papel;
		dialogAberto = true;
	}

	async function salvar(event: SubmitEvent) {
		event.preventDefault();
		if (!editando) return;
		salvando = true;
		try {
			const resposta = await fetch('/admin/compartilhamentos', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					registroId: editando.registroId,
					usuarioId: editando.usuarioId,
					papel: formPapel
				})
			});
			if (!resposta.ok) {
				const e = await resposta.json().catch(() => ({}));
				toast.error(t(e.message ?? 'error.generic'));
				return;
			}
			itens = itens.map((item) =>
				item.registroId === editando!.registroId && item.usuarioId === editando!.usuarioId
					? { ...item, papel: formPapel }
					: item
			);
			toast.success(t('admin.success.share_updated'));
			dialogAberto = false;
		} finally {
			salvando = false;
		}
	}

	async function excluir(item: CompartilhamentoAdmin) {
		if (
			!confirm(
				t('admin.confirm.delete_share', { username: item.username, titulo: item.registroTitulo })
			)
		)
			return;
		const resposta = await fetch('/admin/compartilhamentos', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ registroId: item.registroId, usuarioId: item.usuarioId })
		});
		if (!resposta.ok) {
			const e = await resposta.json().catch(() => ({}));
			toast.error(t(e.message ?? 'error.generic'));
			return;
		}
		itens = itens.filter(
			(i) => !(i.registroId === item.registroId && i.usuarioId === item.usuarioId)
		);
		toast.success(t('admin.success.share_deleted'));
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<Input placeholder={t('admin.search_placeholder')} bind:value={busca} class="max-w-sm" />

	{#if filtrados.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">{t('admin.empty.shares')}</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each filtrados as item (chave(item))}
			<li
				class="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4"
			>
				<div class="flex flex-col gap-0.5">
					<span class="font-medium">{item.registroTitulo}</span>
					<span class="text-muted-foreground text-xs">{item.username}</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline">{t('share.role.' + item.papel)}</Badge>
					<Button variant="ghost" size="icon-sm" onclick={() => abrirEdicao(item)}>
						<i class="bx bx-edit-alt"></i>
					</Button>
					<Button variant="ghost" size="icon-sm" onclick={() => excluir(item)}>
						<i class="bx bx-trash text-destructive"></i>
					</Button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<Dialog.Root bind:open={dialogAberto}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>{t('share.role_label')}</Dialog.Title>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={salvar}>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-compartilhamento-papel">{t('share.role_label')}</Label>
				<Select.Root type="single" bind:value={formPapel}>
					<Select.Trigger id="admin-compartilhamento-papel"
						>{t('share.role.' + formPapel)}</Select.Trigger
					>
					<Select.Content>
						{#each papeis as { valor, rotulo } (valor)}
							<Select.Item value={valor} label={rotulo} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={salvando}>
					{salvando ? t('common.saving') : t('common.save_changes')}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
