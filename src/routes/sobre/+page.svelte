<script lang="ts">
	import { t } from '$lib/i18n/estado.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{t('about.page_title')}</title></svelte:head>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitizado no servidor (sanitizarMarkdownRenderizado) a partir de arquivo .md do repositorio (src/lib/content/). -->
<div class="prose prose-sm dark:prose-invert max-w-none">{@html data.html}</div>
