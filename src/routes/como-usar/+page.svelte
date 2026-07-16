<script lang="ts">
	import { t } from '$lib/i18n/estado.svelte';

	const steps = $derived([
		t('howto.step1'),
		t('howto.step2'),
		t('howto.step3'),
		t('howto.step4'),
		t('howto.step5'),
		t('howto.step6')
	]);
</script>

<svelte:head><title>{t('howto.page_title')}</title></svelte:head>

<div class="flex flex-col gap-6">
	<h1 class="text-2xl font-semibold tracking-tight">{t('howto.title')}</h1>
	<p class="text-muted-foreground">{t('howto.intro')}</p>
	<ol class="flex list-decimal flex-col gap-3 pl-5">
		{#each steps as step, i (i)}
			<li>{step}</li>
		{/each}
	</ol>
	<p class="text-muted-foreground text-sm">{t('howto.tip')}</p>
</div>
