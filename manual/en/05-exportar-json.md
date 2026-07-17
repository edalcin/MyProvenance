# Export JSON

The exported JSON is the complete, portable copy of a record — the backup and cross-session continuity format.

## What it is and what it's for

`Export JSON` downloads a file with the record's full content: Title, Description, Entities, Activities and the Agents involved. Field names follow the domain glossary, in Portuguese.

## When to use it

To keep a backup copy, migrate a record between instances, or — if you use MyProvenance without an account — as the only way to carry your data from one browser session to another (anonymous mode persists nothing on the server).

## Step by step

1. On the record, click `Export JSON`.
2. The browser downloads a `.json` file with the record's full content at that moment.
3. Available in any status (`Draft` or `Finalized`).

## Screenshot

![Export JSON button on the record](/manual/en/05-botao-exportar-json.png)

> 🔗 **Pattern:** the exported JSON is a direct serialization of the `prov:Bundle` and its content — it's not formal PROV-JSON, but it covers the same elements (Entities, Activities, Agents and the relationships between them).

> 💡 **Tip:** exporting never changes the record — it doesn't change the status or lock anything. It is always a read operation, with no side effect.

## Next steps

[Export .md report](/como-usar/06-exportar-relatorio-md)
