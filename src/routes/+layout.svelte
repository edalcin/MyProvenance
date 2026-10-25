<script lang="ts">
	import { untrack } from 'svelte';
	import './layout.css';
	import 'boxicons/css/boxicons.min.css';
	import favicon from '#lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import AppNav from '#lib/components/app-nav.svelte';
	import AnonimoBanner from '#lib/components/anonimo-banner.svelte';
	import { usuarioAtual } from '#lib/client/usuario-atual.svelte.js';
	import { idiomaAtual } from '#lib/i18n/estado.svelte.js';
	import { sessaoAnonima } from '#lib/client/sessao-anonima.svelte.js';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// untrack: seed unica na montagem — sair()/entrar() forcam reload da pagina, nao precisa reagir.
	untrack(() => {
		usuarioAtual.definir(data.usuario);
		idiomaAtual.definir(data.idioma);
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
