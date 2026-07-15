import { describe, expect, it } from 'vitest';
import {
	atualizarRegistro,
	criarRegistro,
	finalizarRegistro,
	RegistroNaoEncontradoError
} from './registros';
import { criarUsuario } from './usuarios';

// ponytail: DB_PATH=':memory:' injetado por vite.config.ts (test.env) — sem framework extra.
const usuarioId = criarUsuario({ username: 'teste_registros', pin: '123456' }).id;

describe('atualizarRegistro (titulo/descricao sao metadados, nao "historico" — §3)', () => {
	it('atualiza titulo e descricao em Rascunho', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Titulo original' });

		const atualizado = atualizarRegistro(registro.id, usuarioId, {
			titulo: 'Titulo editado',
			descricao: 'Nova descricao'
		});

		expect(atualizado.titulo).toBe('Titulo editado');
		expect(atualizado.descricao).toBe('Nova descricao');
		expect(atualizado.status).toBe('rascunho');
	});

	it('permite editar mesmo apos finalizado (imutabilidade e so de atividades/entidades)', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro a finalizar' });
		finalizarRegistro(registro.id, usuarioId);

		const atualizado = atualizarRegistro(registro.id, usuarioId, {
			titulo: 'Titulo pos-finalizacao',
			descricao: null
		});

		expect(atualizado.titulo).toBe('Titulo pos-finalizacao');
		expect(atualizado.status).toBe('finalizado');
	});

	it('rejeita atualizar Registro inexistente ou de outro usuario', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro alheio' });
		const outroUsuarioId = criarUsuario({ username: 'outro_teste_registros', pin: '654321' }).id;

		expect(() =>
			atualizarRegistro(registro.id, outroUsuarioId, { titulo: 'Tentativa invasora' })
		).toThrow(RegistroNaoEncontradoError);
		expect(() =>
			atualizarRegistro('018f2f3a-0000-7000-8000-000000000000', usuarioId, { titulo: 'X' })
		).toThrow(RegistroNaoEncontradoError);
	});
});
