<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { t } from '$lib/i18n/estado.svelte';

	let arquivo: File | null = $state(null);
	let inputEl: HTMLInputElement | undefined = $state();
	let restaurando = $state(false);

	function selecionar(event: Event) {
		arquivo = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}

	async function restaurar() {
		if (!arquivo || !confirm(t('admin.confirm.restore_backup'))) return;
		restaurando = true;
		try {
			const resposta = await fetch('/admin/restaurar', {
				method: 'POST',
				headers: { 'content-type': 'application/octet-stream' },
				body: arquivo
			});
			if (!resposta.ok) {
				const e = await resposta.json().catch(() => ({}));
				toast.error(t(e.message ?? 'error.generic'));
				return;
			}
			toast.success(t('admin.success.backup_restored'));
			arquivo = null;
			if (inputEl) inputEl.value = '';
		} finally {
			restaurando = false;
		}
	}
</script>

<div class="flex max-w-lg flex-col gap-6 py-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>{t('admin.backup.download_title')}</Card.Title>
			<Card.Description>{t('admin.backup.download_description')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button href="/admin/backup" download>
				<i class="bx bx-download"></i>
				{t('admin.backup.download_button')}
			</Button>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>{t('admin.backup.restore_title')}</Card.Title>
			<Card.Description>{t('admin.backup.restore_description')}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<div class="flex flex-wrap items-center gap-3">
				<input
					bind:this={inputEl}
					type="file"
					accept=".sqlite,.db,application/vnd.sqlite3,application/octet-stream"
					onchange={selecionar}
					class="hidden"
				/>
				<Button type="button" onclick={() => inputEl?.click()}>
					<i class="bx bx-folder-open"></i>
					{t('admin.backup.choose_file')}
				</Button>
				<span class="text-muted-foreground text-sm">
					{arquivo?.name ?? t('admin.backup.no_file_chosen')}
				</span>
			</div>
			<Button variant="destructive" disabled={!arquivo || restaurando} onclick={restaurar}>
				<i class="bx bx-upload"></i>
				{restaurando ? t('admin.backup.restoring') : t('admin.backup.restore_button')}
			</Button>
		</Card.Content>
	</Card.Root>
</div>
