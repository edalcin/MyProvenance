# Exportar Relatório .md

O relatório em Markdown é a versão legível para humanos do Registro — pronta para anexar a um artigo, um repositório ou um e-mail.

## O que é e para que serve

`Exportar relatório .md` gera um arquivo `<slug-do-titulo>-provenance.md` contendo um cabeçalho com os metadados do Registro, um diagrama Mermaid da linhagem completa e tabelas de Entidades, Atividades e Agentes.

## Quando usar

Quando você precisa comunicar a proveniência de um dataset para alguém que não vai acessar o MyProvenance diretamente — revisores, colaboradores, ou como anexo de um repositório de dados.

## Passo a passo

1. No Registro, clique em `Exportar relatório .md`.
2. O navegador baixa o arquivo `.md`, já com o diagrama na orientação (horizontal/vertical) selecionada na tela naquele momento.
3. Abra o arquivo em qualquer visualizador de Markdown para conferir o resultado renderizado.

## Screenshot

<!-- SCREENSHOT: adicione a imagem em manual/img/06-botao-exportar-md.png -->
![Botão Exportar relatório .md no Registro](img/06-botao-exportar-md.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/06-relatorio-exemplo.png -->
![Relatório .md exportado, renderizado, com diagrama e tabelas](img/06-relatorio-exemplo.png)

> 🔗 **Padrão:** o diagrama do relatório desenha as mesmas relações do mapeamento PROV — Entidades, Atividades, `prov:used`/`prov:wasGeneratedBy` e as relações de origem (`Derivação`/`Revisão`).

> 💡 **Dica:** a orientação do diagrama é alternável pelo botão `TD`/`LR` acima dele, na tela do Registro — a exportação respeita a orientação escolhida no momento do clique.

## Próximos passos

[Compartilhar](07-compartilhar.md)
