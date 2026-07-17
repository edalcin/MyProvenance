# Excluir registro

Excluir um Registro é uma ação definitiva — não existe lixeira nem desfazer.

## O que é e para que serve

`Excluir Registro` remove permanentemente o Registro e, em cascata, todas as suas Entidades e Atividades. A ação está disponível para o dono e para Administradores.

## Quando usar

Apenas quando você tem certeza de que o Registro (e tudo que ele documenta) não é mais necessário — por exemplo, um Registro de teste, ou um duplicado criado por engano. Para um Registro válido, prefira exportar antes de qualquer decisão irreversível.

## Passo a passo

1. No Registro, clique em `Excluir Registro`.
2. O navegador pede confirmação nativa (`window.confirm`) descrevendo que todas as Entidades e Atividades também serão removidas.
3. Ao confirmar, o Registro é removido imediatamente e some da lista `Registros`.

## Screenshot

![Botão Excluir Registro no Registro](/manual/pt/08-botao-excluir.png)

A caixa de confirmação nativa do navegador não é capturável em screenshot — ela pergunta algo como: _"Excluir o Registro "<título>"? Esta ação remove todas as Entidades e Atividades."_

> 🔗 **Padrão:** excluir remove o `prov:Bundle` inteiro e tudo que ele contém — não há equivalente PROV para "desfazer" essa operação, porque a proveniência deixa de existir.

> ⚠️ **Atenção:** ação irreversível. Exporte o JSON ou o relatório antes de excluir, caso queira manter algum registro do que existiu.

## Próximos passos

[Exemplo completo](/como-usar/09-exemplo-completo)
