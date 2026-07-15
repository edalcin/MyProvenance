<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import 'boxicons/css/boxicons.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import AppNav from '$lib/components/app-nav.svelte';

	let { children } = $props();

	// PWA offline-leitura (ADR-0006): adapter-node nao tem HTML unico para o plugin injetar
	// registro automatico, entao registra manualmente. manifest.webmanifest ja linkado no app.html.
	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher themeColors={{ light: '#ffffff', dark: '#0a0a0a' }} />
<Toaster richColors position="bottom-right" />
<div class="bg-background text-foreground flex min-h-svh flex-col">
	<AppNav />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>
