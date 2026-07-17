# Export .md report

The Markdown report is the human-readable version of the record — ready to attach to a paper, a repository or an email.

## What it is and what it's for

`Export .md report` generates a `<title-slug>-provenance.md` file containing a header with the record's metadata, a Mermaid diagram of the full lineage, and tables of Entities, Activities and Agents.

## When to use it

When you need to communicate a dataset's provenance to someone who won't access MyProvenance directly — reviewers, collaborators, or as an attachment to a data repository.

## Step by step

1. On the record, click `Export .md report`.
2. The browser downloads the `.md` file, already using the diagram orientation (horizontal/vertical) selected on screen at that moment.
3. Open the file in any Markdown viewer to check the rendered result.

## Screenshot

![Export .md report button on the record](/manual/en/06-botao-exportar-md.png)

![Exported .md report, rendered, with diagram and tables](/manual/en/06-relatorio-exemplo.png)

> 🔗 **Pattern:** the report's diagram draws the same relationships from the PROV mapping — Entities, Activities, `prov:used`/`prov:wasGeneratedBy` and the origin relationships (`Derivation`/`Revision`).

> 💡 **Tip:** the diagram orientation can be toggled with the `TD`/`LR` button above it, on the record screen — the export respects the orientation chosen at the moment you click.

## Next steps

[Share](/como-usar/07-compartilhar)
