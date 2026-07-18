# Finalizar

Finalizar transforma o Registro de um rascunho editável num documento histórico imutável.

## O que é e para que serve

O botão `Finalizar` muda o status do Registro de `Rascunho` para `Finalizado`. A partir daí, as Entidades e Atividades já registradas ficam travadas — não podem mais ser editadas nem excluídas, só é possível adicionar novas Atividades ao final da linhagem. `Título` e `Descrição` continuam editáveis normalmente.

## Quando usar

Quando a linhagem documentada até aquele ponto está correta e você quer garantir que ela não será reescrita depois — por exemplo, antes de citar o Registro num artigo ou de compartilhá-lo como referência oficial.

## Passo a passo

1. No Registro em `Rascunho`, clique em `Finalizar`.
2. O status muda de `Rascunho` para `Finalizado` (badge visível no topo do Registro).
3. A partir daqui, Atividades e Entidades existentes ficam somente leitura; novas Atividades ainda podem ser adicionadas.

## Screenshot

<!-- SCREENSHOT: adicione a imagem em manual/img/04-botao-finalizar.png -->
![Botão Finalizar no Registro em Rascunho](img/04-botao-finalizar.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/04-badge-finalizado.png -->
![Badge Finalizado após a ação](img/04-badge-finalizado.png)

> 🔗 **Padrão:** finalizar "congela" o `prov:Bundle` — o grafo de proveniência documentado até aquele ponto passa a ser tratado como registro histórico estável.

> ⚠️ **Atenção:** essa é uma decisão deliberada e sem volta — não existe botão para voltar a `Rascunho`. Exportar (JSON ou relatório) **não** finaliza o Registro automaticamente; finalizar é sempre uma ação explícita.

## Próximos passos

[Exportar JSON](05-exportar-json.md)
