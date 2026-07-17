# Editar Registro e Atividade

Nem tudo num Registro é imutável — mas o que pode ser editado muda conforme o status do Registro e o tipo de dado.

## O que é e para que serve

`Título` e `Descrição` do Registro são metadados e permanecem editáveis mesmo depois de `Finalizado`. Já Atividades (e as Entidades que elas geraram) só podem ser editadas ou excluídas enquanto o Registro está em `Rascunho` — depois de finalizado, o histórico vira somente leitura.

## Quando usar

Para corrigir um título digitado errado, complementar uma descrição, ou consertar um dado de Atividade lançado incorretamente antes de finalizar o Registro.

## Passo a passo

1. No Registro, clique em `Editar` para alterar `Título`/`Descrição` — permitido em qualquer status.
2. Para editar uma Atividade, use o ícone de edição (`Editar Atividade`) na lista de Atividades — disponível apenas enquanto o Registro está em `Rascunho`.
3. No formulário de edição, o tipo da Atividade (`Criação`/`Transformação`/`Análise`) aparece fixo — não é possível trocar o tipo depois de criada.
4. Para excluir uma Atividade, use o ícone `Excluir Atividade` — também só em `Rascunho`; a confirmação nativa do navegador avisa que as Entidades geradas por ela serão removidas junto, se não estiverem em uso por outra Atividade.

## Screenshot

![Botão Editar no cabeçalho do Registro](/manual/pt/03-editar-registro.png)

![Formulário de edição de uma Atividade, com o tipo fixo](/manual/pt/03-editar-atividade.png)

> 🔗 **Padrão:** editar título/descrição não altera o grafo PROV do Registro (`prov:Bundle`); editar uma Atividade em rascunho corrige o `prov:Activity` antes dele ser considerado definitivo.

> ⚠️ **Atenção:** após `Finalizar`, não é mais possível editar ou excluir Atividades e Entidades existentes — apenas adicionar novas. Não há como reverter essa trava.

## Próximos passos

[Finalizar](/como-usar/04-finalizar)
