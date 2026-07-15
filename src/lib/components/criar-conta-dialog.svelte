<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { sessaoAnonima } from '$lib/client/sessao-anonima.svelte';
	import { usuarioAtual } from '$lib/client/usuario-atual.svelte';
	import { gerarJsonExportado } from '$lib/export';
	import * as dadosApi from '$lib/client/dados';

	let aberto = $state(false);
	let username = $state('');
	let pin = $state('');
	let confirmarPin = $state('');
	let criando = $state(false);

	const valido = $derived(
		username.trim().length >= 3 && /^\d{6}$/.test(pin) && pin === confirmarPin
	);

	/** Migra tudo que estava na sessao anonima pra conta recem-criada (ja autenticada). */
	async function migrarSessaoAnonima(): Promise<void> {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- lookup local, descartado no fim da funcao.
		const agentesMigrados = new Set<string>();
		for (const registro of sessaoAnonima.registros) {
			const detalhe = sessaoAnonima.obterRegistroDetalhado(registro.id);
			if (!detalhe) continue;
			await dadosApi.importarRegistro(gerarJsonExportado(detalhe));
			for (const agente of detalhe.agentesEnvolvidos) agentesMigrados.add(agente.id);
		}
		// Agentes cadastrados mas ainda nao usados em nenhuma Atividade — o import acima so
		// carrega agentesEnvolvidos por Registro, entao precisam ser criados a parte.
		for (const agente of sessaoAnonima.agentes) {
			if (!agentesMigrados.has(agente.id)) {
				await dadosApi.criarAgente(agente);
			}
		}
		sessaoAnonima.limparSessao();
	}

	async function criarConta(event: SubmitEvent) {
		event.preventDefault();
		if (!valido) return;
		criando = true;
		try {
			const resposta = await fetch('/auth/registrar', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), pin })
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({ message: 'Erro ao criar conta.' }));
				toast.error(erro.message ?? 'Erro ao criar conta.');
				return;
			}
			// dados.ts decide fetch-vs-local por usuarioAtual — sem isto, a migracao abaixo ainda
			// rodaria contra a propria sessao anonima (no-op seguido de limparSessao).
			usuarioAtual.definir(await resposta.json());
			await migrarSessaoAnonima();
			toast.success('Conta criada — seus dados foram salvos.');
			window.location.reload();
		} catch {
			toast.error(
				'Conta criada, mas houve erro ao migrar os dados locais. Tente entrar e importar o JSON manualmente.'
			);
		} finally {
			criando = false;
		}
	}
</script>

<Dialog.Root bind:open={aberto}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} size="sm"><i class="bx bx-user-plus"></i> Criar conta</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Criar conta</Dialog.Title>
			<Dialog.Description>
				Salva automaticamente seus Registros e Agentes nesta instância. Sem recuperação de PIN —
				anote em lugar seguro.
			</Dialog.Description>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={criarConta}>
			<div class="flex flex-col gap-1.5">
				<Label for="conta-username">Usuário</Label>
				<Input id="conta-username" bind:value={username} required autocomplete="username" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="conta-pin">PIN (6 dígitos)</Label>
				<Input
					id="conta-pin"
					type="password"
					inputmode="numeric"
					pattern={'\\d{6}'}
					maxlength={6}
					bind:value={pin}
					required
					autocomplete="new-password"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="conta-confirmar-pin">Confirmar PIN</Label>
				<Input
					id="conta-confirmar-pin"
					type="password"
					inputmode="numeric"
					pattern={'\\d{6}'}
					maxlength={6}
					bind:value={confirmarPin}
					required
					autocomplete="new-password"
				/>
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={criando || !valido}>
					{criando ? 'Criando…' : 'Criar conta'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
