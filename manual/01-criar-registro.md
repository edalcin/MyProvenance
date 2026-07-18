# Criar registro

Todo trabalho no MyProvenance começa criando um Registro de Proveniência — o container que vai reunir Entidades, Atividades e Agentes de uma linhagem.

## O que é e para que serve

Um Registro de Proveniência agrupa toda a linhagem de um conjunto de dados: da fonte original até os resultados de análise, com cada passo intermediário documentado como uma Atividade. Ele nasce em estado `Rascunho`, editável livremente, e pode depois ser `Finalizado` (ver [Finalizar](04-finalizar.md)).

## Quando usar

Sempre que você inicia o rastreamento de um novo conjunto de dados — uma nova coleta, um novo estudo, ou a documentação retroativa de um pipeline já existente.

## Passo a passo

1. Na página `Registros`, clique em `Novo Registro`.
2. No diálogo `Novo Registro de Proveniência`, preencha `Título` (obrigatório) e `Descrição` (opcional, editor de texto rico).
3. Clique em `Criar Registro`.
4. O Registro aparece na lista com o status `Rascunho`.

## Screenshot

<!-- SCREENSHOT: adicione a imagem em manual/img/01-lista-novo-registro.png -->
![Lista de Registros com o botão Novo Registro em destaque](img/01-lista-novo-registro.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/01-dialog-novo-registro.png -->
![Diálogo Novo Registro de Proveniência com título preenchido](img/01-dialog-novo-registro.png)

> 🔗 **Padrão:** criar o Registro cria o `prov:Bundle` que vai conter toda a linhagem — ainda vazio, sem Entidades nem Atividades.

> 💡 **Dica:** o `Título` pode ser editado depois a qualquer momento, mesmo após o Registro ser finalizado — ver [Editar Registro e Atividade](03-editar.md).

## Próximos passos

[Adicionar Atividade](02-adicionar-atividade.md)
