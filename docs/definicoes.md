Em ciência de dados e gestão de dados de pesquisa, **provenance** (frequentemente traduzido como _proveniência_ ou _procedência_) refere-se ao **registro detalhado da origem, do histórico de propriedade, da custódia e de todas as transformações pelas quais um dado passou**, desde a sua coleta inicial até o seu estado atual.

Pense na proveniência como a "árvore genealógica" ou a "caixa-preta" do dado. Ela responde, com precisão, a perguntas essenciais sobre a integridade e o ciclo de vida da informação.

## Por que a Proveniência é crucial na pesquisa?

Em um cenário científico moderno — onde dados são constantemente compartilhados, integrados e reutilizados —, a proveniência é o pilar que sustenta a confiança. Ela garante:

*   **Reprodutibilidade:** Permite que outros cientistas sigam exatamente os mesmos passos (com os mesmos algoritmos, parâmetros e versões de software) para chegar aos mesmos resultados.
    
*   **Atribuição e Crédito:** Identifica claramente quem gerou o dado original, garantindo que os créditos de autoria e propriedade intelectual sejam mantidos.
    
*   **Auditoria e Qualidade:** Se um erro for descoberto em uma análise, a proveniência permite "rastrear o caminho de volta" para identificar se a falha ocorreu na coleta, em um script de limpeza ou em uma etapa de modelagem.
    
*   **Transparência:** Essencial para atender aos **Princípios FAIR** (Findable, Accessible, Interoperable, Reusable), especialmente no que diz respeito à reusabilidade ($R$).
    

## Os Três Pilares da Proveniência (Modelo W3C PROV)

Para padronizar como a proveniência é descrita na Web e em sistemas de informação, o Consórcio W3C estabeleceu o padrão **PROV**. Ele simplifica qualquer histórico de dados em três elementos fundamentais e suas relações:

1.  **Entidades (Entities):** Os objetos físicos ou digitais (ex: um arquivo CSV, uma planilha de campo, uma imagem de satélite, um artigo publicado).
    
2.  **Atividades (Activities):** Os processos ou ações que criam, modificam ou utilizam entidades (ex: uma calibração de sensor, a execução de um script em R/Python, um processo de validação taxonômica).
    
3.  **Agentes (Agents):** Quem ou o que é responsável pelas atividades (ex: um pesquisador específico, uma instituição de pesquisa, ou até mesmo um software automatizado).
    

## O que deve ser registrado? (Na prática)

Um bom registro de proveniência em dados de pesquisa geralmente inclui:

**Categoria**

**Exemplos Práticos de Metadados**

**Origem**

Quem coletou, onde (coordenadas geográficas), quando (data/hora) e com qual instrumento (marca/modelo do sensor).

**Transformações**

Códigos de limpeza de dados, scripts de normalização, parâmetros de algoritmos e softwares utilizados (com suas respectivas versões).

**Ambiente de Execução**

Sistema operacional, dependências de código, pacotes e bibliotecas de software.

**Relacionamentos**

Links para os dados brutos originais e termos de licença de uso aplicados.