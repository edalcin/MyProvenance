<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';

	let aberto = $state(false);
	let username = $state('');
	let pin = $state('');
	let entrando = $state(false);

	const valido = $derived(username.trim().length >= 3 && /^\d{6}$/.test(pin));

	async function entrar(event: SubmitEvent) {
		event.preventDefault();
		if (!valido) return;
		entrando = true;
		try {
			const resposta = await fetch('/auth/entrar', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), pin })
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({ message: 'Erro ao entrar.' }));
				toast.error(erro.message ?? 'Erro ao entrar.');
				return;
			}
			// Recarrega para os loads do servidor (agora autenticados) buscarem os dados reais.
			window.location.reload();
		} finally {
			entrando = false;
		}
	}
</script>

<Dialog.Root bind:open={aberto}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm"><i class="bx bx-log-in"></i> Entrar</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Entrar</Dialog.Title>
			<Dialog.Description
				>Acesse seus Registros e Agentes salvos nesta instância.</Dialog.Description
			>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={entrar}>
			<div class="flex flex-col gap-1.5">
				<Label for="entrar-username">Usuário</Label>
				<Input id="entrar-username" bind:value={username} required autocomplete="username" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="entrar-pin">PIN (6 dígitos)</Label>
				<Input
					id="entrar-pin"
					type="password"
					inputmode="numeric"
					pattern={'\\d{6}'}
					maxlength={6}
					bind:value={pin}
					required
					autocomplete="current-password"
				/>
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={entrando || !valido}>
					{entrando ? 'Entrando…' : 'Entrar'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
