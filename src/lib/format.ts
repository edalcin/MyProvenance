import type { Idioma } from './i18n';

export function formatarData(iso: string, locale: Idioma = 'pt'): string {
	const bcp47 = locale === 'en' ? 'en-US' : 'pt-BR';
	return new Intl.DateTimeFormat(bcp47, { dateStyle: 'medium', timeStyle: 'short' }).format(
		new Date(iso)
	);
}

export function formatarDataSemHora(iso: string, locale: Idioma = 'pt'): string {
	const bcp47 = locale === 'en' ? 'en-US' : 'pt-BR';
	return new Intl.DateTimeFormat(bcp47, { dateStyle: 'medium' }).format(new Date(iso));
}
