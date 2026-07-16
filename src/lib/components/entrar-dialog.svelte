<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n/estado.svelte';

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
				const erro = await resposta.json().catch(() => ({ message: 'error.sign_in_failed' }));
				toast.error(t(erro.message ?? 'error.sign_in_failed'));
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
			<Button {...props} variant="ghost" size="sm"
				><i class="bx bx-log-in"></i> {t('account.sign_in_button')}</Button
			>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>{t('account.sign_in_button')}</Dialog.Title>
			<Dialog.Description>{t('account.sign_in_description')}</Dialog.Description>
		</Dialog.Header>
		<form class="flex flex-col gap-4" onsubmit={entrar}>
			<div class="flex flex-col gap-1.5">
				<Label for="entrar-username">{t('common.username_label')}</Label>
				<Input id="entrar-username" bind:value={username} required autocomplete="username" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="entrar-pin">{t('common.pin_label')}</Label>
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
					{entrando ? t('account.signing_in') : t('account.sign_in_button')}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
