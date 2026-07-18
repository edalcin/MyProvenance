# Exemplo completo

Um walkthrough de ponta a ponta: da planilha crua de campo até um conjunto de análises, usando um dataset real de ocorrências de biodiversidade.

## O dataset

- **Registro:** `Ocorrências de Myrcia na Mata Atlântica`.
- **Agentes:**
  - Pessoa `José Silva` (afiliação `JBRJ`, ORCID de exemplo `0000-0002-1825-0097`).
  - Instituição `Instituto de Pesquisas Jardim Botânico do Rio de Janeiro`.
  - Software `OpenRefine 3.7` e `R 4.3.1`.
- **Planilha crua** `ocorrencias_brutas.csv` (5 linhas, problemas típicos de campo): colunas `especie, coletor, data, latitude, longitude, local`; datas em 4 formatos diferentes (`12/03/2020`, `2019-3-5`, `março/2018`, `2021`), coordenadas com vírgula decimal e valores ausentes, nomes de espécie sem autoria e capitalização inconsistente, coluna `local` em texto livre.
- **Darwin Core** `ocorrencias_darwincore.csv`: `scientificName` (`Myrcia splendens (Sw.) DC.`), `recordedBy` (`José Silva`), `eventDate` (ISO 8601), `decimalLatitude`/`decimalLongitude` (ponto decimal), `geodeticDatum` (`EPSG:4326`), `country` (`Brasil`), `stateProvince`, `locality`, `basisOfRecord` (`PreservedSpecimen`).

## Passo 1 — Criar o Registro

Veja [Criar registro](01-criar-registro.md). Título: `Ocorrências de Myrcia na Mata Atlântica`.

## Passo 2 — Cadastrar os Agentes

Os três Agentes (`José Silva`, `Instituto de Pesquisas Jardim Botânico do Rio de Janeiro`, `OpenRefine 3.7`, `R 4.3.1`) podem ser criados de antemão em `Agentes`, ou inline durante o preenchimento de cada Atividade, usando `Criar "<nome>"` no seletor — ver [Adicionar Atividade](02-adicionar-atividade.md).

## Passo 3 — Atividade 1: Criação (planilha crua)

- Tipo: `Criação`.
- Agente: `José Silva`.
- `Local`: coordenadas aproximadas no Rio de Janeiro.
- `Ferramenta ou Software`: `GPS Garmin eTrex 32x`.
- Entidade gerada: `ocorrencias_brutas.csv` (Formato `CSV`).

🔗 PROV: cria a primeira Entidade da linhagem — `prov:wasGeneratedBy` ligando `ocorrencias_brutas.csv` a esta Atividade, `prov:wasAssociatedWith` ligando a Atividade a `José Silva`.

## Passo 4 — Atividade 2: Transformação (limpeza + Darwin Core)

- Tipo: `Transformação`.
- Agente: `OpenRefine 3.7`.
- Entidade usada: `ocorrencias_brutas.csv`.
- `Processo`: normalização de datas para ISO 8601, conversão de coordenadas para ponto decimal, mapeamento de colunas para termos Darwin Core.
- Parâmetros: `separador_decimal` = `.`, `formato_data` = `ISO 8601`.
- `Ambiente de execução — sistema operacional`: `Ubuntu 24.04`.
- Entidade gerada: `ocorrencias_darwincore.csv` (Formato `CSV`), Relação com a origem: `Derivação`.

🔗 PROV: `prov:used` liga esta Atividade a `ocorrencias_brutas.csv`; a nova Entidade tem `prov:wasDerivedFrom` apontando para ela.

## Passo 5 — Atividades 3 e 4: Análises com saída

- **Análise 1** — Agente `R 4.3.1`, usa `ocorrencias_darwincore.csv`, `Processo`: contagem de ocorrências por `locality`, gera `contagem_por_local.csv`.
- **Análise 2** — Agente `R 4.3.1`, usa `ocorrencias_darwincore.csv`, `Processo`: distribuição temporal das coletas por `eventDate`, gera `distribuicao_temporal.png`.

## Passo 6 — Atividade 5: Análise sem Entidade gerada

- Tipo: `Análise`, Agente `R 4.3.1`, usa `ocorrencias_darwincore.csv`.
- `Processo`: checagem de consistência de coordenadas (`decimalLatitude`/`decimalLongitude` dentro dos limites do Brasil).
- Nenhuma Entidade gerada — demonstra que uma Análise pode existir só para validar dados, sem produzir uma nova saída (cardinalidade 0 na geração).

## Passo 7 — Conferir o diagrama e exportar

- Veja o diagrama de linhagem completo no Registro — cinco Atividades, três Entidades geradas a partir da planilha crua original.
- [Exportar Relatório .md](06-exportar-relatorio-md.md) para gerar a versão legível com diagrama e tabelas.
- [Exportar JSON](05-exportar-json.md) para guardar uma cópia completa dos dados.
- Opcionalmente, [Finalizar](04-finalizar.md) o Registro para travar o histórico documentado.

## Screenshot

<!-- SCREENSHOT: adicione a imagem em manual/img/09-diagrama-completo.png -->
![Diagrama completo da linhagem do exemplo, das 5 Atividades](img/09-diagrama-completo.png)

<!-- SCREENSHOT: adicione a imagem em manual/img/09-linha-do-tempo.png -->
![Linha do tempo das Atividades do exemplo](img/09-linha-do-tempo.png)

## Próximos passos

[Índice](index.md)
