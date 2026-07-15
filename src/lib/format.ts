export function formatarData(iso: string): string {
	return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
		new Date(iso)
	);
}

export function formatarDataSemHora(iso: string): string {
	return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(iso));
}
