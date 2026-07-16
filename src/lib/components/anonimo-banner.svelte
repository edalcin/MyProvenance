<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import { exportarComoArquivo } from '$lib/client/exportar-importar';
	import CriarContaDialog from './criar-conta-dialog.svelte';
	import { t } from '$lib/i18n/estado.svelte';

	function exportarTudo() {
		if (sessaoAnonima.registros.length === 0) {
			toast.error(t('error.nothing_to_export'));
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
		{t('account.anonymous_banner')}
	</p>
	<div class="flex shrink-0 gap-2">
		<Button variant="outline" size="sm" onclick={exportarTudo}>
			<i class="bx bx-download"></i>
			{t('records.export_json')}
		</Button>
		<CriarContaDialog />
	</div>
</div>
