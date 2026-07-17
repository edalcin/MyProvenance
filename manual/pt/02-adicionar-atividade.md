# Adicionar Atividade

Uma Atividade é o que transforma um Registro vazio numa linhagem real: ela conecta Agentes, Entidades de entrada e Entidades de saída.

## O que é e para que serve

Toda ação que produz ou transforma dados — coletar, limpar, analisar — é registrada como uma Atividade de um dos três tipos: `Criação`, `Transformação` ou `Análise`. Cada Atividade é executada por um `Agente` e pode declarar as Entidades que usa e as que gera.

## Quando usar

Toda vez que um novo dado entra na linhagem (Criação) ou um dado existente é processado (Transformação/Análise).

## Passo a passo

1. No Registro, clique em `Adicionar Atividade`.
2. Escolha o tipo na aba: `Criação`, `Transformação` ou `Análise`.
3. Selecione o `Agente` responsável — o campo tem busca com autocomplete; se o Agente não existir ainda, digite o nome e clique em `Criar "<nome>"` para cadastrá-lo sem sair do formulário.
4. Preencha `Data` e `Descrição`.
5. Campos específicos por tipo:
   - **Criação**: `Local` e `Ferramenta ou Software` (de onde e com o quê o dado foi originado).
   - **Transformação/Análise**: marque as `Entidades usadas`; preencha `Processo` (o que foi feito), parâmetros (`Chave`/`Valor`) e `Ambiente de execução — sistema operacional`.
6. Em `Entidades geradas`, clique em `Adicionar Entidade gerada` para cada saída, preenchendo `Nome`, `Formato`, `Licença`, `Localização` e `Descrição`.
7. Para cada Entidade gerada por Transformação/Análise, escolha a `Relação com a origem`: `Nenhuma`, `Derivação` ou `Revisão` (esta última pede `Revisão de`, apontando para qual Entidade usada ela substitui).
8. Clique em `Adicionar Atividade` para salvar.

## Cardinalidade por tipo

- **Criação** — gera 1 ou mais Entidades; não usa nenhuma Entidade existente.
- **Transformação** — usa 1 ou mais Entidades; gera 1 ou mais Entidades.
- **Análise** — usa 1 ou mais Entidades; gera 0 ou mais Entidades (uma Análise pode existir só para verificar dados, sem produzir saída nova).

## Screenshot

![Botão Adicionar Atividade no Registro](/manual/pt/02-botao-adicionar-atividade.png)

![Formulário de Criação preenchido](/manual/pt/02-form-criacao.png)

![Formulário de Transformação com parâmetros e ambiente de execução](/manual/pt/02-form-transformacao.png)

![Formulário de Análise usando Entidades existentes](/manual/pt/02-form-analise.png)

![Seletor de Agente com autocomplete e opção de criar novo](/manual/pt/02-seletor-agente.png)

> 🔗 **Padrão:** a Atividade é um `prov:Activity`; usar uma Entidade existente é `prov:used`; gerar uma nova é `prov:wasGeneratedBy`; o Agente responsável é `prov:wasAssociatedWith`. `Derivação` mapeia para `prov:wasDerivedFrom`, `Revisão` para `prov:wasRevisionOf`.

> 💡 **Dica:** mais de uma Entidade pode ser gerada pela mesma Atividade — útil quando um único processo produz vários arquivos de saída (ex.: uma tabela e um gráfico).

> ⚠️ **Atenção:** depois que o Registro é finalizado, Atividades existentes não podem mais ser editadas ou excluídas — só novas Atividades podem ser adicionadas. Ver [Finalizar](/como-usar/04-finalizar).

## Próximos passos

[Editar Registro e Atividade](/como-usar/03-editar)
