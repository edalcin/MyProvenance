import { describe, expect, it } from 'vitest';
import {
	ativarCompartilhamento,
	atualizarRegistro,
	alterarDirecaoDiagrama,
	criarRegistro,
	desativarCompartilhamento,
	finalizarRegistro,
	obterRegistroDetalhado,
	obterRegistroDetalhadoPorToken,
	RegistroNaoEncontradoError
} from './registros';
import { compartilharComUsuario } from './compartilhamentos';
import { criarAgente } from './agentes';
import { criarAtividade } from './atividades';
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

describe('alterarDirecaoDiagrama', () => {
	it('persiste a orientacao escolhida e rejeita Registro alheio/inexistente', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro direcao' });
		expect(registro.direcaoDiagrama).toBe('TD');

		const atualizado = alterarDirecaoDiagrama(registro.id, usuarioId, 'LR');
		expect(atualizado.direcaoDiagrama).toBe('LR');

		const outroUsuarioId = criarUsuario({ username: 'outro_teste_direcao', pin: '654321' }).id;
		expect(() => alterarDirecaoDiagrama(registro.id, outroUsuarioId, 'TD')).toThrow(
			RegistroNaoEncontradoError
		);
	});
});

describe('compartilhamento publico (ativar/desativar/ler por token)', () => {
	it('ativa gera um token estavel (idempotente) e o link publico le so-leitura', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro compartilhado' });
		expect(registro.tokenCompartilhamento).toBeNull();

		const ativado = ativarCompartilhamento(registro.id, usuarioId);
		expect(ativado.tokenCompartilhamento).toBeTruthy();

		const reativado = ativarCompartilhamento(registro.id, usuarioId);
		expect(reativado.tokenCompartilhamento).toBe(ativado.tokenCompartilhamento);

		const detalhe = obterRegistroDetalhadoPorToken(ativado.tokenCompartilhamento!);
		expect(detalhe?.registro.id).toBe(registro.id);
	});

	it('desativa remove o token e o link publico deixa de resolver', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro descompartilhado' });
		const ativado = ativarCompartilhamento(registro.id, usuarioId);
		const token = ativado.tokenCompartilhamento!;

		const desativado = desativarCompartilhamento(registro.id, usuarioId);
		expect(desativado.tokenCompartilhamento).toBeNull();
		expect(obterRegistroDetalhadoPorToken(token)).toBeNull();
	});

	it('token invalido ou registro sem compartilhamento nao resolve nada', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro nunca compartilhado' });
		expect(obterRegistroDetalhadoPorToken('token-inexistente')).toBeNull();
		expect(registro.tokenCompartilhamento).toBeNull();
	});

	it('rejeita ativar/desativar compartilhamento de Registro alheio', () => {
		const registro = criarRegistro(usuarioId, { titulo: 'Registro alheio compartilhamento' });
		const outroUsuarioId = criarUsuario({ username: 'outro_teste_share', pin: '654321' }).id;
		expect(() => ativarCompartilhamento(registro.id, outroUsuarioId)).toThrow(
			RegistroNaoEncontradoError
		);
		expect(() => desativarCompartilhamento(registro.id, outroUsuarioId)).toThrow(
			RegistroNaoEncontradoError
		);
	});
});

describe('deOutraConta em agentesEnvolvidos (Registro compartilhado)', () => {
	it('sinaliza Agentes do outro coeditor, mas nao os proprios, na visao de cada usuario', () => {
		const dono = criarUsuario({ username: 'dono_agentes_registro', pin: '123456' }).id;
		const editor = criarUsuario({ username: 'editor_agentes_registro', pin: '654321' }).id;
		const registro = criarRegistro(dono, { titulo: 'Registro com dois coeditores' });
		compartilharComUsuario(registro.id, dono, { username: 'editor_agentes_registro', papel: 'editor' });

		const agenteDono = criarAgente(dono, { nome: 'Agente do Dono', tipo: 'pessoa' });
		const agenteEditor = criarAgente(editor, { nome: 'Agente do Editor', tipo: 'pessoa' });
		criarAtividade(dono, registro.id, {
			tipo: 'criacao',
			agenteId: agenteDono.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'dado.csv' }]
		});
		criarAtividade(editor, registro.id, {
			tipo: 'criacao',
			agenteId: agenteEditor.id,
			dataHora: new Date().toISOString(),
			entidadesUsadas: [],
			entidadesGeradas: [{ nome: 'outro.csv' }]
		});

		const visaoDono = obterRegistroDetalhado(registro.id, dono)!;
		const porIdDono = new Map(visaoDono.agentesEnvolvidos.map((a) => [a.id, a]));
		expect(porIdDono.get(agenteDono.id)?.deOutraConta).toBe(false);
		expect(porIdDono.get(agenteDono.id)?.donoUsername).toBeFalsy();
		expect(porIdDono.get(agenteEditor.id)?.deOutraConta).toBe(true);
		expect(porIdDono.get(agenteEditor.id)?.donoUsername).toBe('editor_agentes_registro');

		const visaoEditor = obterRegistroDetalhado(registro.id, editor)!;
		const porIdEditor = new Map(visaoEditor.agentesEnvolvidos.map((a) => [a.id, a]));
		expect(porIdEditor.get(agenteEditor.id)?.deOutraConta).toBe(false);
		expect(porIdEditor.get(agenteEditor.id)?.donoUsername).toBeFalsy();
		expect(porIdEditor.get(agenteDono.id)?.deOutraConta).toBe(true);
		expect(porIdEditor.get(agenteDono.id)?.donoUsername).toBe('dono_agentes_registro');
	});
});
