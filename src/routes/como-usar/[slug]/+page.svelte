<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/estado.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{t('howto.page_title')}</title></svelte:head>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitizado no servidor (sanitizarMarkdownRenderizado) a partir de arquivo .md do repositorio (manual/). -->
<article class="prose prose-sm dark:prose-invert max-w-none">{@html data.html}</article>

<nav class="border-border mt-8 flex justify-between gap-4 border-t pt-4 text-sm">
	{#if data.anterior}
		<a
			class="text-primary hover:underline"
			href={resolve('/como-usar/[slug]', { slug: data.anterior.slug })}>← {data.anterior.titulo}</a
		>
	{:else}
		<a class="text-primary hover:underline" href={resolve('/como-usar')}>← {t('manual.index')}</a>
	{/if}
	{#if data.proximo}
		<a
			class="text-primary hover:underline"
			href={resolve('/como-usar/[slug]', { slug: data.proximo.slug })}>{data.proximo.titulo} →</a
		>
	{/if}
</nav>
