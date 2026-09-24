# MAG — Development Status

Version: v0.2.3 development branch
Status: implementation checkpoint — DB-dependent wiring pending

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

## 2. v0.2.3 changes

- common type detector added in js/ingest.js
- CKI parser moved to strict canonical v1.3
- legacy source_metadata / processing_metadata rejected
- embedded_cki_export_count validated and included in CKI record
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

## 4. Database dependency

The repository does not currently contain a verified Supabase schema definition for cki_conversations.

A proposed migration exists at:
docs/db/mag_cki_v1.3_embedded_count.sql

Status: PROPOSED. It has not been treated as an applied database migration.

Until the live schema is verified, the dedicated embedded_cki_export_count DB column is not written by the runtime saver.

## 5. Verification status

Verified by repository inspection:
- v0.2.2 main remains unchanged
- v0.2.3 branch contains the intended routing/parser/import changes
- parser escape scanner correction is present
- README and development status reflect the multi-type model

Not yet runtime-verified in this environment:
- browser integration
- live Supabase insert / duplicate / update-candidate behavior
- live DB column availability
- automated Node test execution

No claim is made that the v0.2.3 branch is production-ready until those checks are completed.

## 6. Branch

mag-v0.2.3-impl

Base: MAG v0.2.2 main
Latest checkpoint is the branch tip after the proposed DB migration addition.
