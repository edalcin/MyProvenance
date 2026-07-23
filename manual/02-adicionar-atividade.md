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
5. Marque as `Entidades usadas` (Transformação/Análise: obrigatório, 1 ou mais; Criação: opcional — deixe vazio quando o dado é a origem da linhagem, ou marque Entidades existentes se a Criação também partiu de alguma). Cada Entidade na lista mostra entre parênteses o tipo e a data da Atividade que a gerou — use essa informação para diferenciar Entidades com o mesmo nome (ex.: revisões sucessivas do mesmo arquivo). O seletor `Revisão de` (passo 8) mostra a mesma informação.
6. Campos específicos por tipo:
    - **Criação**: `Local` e `Ferramenta ou Software` (de onde e com o quê o dado foi originado).
    - **Transformação/Análise**: `Processo` (o que foi feito), parâmetros (`Chave`/`Valor`) e `Ambiente de execução — sistema operacional`.
7. Em `Entidades geradas`, clique em `Adicionar Entidade gerada` para cada saída, preenchendo `Nome`, `Formato`, `Licença`, `Localização` e `Descrição`.
8. Se houver `Entidades usadas` marcadas (em qualquer tipo, inclusive Criação com entrada opcional), cada Entidade gerada ganha o seletor `Relação com a origem`: `Nenhuma`, `Derivação` ou `Revisão` (esta última pede `Revisão de`, apontando para qual Entidade usada ela substitui). `Derivação` sempre representa uma Entidade com identidade nova — para manter o mesmo nome do arquivo transformado, use `Revisão`.
9. Quando a Relação é `Revisão` e a Entidade revisada já foi escolhida em `Revisão de`, aparece o checkbox `Mesmo nome da Entidade revisada` ao lado do campo `Nome` — marque para copiar o nome da Entidade revisada e travar o campo (somente leitura) enquanto ativo; desmarque para voltar a digitar um nome diferente.
10. Clique em `Adicionar Atividade` para salvar.

## Cardinalidade por tipo

- **Criação** — gera 1 ou mais Entidades; pode opcionalmente usar 0 ou mais Entidades existentes (sem entrada, é a origem da linhagem).
- **Transformação** — usa 1 ou mais Entidades; gera 1 ou mais Entidades.
- **Análise** — usa 1 ou mais Entidades; gera 0 ou mais Entidades (uma Análise pode existir só para verificar dados, sem produzir saída nova).

## Screenshot

<!-- SCREENSHOT: adicione a imagem em manual/img/02-botao-adicionar-atividade.png -->
![Botão Adicionar Atividade no Registro](img/02-botao-adicionar-atividade.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/02-form-criacao.png -->
![Formulário de Criação preenchido](img/02-form-criacao.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/02-form-transformacao.png -->
![Formulário de Transformação com parâmetros e ambiente de execução](img/02-form-transformacao.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/02-form-analise.png -->
![Formulário de Análise usando Entidades existentes](img/02-form-analise.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/02-checkbox-mesmo-nome.png -->
![Checkbox "Mesmo nome da Entidade revisada" travando o campo Nome](img/02-checkbox-mesmo-nome.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/02-seletor-agente.png -->
![Seletor de Agente com autocomplete e opção de criar novo](img/02-seletor-agente.png)

> 🔗 **Padrão:** a Atividade é um `prov:Activity`; usar uma Entidade existente é `prov:used`; gerar uma nova é `prov:wasGeneratedBy`; o Agente responsável é `prov:wasAssociatedWith`. `Derivação` mapeia para `prov:wasDerivedFrom`, `Revisão` para `prov:wasRevisionOf`.

> 💡 **Dica:** mais de uma Entidade pode ser gerada pela mesma Atividade — útil quando um único processo produz vários arquivos de saída (ex.: uma tabela e um gráfico).

> 💡 **Dica:** use `Mesmo nome da Entidade revisada` quando a Transformação altera o arquivo no lugar (mesmo nome, conteúdo novo) — evita digitar o nome de novo e mantém Nome e `Revisão de` sempre em sincronia; se depois trocar a Entidade revisada com o checkbox marcado, o Nome acompanha automaticamente. Esse checkbox só existe para `Revisão`: `Derivação` sempre gera um nome de Entidade novo/diferente, por representar uma identidade distinta da origem (ex.: um subconjunto filtrado).

> ⚠️ **Atenção:** depois que o Registro é finalizado, Atividades existentes não podem mais ser editadas ou excluídas — só novas Atividades podem ser adicionadas. Ver [Finalizar](04-finalizar.md).

## Próximos passos

[Editar Registro e Atividade](03-editar.md)
