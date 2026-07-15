<script lang="ts">
	import { page } from '$app/state';
	import { mode, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';

	const links = [
		{ href: '/registros', label: 'Registros' },
		{ href: '/agentes', label: 'Agentes' }
	];
</script>

<header class="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
	<div class="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
		<a href="/registros" class="flex items-center gap-2 font-semibold tracking-tight">
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
		<Button variant="ghost" size="icon-sm" onclick={toggleMode} aria-label="Alternar tema claro/escuro">
			<i class="bx {mode.current === 'dark' ? 'bx-moon' : 'bx-sun'}"></i>
		</Button>
	</div>
</header>
