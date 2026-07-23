<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';

	/** Icone "?" com tooltip explicando e exemplificando um campo de formulario. */
	let { texto }: { texto: string } = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		class="text-muted-foreground hover:text-foreground inline-flex align-middle"
		aria-label={texto}
	>
		<i class="bx bx-help-circle"></i>
	</Tooltip.Trigger>
	<Tooltip.Content class="max-w-xs text-wrap">{texto}</Tooltip.Content>
</Tooltip.Root>
