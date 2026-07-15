<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import { exportarComoArquivo } from '$lib/client/exportar-importar';
	import CriarContaDialog from './criar-conta-dialog.svelte';

	function exportarTudo() {
		if (sessaoAnonima.registros.length === 0) {
			toast.error('Nenhum Registro para exportar ainda.');
			return;
		}
		for (const registro of sessaoAnonima.registros) {
			const detalhe = sessaoAnonima.obterRegistroDetalhado(registro.id);
			if (detalhe) exportarComoArquivo(detalhe);
		}
	}
</script>

<div
	class="border-border bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-sm"
>
	<p class="flex items-center gap-2">
		<i class="bx bx-info-circle shrink-0 text-base"></i>
		Você está sem conta — os dados só existem neste navegador. Exporte o JSON antes de sair, ou crie uma
		conta para salvar automaticamente.
	</p>
	<div class="flex shrink-0 gap-2">
		<Button variant="outline" size="sm" onclick={exportarTudo}>
			<i class="bx bx-download"></i> Exportar JSON
		</Button>
		<CriarContaDialog />
	</div>
</div>
