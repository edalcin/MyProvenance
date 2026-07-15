/**
 * Validacao de entrada (Zod) — compartilhada entre rotas de API e formularios.
 * Espelha docs/especificacao.md §2. Toda entrada do usuario passa por aqui (Desenvolvimento.md §5).
 */
import { z } from 'zod';

export const tipoAgenteSchema = z.enum(['pessoa', 'instituicao', 'software']);
export const tipoAtividadeSchema = z.enum(['criacao', 'transformacao', 'analise']);

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
	pacotes: z.array(z.object({ nome: z.string().trim().min(1).max(200), versao: z.string().trim().max(100) })).optional()
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
	entidadeGerada: novaEntidadeInputSchema.nullable().optional()
});
export type CriarAtividadeInput = z.infer<typeof criarAtividadeInputSchema>;
