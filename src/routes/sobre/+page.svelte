<script lang="ts">
	import { t } from '$lib/i18n/estado.svelte';
</script>

<svelte:head><title>{t('about.page_title')}</title></svelte:head>

<div class="flex flex-col gap-6">
	<h1 class="text-2xl font-semibold tracking-tight">{t('about.title')}</h1>
	<div class="prose prose-sm dark:prose-invert flex max-w-none flex-col gap-4">
		<p>{t('about.p1')}</p>
		<p>{t('about.p2')}</p>
		<p>{t('about.p3')}</p>
	</div>
	<p class="text-muted-foreground text-xs">{t('about.footer')}</p>
</div>
