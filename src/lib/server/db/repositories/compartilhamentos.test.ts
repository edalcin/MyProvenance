import { describe, expect, it } from 'vitest';
import {
	AutoCompartilhamentoError,
	compartilharComUsuario,
	listarAcessos,
	removerCompartilhamento,
	UsuarioNaoEncontradoError
} from './compartilhamentos';
import {
	ativarCompartilhamento,
	criarRegistro,
	excluirRegistro,
	finalizarRegistro,
	listarRegistros,
	obterRegistro,
	RegistroNaoEncontradoError
} from './registros';
import { criarAgente } from './agentes';
import { criarAtividade } from './atividades';
import { criarUsuario } from './usuarios';

// ponytail: DB_PATH=':memory:' injetado por vite.config.ts (test.env) — sem framework extra.
const donoId = criarUsuario({ username: 'teste_share_dono', pin: '123456' }).id;
const editorId = criarUsuario({ username: 'teste_share_editor', pin: '123456' }).id;
const administradorId = criarUsuario({ username: 'teste_share_admin', pin: '123456' }).id;
const semAcessoId = criarUsuario({ username: 'teste_share_estranho', pin: '123456' }).id;

describe('compartilharComUsuario / listarAcessos', () => {
	it('concede acesso por username e lista dono + coeditores com seus papeis', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro para compartilhar' });

		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_admin',
			papel: 'administrador'
		});

		const acessos = listarAcessos(registro.id, donoId);
		expect(acessos).toContainEqual({
			usuarioId: donoId,
			username: 'teste_share_dono',
			papel: 'dono'
		});
		expect(acessos).toContainEqual({
			usuarioId: editorId,
			username: 'teste_share_editor',
			papel: 'editor'
		});
		expect(acessos).toContainEqual({
			usuarioId: administradorId,
			username: 'teste_share_admin',
			papel: 'administrador'
		});
	});

	it('compartilhar de novo com papel diferente atualiza (idempotente, nao duplica)', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro promovido' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'administrador'
		});

		const acessos = listarAcessos(registro.id, donoId);
		const doEditor = acessos.filter((a) => a.usuarioId === editorId);
		expect(doEditor).toHaveLength(1);
		expect(doEditor[0].papel).toBe('administrador');
	});

	it('rejeita username inexistente, o proprio usuario e o dono', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro validacoes' });
		expect(() =>
			compartilharComUsuario(registro.id, donoId, {
				username: 'ninguem_com_este_nome',
				papel: 'editor'
			})
		).toThrow(UsuarioNaoEncontradoError);
		expect(() =>
			compartilharComUsuario(registro.id, donoId, { username: 'teste_share_dono', papel: 'editor' })
		).toThrow(AutoCompartilhamentoError);
	});

	it('administrador (nao dono) tambem pode compartilhar com outros', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro delegado' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_admin',
			papel: 'administrador'
		});
		compartilharComUsuario(registro.id, administradorId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		expect(listarAcessos(registro.id, donoId)).toContainEqual({
			usuarioId: editorId,
			username: 'teste_share_editor',
			papel: 'editor'
		});
	});

	it('rejeita compartilhar/listar de quem nao tem acesso ao Registro', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro alheio compartilhamento' });
		expect(() =>
			compartilharComUsuario(registro.id, semAcessoId, {
				username: 'teste_share_editor',
				papel: 'editor'
			})
		).toThrow(RegistroNaoEncontradoError);
		expect(() => listarAcessos(registro.id, semAcessoId)).toThrow(RegistroNaoEncontradoError);
	});

	it('editor nao pode compartilhar (precisa administrador+)', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro so editor' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		expect(() =>
			compartilharComUsuario(registro.id, editorId, {
				username: 'teste_share_admin',
				papel: 'editor'
			})
		).toThrow(RegistroNaoEncontradoError);
	});
});

