<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import AgentPicker from '$lib/components/agent-picker.svelte';
	import DynamicPairList from '$lib/components/dynamic-pair-list.svelte';
	import type { Agente, Atividade, Entidade, TipoAtividade } from '$lib/types';

	let {
		tipo,
		registroId,
		entidadesDisponiveis,
		onCriada
	}: {
		tipo: TipoAtividade;
		registroId: string;
		entidadesDisponiveis: Entidade[];
		onCriada: (resultado: {
			atividade: Atividade;
			entidadesGeradas: Entidade[];
			agente: Agente | null;
		}) => void;
	} = $props();

	function hojeLocal(): string {
		const d = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	/** "YYYY-MM-DD" -> ISO ao meio-dia local (evita virar o dia anterior/seguinte em fusos negativos/positivos ao reformatar). */
	function dataParaIso(dataStr: string): string {
		const [ano, mes, dia] = dataStr.split('-').map(Number);
		return new Date(ano, mes - 1, dia, 12).toISOString();
	}

	interface EntidadeGeradaForm {
		nome: string;
		descricao: string;
		formato: string;
		localizacao: string;
		licenca: string;
	}

	function entidadeGeradaVazia(): EntidadeGeradaForm {
		return { nome: '', descricao: '', formato: '', localizacao: '', licenca: '' };
	}

	/** Criacao/Transformacao exigem 1+; Analise comeca vazia (saida opcional). */
	function entidadesGeradasIniciais(): EntidadeGeradaForm[] {
		return tipo === 'analise' ? [] : [entidadeGeradaVazia()];
	}

	let agenteId = $state('');
	let agenteSelecionado: Agente | null = $state(null);
	let dataHora = $state(hojeLocal());
	let descricao = $state('');
	let entidadesUsadas: string[] = $state([]);

	// Criacao
	let local = $state('');
	let instrumento = $state('');

	// Transformacao / Analise
	let processo = $state('');
	let sistemaOperacional = $state('');
	let parametros: { a: string; b: string }[] = $state([]);
	let pacotes: { a: string; b: string }[] = $state([]);

	// Entidades geradas — Criacao/Transformacao exigem 1+, Analise aceita 0+ (varios artefatos de saida).
	let entidadesGeradas: EntidadeGeradaForm[] = $state(entidadesGeradasIniciais());

	let salvando = $state(false);

	const valido = $derived(
		agenteId &&
			dataHora &&
			(tipo === 'criacao' || entidadesUsadas.length > 0) &&
			entidadesGeradas.every((e) => e.nome.trim()) &&
			(tipo === 'analise' || entidadesGeradas.length > 0)
	);

	function alternarEntidade(id: string, marcado: boolean) {
		entidadesUsadas = marcado ? [...entidadesUsadas, id] : entidadesUsadas.filter((e) => e !== id);
	}

	function adicionarEntidadeGerada() {
		entidadesGeradas = [...entidadesGeradas, entidadeGeradaVazia()];
	}

	function removerEntidadeGerada(indice: number) {
		entidadesGeradas = entidadesGeradas.filter((_, i) => i !== indice);
	}

	function limparFormulario() {
		agenteId = '';
		agenteSelecionado = null;
		dataHora = hojeLocal();
		descricao = '';
		entidadesUsadas = [];
		local = '';
		instrumento = '';
		processo = '';
		sistemaOperacional = '';
		parametros = [];
		pacotes = [];
		entidadesGeradas = entidadesGeradasIniciais();
	}

	async function enviar(event: SubmitEvent) {
		event.preventDefault();
		if (!valido) return;
		salvando = true;
		try {
			const ambienteExecucao =
				tipo !== 'criacao' && (sistemaOperacional.trim() || pacotes.some((p) => p.a.trim()))
					? {
							sistemaOperacional: sistemaOperacional.trim() || undefined,
							pacotes: pacotes.filter((p) => p.a.trim()).map((p) => ({ nome: p.a, versao: p.b }))
						}
					: null;
			const corpo = {
				tipo,
				agenteId,
				// meio-dia local evita a data exibida "voltar" um dia ao formatar de volta em fuso negativo.
				dataHora: dataParaIso(dataHora),
				descricao: descricao || null,
				entidadesUsadas: tipo === 'criacao' ? [] : entidadesUsadas,
				local: tipo === 'criacao' ? local || null : null,
				instrumento: tipo === 'criacao' ? instrumento || null : null,
				processo: tipo !== 'criacao' ? processo || null : null,
				parametros:
					tipo !== 'criacao' && parametros.some((p) => p.a.trim())
						? parametros.filter((p) => p.a.trim()).map((p) => ({ chave: p.a, valor: p.b }))
						: null,
				ambienteExecucao,
				entidadesGeradas: entidadesGeradas
					.filter((e) => e.nome.trim())
					.map((e) => ({
						nome: e.nome,
						descricao: e.descricao || null,
						formato: e.formato || null,
						localizacao: e.localizacao || null,
						licenca: e.licenca || null
					}))
			};
			const resposta = await fetch(`/registros/${registroId}/atividades`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(corpo)
			});
			if (!resposta.ok) {
				const erro = await resposta.json().catch(() => ({ message: 'Erro ao criar Atividade.' }));
				toast.error(erro.message ?? 'Erro ao criar Atividade.');
				return;
			}
			const resultado = await resposta.json();
			onCriada({ ...resultado, agente: agenteSelecionado });
			toast.success('Atividade adicionada.');
			limparFormulario();
		} finally {
			salvando = false;
		}
	}
