import sanitizeHtml from 'sanitize-html';

/** Tags que o TipTap StarterKit produz — descricao rica do Registro (unico campo HTML do dominio). */
const TAGS_PERMITIDAS = [
	'p',
	'br',
	'strong',
	'em',
	's',
	'ul',
	'ol',
	'li',
	'blockquote',
	'code',
	'pre',
	'hr',
	'h1',
	'h2',
	'h3'
];

export function sanitizarHtmlRico(html: string): string {
	return sanitizeHtml(html, { allowedTags: TAGS_PERMITIDAS, allowedAttributes: {} });
}

/** Tags/atributos que o HTML gerado pelo marked (Markdown -> HTML) pode produzir — paginas estaticas Sobre/Como usar. */
const TAGS_MARKDOWN = [
	'p',
	'br',
	'strong',
	'em',
	's',
	'del',
	'ul',
	'ol',
	'li',
	'blockquote',
	'code',
	'pre',
	'hr',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'a',
	'table',
	'thead',
	'tbody',
	'tr',
	'th',
	'td',
	'img'
];

export function sanitizarMarkdownRenderizado(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: TAGS_MARKDOWN,
		allowedAttributes: {
			a: ['href', 'title', 'rel', 'target'],
			img: ['src', 'alt', 'title']
		}
	});
}
