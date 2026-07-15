<script lang="ts">
	import mermaid from 'mermaid';
	import { mode } from 'mode-watcher';

	let { codigo }: { codigo: string } = $props();

	let svg = $state('');
	let erro = $state('');
	let contador = 0;

	$effect(() => {
		const codigoAtual = codigo;
		const temaAtual = mode.current === 'dark' ? 'dark' : 'default';
		mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: temaAtual });
		contador++;
		mermaid
			.render(`mermaid-diagrama-${contador}`, codigoAtual)
			.then((resultado) => {
				svg = resultado.svg;
				erro = '';
			})
			.catch((e: unknown) => {
				erro = e instanceof Error ? e.message : 'Erro ao renderizar diagrama.';
			});
	});
</script>

{#if erro}
	<p class="text-destructive text-sm">{erro}</p>
{:else if svg}
	<div class="overflow-x-auto">{@html svg}</div>
{/if}