</script>

<form class="flex flex-col gap-4" onsubmit={enviar}>
	<div class="grid grid-cols-2 gap-4">
		<div class="flex flex-col gap-1.5">
			<Label>Agente</Label>
			<AgentPicker bind:value={agenteId} onAgente={(a) => (agenteSelecionado = a)} />
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="dataHora-{tipo}">Data</Label>
			<Input id="dataHora-{tipo}" type="date" bind:value={dataHora} required />
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
		<Label for="descricao-{tipo}">Descricao</Label>
		<Textarea
			id="descricao-{tipo}"
			bind:value={descricao}
			placeholder="O que aconteceu…"
			rows={2}
		/>
	</div>

	{#if tipo === 'criacao'}
		<div class="grid grid-cols-2 gap-4">
			<div class="flex flex-col gap-1.5">
				<Label for="local-{tipo}">Local</Label>
				<Input id="local-{tipo}" bind:value={local} placeholder="Coordenadas ou local" />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="instrumento-{tipo}">Ferramenta ou Software</Label>
				<Input
					id="instrumento-{tipo}"
					bind:value={instrumento}
					placeholder="Marca/modelo ou nome do software"
				/>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-1.5">
			<Label>Entidades usadas</Label>
			{#if entidadesDisponiveis.length === 0}
				<p class="text-muted-foreground text-xs">
					Nenhuma Entidade disponivel ainda — crie uma via Criacao primeiro.
				</p>
			{:else}
				<div
					class="border-input flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border p-3"
				>
					{#each entidadesDisponiveis as entidade (entidade.id)}
						<label class="flex items-center gap-2 text-sm">
							<Checkbox
								checked={entidadesUsadas.includes(entidade.id)}
								onCheckedChange={(marcado) => alternarEntidade(entidade.id, marcado === true)}
							/>
							{entidade.nome}
							{#if entidade.formato}<span class="text-muted-foreground">({entidade.formato})</span
								>{/if}
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="processo-{tipo}">Processo</Label>
			<Textarea
				id="processo-{tipo}"
				bind:value={processo}
				placeholder="Script, codigo, passos…"
				rows={3}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label>Parametros</Label>
			<DynamicPairList
				bind:itens={parametros}
				rotuloA="Chave"
				rotuloB="Valor"
				rotuloAdicionar="Adicionar parametro"
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="sistemaOperacional-{tipo}">Ambiente de execucao — sistema operacional</Label>
			<Input
				id="sistemaOperacional-{tipo}"
				bind:value={sistemaOperacional}
				placeholder="Ex.: Ubuntu 24.04"
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label>Pacotes</Label>
			<DynamicPairList
				bind:itens={pacotes}
				rotuloA="Nome"
				rotuloB="Versao"
				rotuloAdicionar="Adicionar pacote"
			/>
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		<Label>
			Entidades geradas
			{#if tipo === 'analise'}
				<span class="text-muted-foreground font-normal">(opcional)</span>
			{/if}
		</Label>
		{#each entidadesGeradas as entidadeGerada, indice (indice)}
			<div class="border-input flex flex-col gap-4 rounded-md border p-3">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium">Entidade gerada {indice + 1}</p>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removerEntidadeGerada(indice)}
						aria-label="Remover Entidade gerada"
					>
						<i class="bx bx-trash"></i>
					</Button>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="nomeGerada-{tipo}-{indice}">Nome</Label>
					<Input
						id="nomeGerada-{tipo}-{indice}"
						bind:value={entidadeGerada.nome}
						required
						maxlength={300}
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<Label for="formatoGerada-{tipo}-{indice}">Formato</Label>
						<Input
							id="formatoGerada-{tipo}-{indice}"
							bind:value={entidadeGerada.formato}
							placeholder="CSV, JSON…"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="licencaGerada-{tipo}-{indice}">Licenca</Label>
						<Input
							id="licencaGerada-{tipo}-{indice}"
							bind:value={entidadeGerada.licenca}
							placeholder="CC-BY 4.0…"
						/>
					</div>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="localizacaoGerada-{tipo}-{indice}">Localizacao</Label>
					<Input
						id="localizacaoGerada-{tipo}-{indice}"
						bind:value={entidadeGerada.localizacao}
						placeholder="URL ou caminho"
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="descricaoGerada-{tipo}-{indice}">Descricao</Label>
					<Textarea
						id="descricaoGerada-{tipo}-{indice}"
						bind:value={entidadeGerada.descricao}
						rows={2}
					/>
				</div>
			</div>
		{/each}
		<Button type="button" variant="outline" size="sm" onclick={adicionarEntidadeGerada}>
			<i class="bx bx-plus"></i> Adicionar Entidade gerada
		</Button>
	</div>

	<Button type="submit" disabled={!valido || salvando}>
		{salvando ? 'Salvando…' : 'Adicionar Atividade'}
	</Button>
</form>
