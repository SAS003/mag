# MAG — Development Status

Version: v0.2.5 release candidate
Status: DB schema aligned; runtime wiring verification

## 1. Architecture

MAG is a multi-type ingestion workspace.

COMMON INPUT UI
→ TYPE DETECTION
→ TYPE-SPECIFIC PARSER
→ TYPE-SPECIFIC VALIDATOR
→ TYPE-SPECIFIC IMPORT
→ TYPE-SPECIFIC STORAGE

Current types:
- CKI → cki_conversations
- Article Profile → ap_content_objects + ap_content_profiles

## 2. v0.2.5 changes

- common type detector added in js/ingest.js
- CKI parser moved to strict canonical v1.3
- legacy source_metadata / processing_metadata rejected
- embedded_cki_export_count validated and included in CKI record
- verified live DB field wired into js/supabase.js and js/sql.js
- CKI identity states implemented in js/supabase.js
- CKI export aligned to v1.3
- AP routing isolated from CKI parsing
- regression test file added

## 3. CKI import states

NEW
→ no existing record for the same conversation_url

EXACT_DUPLICATE
→ same conversation_url and semantically identical canonical JSON

UPDATE_CANDIDATE
→ same conversation_url and different canonical JSON

IDENTITY_UNKNOWN
→ conversation_url is null or empty

No automatic overwrite is performed for UPDATE_CANDIDATE.

## 4. Database state

The live Supabase schema was verified and aligned on 2026-09-25.

Verified:
- embedded_cki_export_count exists as nullable integer
- CHECK allows NULL or integer >= 0
- conversation_url is not UNIQUE
- conversation_url + cki_spec_version is not UNIQUE
- non-UNIQUE conversation_url lookup index exists

The repository migration note at docs/db/mag_cki_v1.3_embedded_count.sql documents the applied live alignment. Supabase migration history currently has no recorded migrations because the live schema was aligned directly through SQL.

## 5. Verification status

Verified:
- v0.2.4 RC isolated tests: 12/12 PASS
- live Supabase CKI schema aligned
- live embedded_cki_export_count column present
- live conversation_url uniqueness constraints/indexes removed from the identity model
- no current duplicate non-null conversation URLs in existing data

Pending:
- browser integration against the RC
- real frontend INSERT / EXACT_DUPLICATE / UPDATE_CANDIDATE path

## 6. Branch

mag-v0.2.5-rc

Base: MAG v0.2.4 RC
This checkpoint wires the verified live schema into the CKI save and SQL generation paths.