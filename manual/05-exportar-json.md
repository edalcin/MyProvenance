# Exportar JSON

O JSON exportado é a cópia completa e portátil de um Registro — o formato de backup e de continuidade entre sessões.

## O que é e para que serve

`Exportar JSON` baixa um arquivo com todo o conteúdo do Registro: Título, Descrição, Entidades, Atividades e Agentes envolvidos. Os nomes dos campos seguem o glossário do domínio, em português.

## Quando usar

Para guardar uma cópia de segurança, migrar um Registro entre instâncias, ou — se você usa o MyProvenance sem Conta — como a única forma de levar seus dados de uma sessão de navegador para outra (o modo anônimo não persiste nada no servidor).

## Passo a passo

1. No Registro, clique em `Exportar JSON`.
2. O navegador baixa um arquivo `.json` com o conteúdo completo do Registro naquele momento.
3. Disponível em qualquer status (`Rascunho` ou `Finalizado`).

## Screenshot

<!-- SCREENSHOT: adicione a imagem em manual/img/05-botao-exportar-json.png -->
![Botão Exportar JSON no Registro](img/05-botao-exportar-json.png)

> 🔗 **Padrão:** o JSON exportado é uma serialização direta do `prov:Bundle` e seu conteúdo — não é PROV-JSON formal, mas cobre os mesmos elementos (Entidades, Atividades, Agentes e as relações entre eles).

> 💡 **Dica:** exportar nunca altera o Registro — não muda o status nem trava nada. É sempre uma operação de leitura, sem efeito colateral.

## Próximos passos

[Exportar Relatório .md](06-exportar-relatorio-md.md)
