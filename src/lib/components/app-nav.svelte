<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { mode, toggleMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { usuarioAtual } from '$lib/client/usuario-atual.svelte';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import { COOKIE_IDIOMA } from '$lib/i18n';
	import { idiomaAtual, t, msgErro } from '$lib/i18n/estado.svelte';
	import EntrarDialog from './entrar-dialog.svelte';
	import CriarContaDialog from './criar-conta-dialog.svelte';

	// ponytail: nav sem menu hambúrguer; se lotar no mobile vira ajuste visual à parte.
	const links = $derived([
		{ href: resolve('/registros'), label: t('nav.records') },
		{ href: resolve('/agentes'), label: t('nav.agents') },
		{ href: resolve('/como-usar'), label: t('nav.howto') },
		{ href: resolve('/sobre'), label: t('nav.about') },
		...(page.data.adminHabilitado ? [{ href: resolve('/admin'), label: t('nav.admin') }] : [])
	]);

	// Link publico (/compartilhar/:token): visitante sem sessao, pagina somente leitura — nao
	// faz sentido oferecer navegacao para areas autenticadas nem convite pra Entrar/Criar conta.
	const emVisualizacaoPublica = $derived(page.url.pathname.startsWith('/compartilhar'));

	let saindo = $state(false);

	async function sair() {
		saindo = true;
		try {
			await fetch('/auth/sair', { method: 'POST' });
			window.location.reload();
		} catch (err) {
			toast.error(msgErro(err, 'error.sign_out_failed'));
			saindo = false;
		}
	}

	function alternarIdioma() {
		const novo = idiomaAtual.valor === 'pt' ? 'en' : 'pt';
		idiomaAtual.definir(novo); // re-render reativo, sem reload
		document.cookie = `${COOKIE_IDIOMA}=${novo}; path=/; max-age=31536000; samesite=lax`;
		document.documentElement.lang = novo === 'en' ? 'en' : 'pt-BR';
	}
</script>

<header class="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
	<div class="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
		<a href={resolve('/registros')} class="flex items-center gap-2 font-semibold tracking-tight">
			<i class="bx bx-git-branch text-primary text-xl"></i>
			MyProvenance
		</a>
		{#if !emVisualizacaoPublica}
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
		{:else}
			<div class="flex-1"></div>
		{/if}
		{#if !emVisualizacaoPublica}
			{#if usuarioAtual.valor}
				<span class="text-muted-foreground hidden text-sm sm:inline"
					>{usuarioAtual.valor.username}</span
				>
				<Button variant="ghost" size="sm" onclick={sair} disabled={saindo}>
					<i class="bx bx-log-out"></i>
					{t('nav.signout')}
				</Button>
			{:else}
				<EntrarDialog />
				{#if sessaoAnonima.temDadosNaoSalvos}
					<CriarContaDialog />
				{/if}
			{/if}
		{/if}
		<Button variant="ghost" size="sm" onclick={alternarIdioma} aria-label={t('nav.language')}>
			<i class="bx bx-globe"></i>
			{idiomaAtual.valor === 'pt' ? 'PT' : 'EN'}
		</Button>
		<Button
			variant="ghost"
			size="icon-sm"
			href="https://github.com/edalcin/MyProvenance"
			target="_blank"
			rel="noopener noreferrer"
			aria-label={t('nav.github')}
		>
			<i class="bx bxl-github"></i>
		</Button>
		<Button variant="ghost" size="icon-sm" onclick={toggleMode} aria-label={t('nav.theme')}>
			<i class="bx {mode.current === 'dark' ? 'bx-moon' : 'bx-sun'}"></i>
		</Button>
	</div>
</header>
