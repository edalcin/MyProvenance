<script lang="ts">
	import { mode } from 'mode-watcher';
	import { t } from '$lib/i18n/estado.svelte';

	// mermaid so e importado no client (dentro do $effect, que nunca roda no SSR) — mantem
	// o pacote (e seus layouts pesados de diagramas nao usados aqui) fora do runtime do servidor.
	let { codigo }: { codigo: string } = $props();

	let svg = $state('');
	let erro = $state('');
	let contador = 0;

	$effect(() => {
		const codigoAtual = codigo;
		const temaAtual = mode.current === 'dark' ? 'dark' : 'default';
		import('mermaid').then(({ default: mermaid }) => {
			mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: temaAtual });
			contador++;
			mermaid
				.render(`mermaid-diagrama-${contador}`, codigoAtual)
				.then((resultado) => {
					svg = resultado.svg;
					erro = '';
				})
				.catch((e: unknown) => {
					erro = e instanceof Error ? e.message : t('diagram.render_error');
				});
		});
	});
</script>

{#if erro}
	<p class="text-destructive text-sm">{erro}</p>
{:else if svg}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- securityLevel:'strict' sanitiza labels via DOMPurify internamente (mermaid.initialize acima). -->
	<div class="overflow-x-auto">{@html svg}</div>
{/if}
