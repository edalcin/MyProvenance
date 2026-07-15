<script lang="ts">
	import './layout.css';
	import 'boxicons/css/boxicons.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import AppNav from '$lib/components/app-nav.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster richColors position="bottom-right" />
<div class="bg-background text-foreground flex min-h-svh flex-col">
	<AppNav />
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>
