<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	interface Par {
		a: string;
		b: string;
	}

	let {
		itens = $bindable<Par[]>([]),
		rotuloA,
		rotuloB,
		rotuloAdicionar
	}: { itens?: Par[]; rotuloA: string; rotuloB: string; rotuloAdicionar: string } = $props();

	function adicionar() {
		itens = [...itens, { a: '', b: '' }];
	}

	function remover(indice: number) {
		itens = itens.filter((_, i) => i !== indice);
	}
</script>

<div class="flex flex-col gap-2">
	{#each itens as item, indice (indice)}
		<div class="flex items-center gap-2">
			<Input placeholder={rotuloA} bind:value={item.a} class="flex-1" />
			<Input placeholder={rotuloB} bind:value={item.b} class="flex-1" />
			<Button type="button" variant="ghost" size="icon-sm" onclick={() => remover(indice)} aria-label="Remover">
				<i class="bx bx-x"></i>
			</Button>
		</div>
	{/each}
	<Button type="button" variant="outline" size="sm" onclick={adicionar}>
		<i class="bx bx-plus"></i>
		{rotuloAdicionar}
	</Button>
</div>
