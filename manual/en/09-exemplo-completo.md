# Full example

An end-to-end walkthrough: from a raw field spreadsheet to a set of analyses, using a real biodiversity occurrence dataset.

## The dataset

- **Record:** `Occurrences of Myrcia in the Atlantic Forest` (`Ocorrências de Myrcia na Mata Atlântica`).
- **Agents:**
  - Person `José Silva` (affiliation `JBRJ`, sample ORCID `0000-0002-1825-0097`).
  - Institution `Instituto de Pesquisas Jardim Botânico do Rio de Janeiro`.
  - Software `OpenRefine 3.7` and `R 4.3.1`.
- **Raw spreadsheet** `ocorrencias_brutas.csv` (5 rows, typical field issues): columns `especie, coletor, data, latitude, longitude, local`; dates in 4 different formats (`12/03/2020`, `2019-3-5`, `março/2018`, `2021`), comma-decimal coordinates with missing values, species names without authorship and inconsistent capitalization, free-text `local` column.
- **Darwin Core** `ocorrencias_darwincore.csv`: `scientificName` (`Myrcia splendens (Sw.) DC.`), `recordedBy` (`José Silva`), `eventDate` (ISO 8601), `decimalLatitude`/`decimalLongitude` (decimal point), `geodeticDatum` (`EPSG:4326`), `country` (`Brasil`), `stateProvince`, `locality`, `basisOfRecord` (`PreservedSpecimen`).

## Step 1 — Create the record

See [Create a record](/como-usar/01-criar-registro). Title: `Ocorrências de Myrcia na Mata Atlântica`.

## Step 2 — Register the Agents

The three Agents (`José Silva`, `Instituto de Pesquisas Jardim Botânico do Rio de Janeiro`, `OpenRefine 3.7`, `R 4.3.1`) can be created ahead of time under `Agents`, or inline while filling in each Activity, using `Create "<name>"` in the picker — see [Add an Activity](/como-usar/02-adicionar-atividade).

## Step 3 — Activity 1: Creation (raw spreadsheet)

- Type: `Creation`.
- Agent: `José Silva`.
- `Location`: approximate coordinates in Rio de Janeiro.
- `Tool or Software`: `GPS Garmin eTrex 32x`.
- Generated entity: `ocorrencias_brutas.csv` (Format `CSV`).

🔗 PROV: creates the first Entity in the lineage — `prov:wasGeneratedBy` links `ocorrencias_brutas.csv` to this Activity, `prov:wasAssociatedWith` links the Activity to `José Silva`.

## Step 4 — Activity 2: Transformation (cleaning + Darwin Core)

- Type: `Transformation`.
- Agent: `OpenRefine 3.7`.
- Entity used: `ocorrencias_brutas.csv`.
- `Process`: date normalization to ISO 8601, coordinate conversion to decimal point, column mapping to Darwin Core terms.
- Parameters: `separador_decimal` = `.`, `formato_data` = `ISO 8601`.
- `Execution environment — operating system`: `Ubuntu 24.04`.
- Generated entity: `ocorrencias_darwincore.csv` (Format `CSV`), Relationship to source: `Derivation`.

🔗 PROV: `prov:used` links this Activity to `ocorrencias_brutas.csv`; the new entity has `prov:wasDerivedFrom` pointing to it.

## Step 5 — Activities 3 and 4: Analyses with output

- **Analysis 1** — Agent `R 4.3.1`, uses `ocorrencias_darwincore.csv`, `Process`: count of occurrences by `locality`, generates `contagem_por_local.csv`.
- **Analysis 2** — Agent `R 4.3.1`, uses `ocorrencias_darwincore.csv`, `Process`: temporal distribution of collections by `eventDate`, generates `distribuicao_temporal.png`.

## Step 6 — Activity 5: Analysis with no generated entity

- Type: `Analysis`, Agent `R 4.3.1`, uses `ocorrencias_darwincore.csv`.
- `Process`: coordinate consistency check (`decimalLatitude`/`decimalLongitude` within Brazil's bounds).
- No generated entity — demonstrates that an Analysis can exist purely to validate data, without producing a new output (cardinality 0 on generation).

## Step 7 — Check the diagram and export

- See the full lineage diagram on the record — five Activities, three Entities generated starting from the original raw spreadsheet.
- [Export .md report](/como-usar/06-exportar-relatorio-md) to generate the readable version with diagram and tables.
- [Export JSON](/como-usar/05-exportar-json) to keep a full copy of the data.
- Optionally, [Finalize](/como-usar/04-finalizar) the record to lock the documented history.

## Screenshot

![Full lineage diagram of the example, all 5 Activities](/manual/en/09-diagrama-completo.png)

![Timeline of the example's Activities](/manual/en/09-linha-do-tempo.png)

## Next steps

[Index](/como-usar)
