# Delete a record

Deleting a record is a permanent action — there's no trash bin and no undo.

## What it is and what it's for

`Delete Record` permanently removes the record and, in cascade, all of its Entities and Activities. This action is available to the owner and to Administrators.

## When to use it

Only when you're sure the record (and everything it documents) is no longer needed — for example, a test record, or a duplicate created by mistake. For a valid record, export it first before making any irreversible decision.

## Step by step

1. On the record, click `Delete Record`.
2. The browser asks for native confirmation (`window.confirm`) describing that all Entities and Activities will also be removed.
3. Upon confirming, the record is removed immediately and disappears from the `Records` list.

## Screenshot

![Delete Record button on the record](/manual/en/08-botao-excluir.png)

The browser's native confirmation dialog cannot be captured in a screenshot — it asks something like: _"Delete the record "<title>"? This removes all Entities and Activities."_

> 🔗 **Pattern:** deleting removes the whole `prov:Bundle` and everything it contains — there's no PROV equivalent for "undoing" this operation, because the provenance ceases to exist.

> ⚠️ **Warning:** irreversible action. Export the JSON or the report before deleting, in case you want to keep a record of what existed.

## Next steps

[Full example](/como-usar/09-exemplo-completo)
