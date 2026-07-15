import sanitizeHtml from 'sanitize-html';

/** Tags que o TipTap StarterKit produz — descricao rica do Registro (unico campo HTML do dominio). */
const TAGS_PERMITIDAS = ['p', 'br', 'strong', 'em', 's', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'h1', 'h2', 'h3'];

export function sanitizarHtmlRico(html: string): string {
	return sanitizeHtml(html, { allowedTags: TAGS_PERMITIDAS, allowedAttributes: {} });
}
