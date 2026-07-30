import { describe, expect, it } from 'vitest';
import {
	listarUsuarios,
	listarTodosRegistros,
	listarTodosAgentes,
	listarTodosCompartilhamentos,
	atualizarRegistroAdmin,
	excluirUsuario
} from './admin';
import { criarUsuario } from './usuarios';
import { criarRegistro } from './registros';
import { criarAgente } from './agentes';
import { compartilharComUsuario } from './compartilhamentos';

describe('excluirUsuario (cascata)', () => {
	it('remove usuario, seus Registros, Agentes e compartilhamentos concedidos', () => {
		const a = criarUsuario({ username: 'teste_admin_a', pin: '123456' });
		const b = criarUsuario({ username: 'teste_admin_b', pin: '123456' });
		const registro = criarRegistro(a.id, { titulo: 'Registro de A' });
		const agente = criarAgente(a.id, { nome: 'Agente de A', tipo: 'pessoa' });
		compartilharComUsuario(registro.id, a.id, { username: b.username, papel: 'editor' });

		excluirUsuario(a.id);

		expect(listarUsuarios().some((u) => u.id === a.id)).toBe(false);
		expect(listarTodosRegistros().some((r) => r.id === registro.id)).toBe(false);
		expect(listarTodosAgentes().some((ag) => ag.id === agente.id)).toBe(false);
		expect(listarTodosCompartilhamentos().some((c) => c.registroId === registro.id)).toBe(false);
	});
});

describe('atualizarRegistroAdmin', () => {
	it('finalizar seta finalizadoEm; voltar a rascunho limpa finalizadoEm', () => {
		const dono = criarUsuario({ username: 'teste_admin_dono', pin: '123456' });
		const registro = criarRegistro(dono.id, { titulo: 'Registro editavel' });

		const finalizado = atualizarRegistroAdmin(registro.id, {
			titulo: registro.titulo,
			descricao: null,
			status: 'finalizado',
			donoId: dono.id
		});
		expect(finalizado.status).toBe('finalizado');
		expect(finalizado.finalizadoEm).not.toBeNull();

		const voltouRascunho = atualizarRegistroAdmin(registro.id, {
			titulo: registro.titulo,
			descricao: null,
			status: 'rascunho',
			donoId: dono.id
		});
		expect(voltouRascunho.status).toBe('rascunho');
		expect(voltouRascunho.finalizadoEm).toBeNull();
	});

	it('reatribui o dono (donoId) e permite tornar o registro anonimo (null)', () => {
		const donoOriginal = criarUsuario({ username: 'teste_admin_dono_a', pin: '123456' });
		const novoDono = criarUsuario({ username: 'teste_admin_dono_b', pin: '123456' });
		const registro = criarRegistro(donoOriginal.id, { titulo: 'Registro para reatribuir' });

		const reatribuido = atualizarRegistroAdmin(registro.id, {
			titulo: registro.titulo,
			descricao: null,
			status: 'rascunho',
			donoId: novoDono.id
		});
		expect(reatribuido.donoId).toBe(novoDono.id);
		expect(reatribuido.donoUsername).toBe('teste_admin_dono_b');

		const anonimizado = atualizarRegistroAdmin(registro.id, {
			titulo: registro.titulo,
			descricao: null,
			status: 'rascunho',
			donoId: null
		});
		expect(anonimizado.donoId).toBeNull();
		expect(anonimizado.donoUsername).toBeNull();
	});
});
