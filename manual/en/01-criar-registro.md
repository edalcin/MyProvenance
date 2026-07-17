# Create a record

Every piece of work in MyProvenance starts by creating a Provenance Record — the container that will hold Entities, Activities and Agents for a lineage.

## What it is and what it's for

A Provenance Record groups the whole lineage of a dataset: from the original source to the analysis results, with every intermediate step documented as an Activity. It starts out as `Draft`, freely editable, and can later be `Finalized` (see [Finalize](/como-usar/04-finalizar)).

## When to use it

Whenever you start tracking a new dataset — a new collection effort, a new study, or the retroactive documentation of an existing pipeline.

## Step by step

1. On the `Records` page, click `New Record`.
2. In the `New Provenance Record` dialog, fill in `Title` (required) and `Description` (optional, rich text editor).
3. Click `Create Record`.
4. The record appears in the list with `Draft` status.

## Screenshot

![Records list with the New Record button highlighted](/manual/en/01-lista-novo-registro.png)

![New Provenance Record dialog with a title filled in](/manual/en/01-dialog-novo-registro.png)

> 🔗 **Pattern:** creating the record creates the `prov:Bundle` that will hold the whole lineage — still empty, with no Entities or Activities yet.

> 💡 **Tip:** the `Title` can be edited later at any time, even after the record is finalized — see [Edit Record and Activity](/como-usar/03-editar).

## Next steps

[Add an Activity](/como-usar/02-adicionar-atividade)
