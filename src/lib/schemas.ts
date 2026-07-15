/**
 * Validacao de entrada (Zod) — compartilhada entre rotas de API e formularios.
 * Espelha docs/especificacao.md §2. Toda entrada do usuario passa por aqui (Desenvolvimento.md §5).
 */
import { z } from 'zod';

export const tipoAgenteSchema = z.enum(['pessoa', 'instituicao', 'software']);
export const tipoAtividadeSchema = z.enum(['criacao', 'transformacao', 'analise']);

export const usernameSchema = z
	.string()
	.trim()
	.min(3, 'Usuario deve ter ao menos 3 caracteres.')
	.max(30, 'Usuario deve ter no maximo 30 caracteres.')
	.regex(/^[a-zA-Z0-9_]+$/, 'Usuario aceita apenas letras, numeros e underscore.');
export const pinSchema = z.string().regex(/^\d{6}$/, 'PIN deve ter exatamente 6 digitos.');

export const registrarUsuarioSchema = z.object({ username: usernameSchema, pin: pinSchema });
export const entrarSchema = z.object({ username: usernameSchema, pin: pinSchema });

export const agenteInputSchema = z.object({
	nome: z.string().trim().min(1, 'Nome e obrigatorio.').max(200),
	tipo: tipoAgenteSchema,
	afiliacao: z.string().trim().max(300).nullable().optional(),
	identificadorExterno: z.string().trim().max(200).nullable().optional()
});
export type AgenteInput = z.infer<typeof agenteInputSchema>;

export const registroInputSchema = z.object({
	titulo: z.string().trim().min(1, 'Titulo e obrigatorio.').max(300),
	descricao: z.string().trim().max(20000).nullable().optional()
});
export type RegistroInput = z.infer<typeof registroInputSchema>;

export const novaEntidadeInputSchema = z.object({
	nome: z.string().trim().min(1, 'Nome e obrigatorio.').max(300),
	descricao: z.string().trim().max(5000).nullable().optional(),
	formato: z.string().trim().max(100).nullable().optional(),
	localizacao: z.string().trim().max(2000).nullable().optional(),
	licenca: z.string().trim().max(300).nullable().optional()
});

export const parametroAtividadeSchema = z.object({
	chave: z.string().trim().min(1).max(200),
	valor: z.string().trim().max(2000)
});

export const ambienteExecucaoSchema = z.object({
	sistemaOperacional: z.string().trim().max(200).optional(),
	pacotes: z
		.array(
			z.object({ nome: z.string().trim().min(1).max(200), versao: z.string().trim().max(100) })
		)
		.optional()
});

export const criarAtividadeInputSchema = z.object({
	tipo: tipoAtividadeSchema,
	agenteId: z.uuid(),
	dataHora: z.iso.datetime({ offset: true }),
	descricao: z.string().trim().max(5000).nullable().optional(),
	entidadesUsadas: z.array(z.uuid()).default([]),
	local: z.string().trim().max(500).nullable().optional(),
	instrumento: z.string().trim().max(300).nullable().optional(),
	processo: z.string().trim().max(20000).nullable().optional(),
	parametros: z.array(parametroAtividadeSchema).nullable().optional(),
	ambienteExecucao: ambienteExecucaoSchema.nullable().optional(),
	entidadesGeradas: z.array(novaEntidadeInputSchema).optional().default([])
});
export type CriarAtividadeInput = z.infer<typeof criarAtividadeInputSchema>;

/**
 * Validacao do JSON exportado/importado — docs/especificacao.md §4.
 * Usada no upload (upsert por id, ADR-0004): campos completos (com id), nao os de criacao via formulario.
 */
export const agenteExportadoSchema = z.object({
	id: z.uuid(),
	nome: z.string().trim().min(1).max(200),
	tipo: tipoAgenteSchema,
	afiliacao: z.string().trim().max(300).nullable(),
	identificadorExterno: z.string().trim().max(200).nullable()
});

export const entidadeExportadaSchema = z.object({
	id: z.uuid(),
	registroId: z.uuid(),
	nome: z.string().trim().min(1).max(300),
	descricao: z.string().trim().max(5000).nullable(),
	formato: z.string().trim().max(100).nullable(),
	localizacao: z.string().trim().max(2000).nullable(),
	licenca: z.string().trim().max(300).nullable(),
	geradaPorAtividadeId: z.uuid()
});

export const atividadeExportadaSchema = z.object({
	id: z.uuid(),
	registroId: z.uuid(),
	tipo: tipoAtividadeSchema,
	agenteId: z.uuid(),
	dataHora: z.iso.datetime({ offset: true }),
	descricao: z.string().trim().max(5000).nullable(),
	entidadesUsadas: z.array(z.uuid()),
	// optional/default: compatibilidade com JSON exportado no schemaVersion 1 (campo nao existia).
	entidadesGeradas: z.array(z.uuid()).optional().default([]),
	local: z.string().trim().max(500).nullable(),
	instrumento: z.string().trim().max(300).nullable(),
	processo: z.string().trim().max(20000).nullable(),
	parametros: z.array(parametroAtividadeSchema).nullable(),
	ambienteExecucao: ambienteExecucaoSchema.nullable()
});

export const registroExportadoSchema = z.object({
	schemaVersion: z.number().int(),
	registro: z.object({
		id: z.uuid(),
		titulo: z.string().trim().min(1).max(300),
		descricao: z.string().trim().max(20000).nullable(),
		status: z.enum(['rascunho', 'finalizado']),
		criadoEm: z.iso.datetime({ offset: true }),
		finalizadoEm: z.iso.datetime({ offset: true }).nullable()
	}),
	agentes: z.array(agenteExportadoSchema),
	entidades: z.array(entidadeExportadaSchema),
	atividades: z.array(atividadeExportadaSchema)
});
export type RegistroExportadoValidado = z.infer<typeof registroExportadoSchema>;
