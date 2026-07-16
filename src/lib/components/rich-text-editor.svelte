<script lang="ts">
	import { onMount } from 'svelte';
	import type { Editor as EditorInstance } from '@tiptap/core';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/estado.svelte';

	/**
	 * Niveis de heading e marcas aqui DEVEM bater com o allowlist de
	 * src/lib/server/sanitize.ts — senao formatacao aplicada na UI e
	 * descartada silenciosamente ao salvar.
	 *
	 * TipTap so e importado no client (onMount) — mantem o pacote fora do bundle/runtime
	 * do servidor (Dockerfile), ja que o editor nunca roda durante SSR.
	 */
	let {
		value = $bindable(''),
		placeholder = t('activities.rich_text_placeholder')
	}: { value?: string; placeholder?: string } = $props();

	let elemento: HTMLDivElement;
	let editor: EditorInstance | undefined = $state();
	let versao = $state(0); // incrementado a cada transacao — forca reavaliar editor.isActive() no template

	onMount(() => {
		let cancelado = false;
		Promise.all([
			import('@tiptap/core'),
			import('@tiptap/starter-kit'),
			import('@tiptap/extensions')
		]).then(([{ Editor }, { default: StarterKit }, { Placeholder }]) => {
			if (cancelado) return;
			editor = new Editor({
				element: elemento,
				extensions: [
					StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
					Placeholder.configure({ placeholder })
				],
				content: value,
				editorProps: {
					attributes: {
						class: 'prose prose-sm dark:prose-invert max-w-none min-h-32 outline-none px-3 py-2'
					}
				},
				onUpdate: ({ editor }) => {
					value = editor.getHTML();
				},
				onTransaction: () => {
					versao++;
				}
			});
		});
		return () => {
			cancelado = true;
			editor?.destroy();
		};
	});

	const botoes = $derived([
		{
			label: t('editor.bold'),
			icon: 'bx-bold',
			run: () => editor?.chain().focus().toggleBold().run(),
			ativo: () => editor?.isActive('bold')
		},
		{
			label: t('editor.italic'),
			icon: 'bx-italic',
			run: () => editor?.chain().focus().toggleItalic().run(),
			ativo: () => editor?.isActive('italic')
		},
		{
			label: t('editor.strike'),
			icon: 'bx-strikethrough',
			run: () => editor?.chain().focus().toggleStrike().run(),
			ativo: () => editor?.isActive('strike')
		},
		{
			label: t('editor.heading'),
			icon: 'bx-heading',
			run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
			ativo: () => editor?.isActive('heading', { level: 2 })
		},
		{
			label: t('editor.bullet_list'),
			icon: 'bx-list-ul',
			run: () => editor?.chain().focus().toggleBulletList().run(),
			ativo: () => editor?.isActive('bulletList')
		},
		{
			label: t('editor.ordered_list'),
			icon: 'bx-list-ol',
			run: () => editor?.chain().focus().toggleOrderedList().run(),
			ativo: () => editor?.isActive('orderedList')
		},
		{
			label: t('editor.blockquote'),
			icon: 'bx-comment-detail',
			run: () => editor?.chain().focus().toggleBlockquote().run(),
			ativo: () => editor?.isActive('blockquote')
		},
		{
			label: t('editor.code_block'),
			icon: 'bx-code-alt',
			run: () => editor?.chain().focus().toggleCodeBlock().run(),
			ativo: () => editor?.isActive('codeBlock')
		}
	]);
</script>

<div class="border-input rounded-md border">
	<div class="border-input flex flex-wrap gap-1 border-b p-1">
		{#each botoes as botao (botao.label)}
			{@const _ = versao}
			<Button
				type="button"
				variant={botao.ativo() ? 'secondary' : 'ghost'}
				size="icon-sm"
				title={botao.label}
				onclick={botao.run}
			>
				<i class="bx {botao.icon}"></i>
			</Button>
		{/each}
	</div>
	<div bind:this={elemento}></div>
</div>

<style>
	:global(.tiptap.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: var(--color-muted-foreground);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
