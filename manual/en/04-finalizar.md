# Finalize

Finalizing turns the record from an editable draft into an immutable historical document.

## What it is and what it's for

The `Finalize` button changes the record's status from `Draft` to `Finalized`. From then on, the Entities and Activities already recorded are locked — they can no longer be edited or deleted, only new Activities can be added at the end of the lineage. `Title` and `Description` remain normally editable.

## When to use it

When the lineage documented so far is correct and you want to guarantee it won't be rewritten later — for example, before citing the record in a paper or sharing it as an official reference.

## Step by step

1. On the record in `Draft`, click `Finalize`.
2. The status changes from `Draft` to `Finalized` (badge visible at the top of the record).
3. From here on, existing Activities and Entities are read-only; new Activities can still be added.

## Screenshot

![Finalize button on a draft record](/manual/en/04-botao-finalizar.png)

![Finalized badge after the action](/manual/en/04-badge-finalizado.png)

> 🔗 **Pattern:** finalizing "freezes" the `prov:Bundle` — the provenance graph documented up to that point is now treated as a stable historical record.

> ⚠️ **Warning:** this is a deliberate, one-way decision — there is no button to go back to `Draft`. Exporting (JSON or report) does **not** finalize the record automatically; finalizing is always an explicit action.

## Next steps

[Export JSON](/como-usar/05-exportar-json)
