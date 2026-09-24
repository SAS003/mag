# MAG CKI Save Decision v1.0

## Purpose

The CKI save flow must distinguish identity detection from the user's final persistence decision.

## Identity states

### NEW

No existing row matches the normalized `conversation_url`.

Default action: INSERT.

### EXACT_DUPLICATE

The same `conversation_url` exists and at least one existing `cki_json` is canonically identical to the incoming CKI.

Action: no INSERT and no UPDATE.

### UPDATE_CANDIDATE

The same `conversation_url` exists, but no existing `cki_json` is canonically identical to the incoming CKI.

This is a decision state, not a persistence action.

The UI must:

1. show the existing candidate records;
2. show the structural difference paths between incoming and existing CKI;
3. allow explicit UPDATE of a selected existing row;
4. allow explicit SAVE AS NEW;
5. allow cancellation.

No automatic overwrite is allowed.

## Explicit actions

### UPDATE_EXISTING

The selected existing row is updated with the complete validated CKI payload.

Before PATCH, MAG performs an optimistic concurrency check by re-reading the selected row and comparing its current `cki_json` with the candidate JSON previously displayed to the user.

If the row changed meanwhile, the PATCH is rejected and a new Save decision is required.

### SAVE_AS_NEW

The validated CKI payload is inserted as a new row even though the same `conversation_url` already exists.

This is an explicit user decision. It does not change the identity semantics of the import layer.

## IDENTITY_UNKNOWN

If `conversation_url` is null or empty, MAG does not infer identity from other fields.

The record can be inserted as an identity-unknown record.

## Design principle

Identity detection answers:

> "What already exists?"

The save decision answers:

> "What should happen now?"

These are separate layers and must not be collapsed into one automatic overwrite rule.
