# Share

A record can be shared in two independent ways: a public read-only link, or co-editing with another registered account.

## What it is and what it's for

The `Share` button (visible to the owner and to Administrators, requires an account) opens the `Share Record` dialog with two tabs:

- **`Public link`** — generates a read-only link that needs no session, with no edit or delete rights.
- **`Share with user`** — invites another registered account to co-edit the record with you, choosing the permission level.

## When to use it

`Public link` to publish a finalized record to anyone, without them needing an account. `Share with user` to work together on the same record with another person who also uses MyProvenance.

## Step by step

### Public link

1. Open `Share` → `Public link` tab.
2. Click `Activate public link`.
3. Click `Copy` to copy the generated URL.
4. To revoke access, click `Deactivate public link` — the old link stops working.

### Share with user

1. Open `Share` → `Share with user` tab.
2. Fill in the `Username` of the account that will receive access.
3. Choose the `Permission`: `Editor` or `Administrator`.
4. Click `Share`.
5. The `Who has access` list shows everyone with access to the record; use `Remove` to revoke someone's access, or `Leave` to give up your own access to a record shared with you.

## Permission hierarchy

`Owner` > `Administrator` > `Editor`:

- **Editor** edits title, description and Activities/Entities, following the same `Draft`/`Finalized` rules as the owner.
- **Administrator** has full parity with the owner: can also `Finalize`, `Delete Record`, and manage the public link and who has access.
- Sharing again with someone who already has access simply updates their role — the operation is idempotent.

## Screenshot

![Share Record dialog, Public link tab](/manual/en/07-dialog-link-publico.png)

![Share with user tab, with username field and permission selector](/manual/en/07-aba-compartilhar-usuario.png)

![Who has access list with each person's role](/manual/en/07-lista-acessos.png)

> 🔗 **Pattern:** sharing doesn't change the provenance graph (`prov:Bundle` stays the same) — it's an access-control layer over who can view or edit the record, not a provenance datum itself.

> 💡 **Tip:** the public link is always read-only, even for someone with Administrator permission — the only way to edit is through an account with access via `Share with user`.

## Next steps

[Delete a record](/como-usar/08-excluir-registro)