describe('removerCompartilhamento', () => {
	it('dono/administrador removem qualquer coeditor', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro remocao' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		removerCompartilhamento(registro.id, donoId, editorId);
		expect(listarAcessos(registro.id, donoId).some((a) => a.usuarioId === editorId)).toBe(false);
	});

	it('coeditor sai sozinho (auto-remocao) sem precisar ser administrador', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro saida' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		removerCompartilhamento(registro.id, editorId, editorId);
		expect(obterRegistro(registro.id, editorId)).toBeNull();
	});

	it('editor nao pode remover o acesso de outro coeditor', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro remocao alheia' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_admin',
			papel: 'administrador'
		});
		expect(() => removerCompartilhamento(registro.id, editorId, administradorId)).toThrow(
			RegistroNaoEncontradoError
		);
	});
});

describe('hierarquia de permissao (dono > administrador > editor)', () => {
	it('editor le e edita conteudo, mas nao finaliza, exclui, nem ativa o link publico', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro hierarquia editor' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});

		expect(obterRegistro(registro.id, editorId)?.meuPapel).toBe('editor');
		expect(() => finalizarRegistro(registro.id, editorId)).toThrow(RegistroNaoEncontradoError);
		expect(() => ativarCompartilhamento(registro.id, editorId)).toThrow(RegistroNaoEncontradoError);
		expect(() => excluirRegistro(registro.id, editorId)).toThrow(RegistroNaoEncontradoError);
	});

	it('administrador tem paridade total: finaliza, ativa link publico e exclui', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro hierarquia admin' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_admin',
			papel: 'administrador'
		});

		expect(obterRegistro(registro.id, administradorId)?.meuPapel).toBe('administrador');
		const ativado = ativarCompartilhamento(registro.id, administradorId);
		expect(ativado.tokenCompartilhamento).toBeTruthy();
		const finalizado = finalizarRegistro(registro.id, administradorId);
		expect(finalizado.status).toBe('finalizado');
		excluirRegistro(registro.id, administradorId);
		expect(obterRegistro(registro.id, donoId)).toBeNull();
	});

	it('donoUsername aparece so para quem nao e o dono', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro donoUsername' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		expect(obterRegistro(registro.id, donoId)?.donoUsername).toBeNull();
		expect(obterRegistro(registro.id, editorId)?.donoUsername).toBe('teste_share_dono');
	});
});

describe('efeitos em atividades.ts e registros.ts (integracao)', () => {
	it('editor com acesso compartilhado cria Atividade no Registro do dono', () => {
		const registro = criarRegistro(donoId, { titulo: 'Registro colaborativo' });
		compartilharComUsuario(registro.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});
		const agenteDoEditor = criarAgente(editorId, { nome: 'Fulano Editor', tipo: 'pessoa' });

		const { atividade } = criarAtividade(editorId, registro.id, {
			tipo: 'criacao',
			agenteId: agenteDoEditor.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'dado_coletado.csv' }]
		});

		expect(atividade.registroId).toBe(registro.id);
		expect(() =>
			criarAtividade(semAcessoId, registro.id, {
				tipo: 'criacao',
				agenteId: agenteDoEditor.id,
				dataHora: new Date().toISOString(),
				entidadesUsadas: [],
				entidadesGeradas: [{ nome: 'nao_deveria_entrar.csv' }]
			})
		).toThrow(RegistroNaoEncontradoError);
	});

	it('listarRegistros do coeditor inclui Registros compartilhados, alem dos proprios', () => {
		const proprio = criarRegistro(editorId, { titulo: 'Registro proprio do editor' });
		const compartilhado = criarRegistro(donoId, { titulo: 'Registro compartilhado com editor' });
		compartilharComUsuario(compartilhado.id, donoId, {
			username: 'teste_share_editor',
			papel: 'editor'
		});

		const { items } = listarRegistros(editorId);
		const ids = items.map((r) => r.id);
		expect(ids).toContain(proprio.id);
		expect(ids).toContain(compartilhado.id);
		expect(items.find((r) => r.id === compartilhado.id)?.meuPapel).toBe('editor');
	});
});
