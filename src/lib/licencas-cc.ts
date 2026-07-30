/**
 * Licencas Creative Commons mais utilizadas, oferecidas no pulldown do campo "Licenca"
 * de Entidade. `valor` e' o texto persistido em `entidades.licenca` (TEXT livre) —
 * qualquer valor fora desta lista (ex.: URL, licenca custom) e' tratado como "outro"
 * na UI, sem perda de dado.
 */
export interface LicencaCC {
	/** Texto persistido — tambem exibido como rotulo (codigo universal, nao traduzido). */
	valor: string;
	/** Chave i18n com a descricao breve, usada como tooltip. */
	chaveDescricao: string;
}

export const LICENCAS_CC: LicencaCC[] = [
	{ valor: 'CC0 1.0', chaveDescricao: 'license.cc0' },
	{ valor: 'CC BY 4.0', chaveDescricao: 'license.cc_by' },
	{ valor: 'CC BY-SA 4.0', chaveDescricao: 'license.cc_by_sa' },
	{ valor: 'CC BY-ND 4.0', chaveDescricao: 'license.cc_by_nd' },
	{ valor: 'CC BY-NC 4.0', chaveDescricao: 'license.cc_by_nc' },
	{ valor: 'CC BY-NC-SA 4.0', chaveDescricao: 'license.cc_by_nc_sa' },
	{ valor: 'CC BY-NC-ND 4.0', chaveDescricao: 'license.cc_by_nc_nd' }
];

/** true se `valor` for um texto nao vazio que nao corresponde a nenhuma licenca CC pre-definida
 * (URL de licenca, ou outro texto livre) — usado para decidir se o pulldown deve
 * mostrar "Outra" com o campo de texto customizado. */
export function ehLicencaPersonalizada(valor: string): boolean {
	const v = valor.trim();
	return v !== '' && !LICENCAS_CC.some((l) => l.valor === v);
}
