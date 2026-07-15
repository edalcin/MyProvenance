<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { Placeholder } from '@tiptap/extensions';
	import { Button } from '$lib/components/ui/button';

	/**
	 * Niveis de heading e marcas aqui DEVEM bater com o allowlist de
	 * src/lib/server/sanitize.ts — senao formatacao aplicada na UI e
	 * descartada silenciosamente ao salvar.
	 */
	let { value = $bindable(''), placeholder = 'Descricao (opcional)…' }: { value?: string; placeholder?: string } =
		$props();

	let elemento: HTMLDivElement;
	let editor: Editor | undefined = $state();
	let versao = $state(0); // incrementado a cada transacao — forca reavaliar editor.isActive() no template

	onMount(() => {
		editor = new Editor({
			element: elemento,
			extensions: [
				StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
				Placeholder.configure({ placeholder })
			],
			content: value,
			editorProps: {
				attributes: { class: 'prose prose-sm dark:prose-invert max-w-none min-h-32 outline-none px-3 py-2' }
			},
			onUpdate: ({ editor }) => {
				value = editor.getHTML();
			},
			onTransaction: () => {
				versao++;
			}
		});
	});

	onDestroy(() => editor?.destroy());

	const botoes = [
		{ label: 'Negrito', icon: 'bx-bold', run: () => editor?.chain().focus().toggleBold().run(), ativo: () => editor?.isActive('bold') },
		{ label: 'Italico', icon: 'bx-italic', run: () => editor?.chain().focus().toggleItalic().run(), ativo: () => editor?.isActive('italic') },
		{ label: 'Riscado', icon: 'bx-strikethrough', run: () => editor?.chain().focus().toggleStrike().run(), ativo: () => editor?.isActive('strike') },
		{ label: 'Titulo', icon: 'bx-heading', run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), ativo: () => editor?.isActive('heading', { level: 2 }) },
		{ label: 'Lista', icon: 'bx-list-ul', run: () => editor?.chain().focus().toggleBulletList().run(), ativo: () => editor?.isActive('bulletList') },
		{ label: 'Lista numerada', icon: 'bx-list-ol', run: () => editor?.chain().focus().toggleOrderedList().run(), ativo: () => editor?.isActive('orderedList') },
		{ label: 'Citacao', icon: 'bx-comment-detail', run: () => editor?.chain().focus().toggleBlockquote().run(), ativo: () => editor?.isActive('blockquote') },
		{ label: 'Codigo', icon: 'bx-code-alt', run: () => editor?.chain().focus().toggleCodeBlock().run(), ativo: () => editor?.isActive('codeBlock') }
	];
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
