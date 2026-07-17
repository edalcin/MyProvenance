# Edit Record and Activity

Not everything in a record is immutable — but what can be edited changes depending on the record's status and the type of data.

## What it is and what it's for

The record's `Title` and `Description` are metadata and stay editable even after it is `Finalized`. Activities (and the Entities they generated), however, can only be edited or deleted while the record is `Draft` — once finalized, the history becomes read-only.

## When to use it

To fix a mistyped title, add to a description, or correct an Activity field entered incorrectly before finalizing the record.

## Step by step

1. On the record, click `Edit` to change `Title`/`Description` — allowed in any status.
2. To edit an Activity, use the edit icon (`Edit Activity`) in the Activities list — only available while the record is `Draft`.
3. In the edit form, the Activity's type (`Creation`/`Transformation`/`Analysis`) appears fixed — it cannot be changed after creation.
4. To delete an Activity, use the `Delete Activity` icon — also only in `Draft`; the browser's native confirmation warns that entities it generated will be removed too, if not in use as input by another activity.

## Screenshot

![Edit button on the record header](/manual/en/03-editar-registro.png)

![Activity edit form, with the type fixed](/manual/en/03-editar-atividade.png)

> 🔗 **Pattern:** editing title/description doesn't change the record's PROV graph (`prov:Bundle`); editing an Activity while in draft corrects the `prov:Activity` before it's treated as final.

> ⚠️ **Warning:** after `Finalize`, existing Activities and Entities can no longer be edited or deleted — only new ones can be added. There's no way to undo this lock.

## Next steps

[Finalize](/como-usar/04-finalizar)
