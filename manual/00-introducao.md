# Introdução

O MyProvenance registra a proveniência de dados de biodiversidade: de onde vieram, quem os produziu, e por quais transformações e análises passaram até o resultado que você cita num artigo ou relatório.

<!-- SCREENSHOT: adicione a imagem em manual/img/00-diagrama-exemplo.png -->
![Diagrama de proveniência gerado a partir do exemplo completo deste manual](img/00-diagrama-exemplo.png)

## Por que registrar proveniência

- **Reprodutibilidade.** Uma Análise sem o registro de qual Entidade ela usou e qual Processo aplicou não pode ser refeita nem conferida.
- **Confiança.** Quem lê um resultado precisa saber quem o gerou (Agente), com quê (Ferramenta ou Software) e quando.
- **Rastreabilidade.** Um dado suspeito deve poder ser rastreado até a planilha crua e a atividade de coleta que o originou.
- **Atribuição.** Cada Entidade e Atividade fica associada a um Agente — pessoa, instituição ou software — preservando o crédito.
- **Exigências de periódicos e financiadores.** Declarações de disponibilidade e proveniência de dados são cada vez mais exigidas na submissão de artigos e relatórios de projeto.

## O que significa ser compatível com W3C PROV

O [W3C PROV](https://www.w3.org/TR/prov-overview/) é o modelo padrão para representar proveniência na Web. O MyProvenance não implementa PROV-O literalmente no banco de dados, mas cada conceito do domínio tem um equivalente direto no modelo — o que permite exportar ou mapear os dados para PROV quando necessário, sem redesenhar nada.

| MyProvenance                                  | W3C PROV                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Entidade                                      | `prov:Entity`                                                             |
| Atividade (Criação / Transformação / Análise) | `prov:Activity`                                                           |
| Agente — Pessoa / Instituição / Software      | `prov:Agent` (`prov:Person` / `prov:Organization` / `prov:SoftwareAgent`) |
| Entidade gerada por uma Atividade             | `prov:wasGeneratedBy`                                                     |
| Atividade usa uma Entidade                    | `prov:used`                                                               |
| Relação de origem "Derivação"                 | `prov:wasDerivedFrom`                                                     |
| Relação de origem "Revisão"                   | `prov:wasRevisionOf`                                                      |
| Atividade realizada por um Agente             | `prov:wasAssociatedWith`                                                  |
| Entidade atribuída a um Agente                | `prov:wasAttributedTo`                                                    |
| Registro de Proveniência (container do grafo) | `prov:Bundle`                                                             |

Sempre que uma página deste manual menciona um 🔗 **Padrão**, é esse mapeamento em ação.

Os dados de ocorrência e taxonomia seguem o [Darwin Core](https://dwc.tdwg.org/) (DwC), o vocabulário padrão de biodiversidade do [TDWG](https://www.tdwg.org/). O exemplo completo (última página deste manual) mostra uma Transformação típica: planilha crua → termos DwC.

## Links oficiais

- [W3C PROV Overview](https://www.w3.org/TR/prov-overview/)
- [W3C PROV-DM (modelo de dados)](https://www.w3.org/TR/prov-dm/)
- [W3C PROV-O (ontologia)](https://www.w3.org/TR/prov-o/)
- [Darwin Core](https://dwc.tdwg.org/)
- [Darwin Core Quick Reference](https://dwc.tdwg.org/terms/)

## Próximos passos

[Criar registro](01-criar-registro.md)
