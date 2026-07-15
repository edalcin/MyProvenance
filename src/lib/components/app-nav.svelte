<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { mode, toggleMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { usuarioAtual } from '$lib/client/usuario-atual.svelte';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import EntrarDialog from './entrar-dialog.svelte';
	import CriarContaDialog from './criar-conta-dialog.svelte';

	const links = [
		{ href: resolve('/registros'), label: 'Registros' },
		{ href: resolve('/agentes'), label: 'Agentes' }
	];

	let saindo = $state(false);

	async function sair() {
		saindo = true;
		try {
			await fetch('/auth/sair', { method: 'POST' });
			window.location.reload();
		} catch {
			toast.error('Erro ao sair.');
			saindo = false;
		}
	}
</script>

<header class="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
	<div class="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
		<a href={resolve('/registros')} class="flex items-center gap-2 font-semibold tracking-tight">
			<i class="bx bx-git-branch text-primary text-xl"></i>
			MyProvenance
		</a>
		<nav class="flex flex-1 items-center gap-1">
			{#each links as link (link.href)}
				<Button
					href={link.href}
					variant={page.url.pathname.startsWith(link.href) ? 'secondary' : 'ghost'}
					size="sm"
				>
					{link.label}
				</Button>
			{/each}
		</nav>
		{#if usuarioAtual.valor}
			<span class="text-muted-foreground hidden text-sm sm:inline"
				>{usuarioAtual.valor.username}</span
			>
			<Button variant="ghost" size="sm" onclick={sair} disabled={saindo}>
				<i class="bx bx-log-out"></i> Sair
			</Button>
		{:else}
			<EntrarDialog />
			{#if sessaoAnonima.temDadosNaoSalvos}
				<CriarContaDialog />
			{/if}
		{/if}
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={toggleMode}
			aria-label="Alternar tema claro/escuro"
		>
			<i class="bx {mode.current === 'dark' ? 'bx-moon' : 'bx-sun'}"></i>
		</Button>
	</div>
</header>
