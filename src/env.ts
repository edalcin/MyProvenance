import { defineEnvVars } from '@sveltejs/kit/env';

// Todas dinamicas (lidas no start do servidor), opcionais — ver .env.example.
export const variables = defineEnvVars({
	URL_BASE: {
		description: 'URL publica externa (sem barra final) para o link de compartilhamento',
		schema: (input) => input ?? ''
	},
	ADM_PWD: {
		description: 'Senha da Area administrativa; vazia = /admin desabilitado',
		schema: (input) => input ?? ''
	},
	DB_PATH: {
		description: "Caminho do arquivo SQLite (':memory:' nos testes)",
		schema: (input) => input || './data/myprovenance.sqlite'
	}
});
