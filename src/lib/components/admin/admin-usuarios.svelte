<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t, idiomaAtual } from '$lib/i18n/estado.svelte';
	import { formatarData } from '$lib/format';
	import type { UsuarioAdmin } from '$lib/server/db/repositories/admin';

	let { usuarios }: { usuarios: UsuarioAdmin[] } = $props();

	let itens = $state(untrack(() => usuarios));
	let busca = $state('');
	const filtrados = $derived(
		itens.filter((u) => u.username.toLowerCase().includes(busca.trim().toLowerCase()))
	);

	let dialogAberto = $state(false);
	let editando: UsuarioAdmin | null = $state(null);
	let formUsername = $state('');
	let formPin = $state('');
	let salvando = $state(false);

	function abrirEdicao(usuario: UsuarioAdmin) {
		editando = usuario;
		formUsername = usuario.username;
		formPin = '';
		dialogAberto = true;
	}

	async function salvar(event: SubmitEvent) {
		event.preventDefault();
		if (!editando || !formUsername.trim()) return;
		salvando = true;
		try {
			const resposta = await fetch('/admin/usuarios', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					id: editando.id,
					username: formUsername.trim(),
					...(formPin ? { pin: formPin } : {})
				})
			});
			if (!resposta.ok) {
				const e = await resposta.json().catch(() => ({}));
				toast.error(t(e.message ?? 'error.generic'));
				return;
			}
			const atualizado = (await resposta.json()) as UsuarioAdmin;
			itens = itens.map((item) => (item.id === atualizado.id ? atualizado : item));
			toast.success(t('admin.success.user_updated'));
			dialogAberto = false;
		} finally {
			salvando = false;
		}
	}

	async function excluir(usuario: UsuarioAdmin) {
		if (!confirm(t('admin.confirm.delete_user', { username: usuario.username }))) return;
		const resposta = await fetch('/admin/usuarios', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ id: usuario.id })
		});
		if (!resposta.ok) {
			const e = await resposta.json().catch(() => ({}));
			toast.error(t(e.message ?? 'error.resource_in_use'));
			return;
		}
		itens = itens.filter((item) => item.id !== usuario.id);
		toast.success(t('admin.success.user_deleted'));
	}
</script>

<div class="flex flex-col gap-4 py-4">
	<Input placeholder={t('admin.search_placeholder')} bind:value={busca} class="max-w-sm" />

	{#if filtrados.length === 0}
		<p class="text-muted-foreground py-8 text-center text-sm">{t('admin.empty.users')}</p>
	{/if}

	<ul class="flex flex-col gap-2">
		{#each filtrados as usuario (usuario.id)}
			<li
				class="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4"
			>
				<div class="flex flex-col gap-0.5">
					<span class="font-medium">{usuario.username}</span>
					<span class="text-muted-foreground text-xs">
						{t('common.created_at', { data: formatarData(usuario.criadoEm, idiomaAtual.valor) })}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="icon-sm" onclick={() => abrirEdicao(usuario)}>
						<i class="bx bx-edit-alt"></i>
					</Button>
					<Button variant="ghost" size="icon-sm" onclick={() => excluir(usuario)}>
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
			<Dialog.Title>{t('common.username_label')}</Dialog.Title>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={salvar}>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-usuario-username">{t('common.username_label')}</Label>
				<Input id="admin-usuario-username" bind:value={formUsername} required maxlength={30} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="admin-usuario-pin">{t('admin.reset_pin_label')}</Label>
				<Input
					id="admin-usuario-pin"
					type="password"
					inputmode="numeric"
					pattern={'\\d{6}'}
					maxlength={6}
					bind:value={formPin}
					autocomplete="new-password"
				/>
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={salvando || !formUsername.trim()}>
					{salvando ? t('common.saving') : t('common.save_changes')}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
