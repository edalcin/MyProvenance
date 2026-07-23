<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import './layout.css';
	import 'boxicons/css/boxicons.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import AppNav from '$lib/components/app-nav.svelte';
	import AnonimoBanner from '$lib/components/anonimo-banner.svelte';
	import { usuarioAtual } from '$lib/client/usuario-atual.svelte';
	import { idiomaAtual } from '$lib/i18n/estado.svelte';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// untrack: seed unica na montagem — sair()/entrar() forcam reload da pagina, nao precisa reagir.
	untrack(() => {
		usuarioAtual.definir(data.usuario);
		idiomaAtual.definir(data.idioma);
	});

	// PWA offline-leitura (ADR-0006): adapter-node nao tem HTML unico para o plugin injetar
	// registro automatico, entao registra manualmente. manifest.webmanifest ja linkado no app.html.
	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	});

	// Aviso nativo se tentar fechar/recarregar anonimo com dado nao exportado (ADR-0009).
	function aoTentarSair(event: BeforeUnloadEvent) {
		if (!usuarioAtual.valor && sessaoAnonima.temDadosNaoSalvos) {
			event.preventDefault();
		}
	}
</script>

<svelte:window onbeforeunload={aoTentarSair} />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher themeColors={{ light: '#ffffff', dark: '#0a0a0a' }} />
<Toaster richColors position="bottom-right" />
<div class="bg-background text-foreground flex min-h-svh flex-col">
	<Tooltip.Provider>
		<AppNav />
		{#if !usuarioAtual.valor && sessaoAnonima.temDadosNaoSalvos}
			<AnonimoBanner />
		{/if}
		<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
			{@render children()}
		</main>
	</Tooltip.Provider>
</div>
