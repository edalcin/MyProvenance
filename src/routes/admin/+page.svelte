<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import AdminUsuarios from '$lib/components/admin/admin-usuarios.svelte';
	import AdminRegistros from '$lib/components/admin/admin-registros.svelte';
	import AdminAgentes from '$lib/components/admin/admin-agentes.svelte';
	import AdminCompartilhamentos from '$lib/components/admin/admin-compartilhamentos.svelte';
	import AdminBackup from '$lib/components/admin/admin-backup.svelte';
	import { t } from '$lib/i18n/estado.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let senha = $state('');
	let entrando = $state(false);
	let saindo = $state(false);

	async function entrar(event: SubmitEvent) {
		event.preventDefault();
		if (!senha) return;
		entrando = true;
		try {
			const resposta = await fetch('/admin/entrar', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ senha })
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({}));
				toast.error(t(erro.message ?? 'admin.wrong_password'));
				return;
			}
			window.location.reload();
		} finally {
			entrando = false;
		}
	}

	async function sair() {
		saindo = true;
		try {
			await fetch('/admin/sair', { method: 'POST' });
			window.location.reload();
		} finally {
			saindo = false;
		}
	}
</script>

<svelte:head><title>{t('admin.page_title')}</title></svelte:head>

{#if !data.autenticado}
	<div class="flex min-h-[60vh] items-center justify-center">
		<Card.Root class="w-full max-w-sm">
			<Card.Header>
				<Card.Title>{t('admin.heading')}</Card.Title>
				<Card.Description>{t('admin.login_description')}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form class="flex flex-col gap-4" onsubmit={entrar}>
					<div class="flex flex-col gap-1.5">
						<Label for="admin-senha">{t('admin.password_label')}</Label>
						<Input id="admin-senha" type="password" bind:value={senha} required autofocus />
					</div>
					<Button type="submit" disabled={entrando || !senha}>
						{entrando ? t('admin.signing_in') : t('admin.sign_in')}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<div class="flex flex-col gap-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h1 class="text-2xl font-semibold tracking-tight">{t('admin.heading')}</h1>
			<Button variant="outline" size="sm" onclick={sair} disabled={saindo}>
				<i class="bx bx-log-out"></i>
				{t('admin.logout')}
			</Button>
		</div>

		<Tabs.Root value="usuarios">
			<Tabs.List class="grid w-full grid-cols-5">
				<Tabs.Trigger value="usuarios">{t('admin.tab.users')}</Tabs.Trigger>
				<Tabs.Trigger value="registros">{t('admin.tab.records')}</Tabs.Trigger>
				<Tabs.Trigger value="agentes">{t('admin.tab.agents')}</Tabs.Trigger>
				<Tabs.Trigger value="compartilhamentos">{t('admin.tab.shares')}</Tabs.Trigger>
				<Tabs.Trigger value="backup">{t('admin.tab.backup')}</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="usuarios">
				<AdminUsuarios usuarios={data.usuarios} />
			</Tabs.Content>
			<Tabs.Content value="registros">
				<AdminRegistros registros={data.registros} />
			</Tabs.Content>
			<Tabs.Content value="agentes">
				<AdminAgentes agentes={data.agentes} />
			</Tabs.Content>
			<Tabs.Content value="compartilhamentos">
				<AdminCompartilhamentos compartilhamentos={data.compartilhamentos} />
			</Tabs.Content>
			<Tabs.Content value="backup">
				<AdminBackup />
			</Tabs.Content>
		</Tabs.Root>
	</div>
{/if}
