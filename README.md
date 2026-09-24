# MAG
Conversation Knowledge Workspace

## MAG ingest architecture

A közös MAG input felület több tartalomtípust fogad. A közös réteg csak detektál és route-ol; a parser, validator, import és storage típusfüggő.

Jelenlegi típusok:
- CKI → cki_conversations
- Article Profile (AP) → ap_content_objects + ap_content_profiles

Adatfolyam:
Detect → Parse → Validate → Route → Type-specific Import

UNKNOWN vagy AMBIGUOUS input nem kerül automatikusan egyik importágba sem.

## CKI Core

Az aktuális canonical specifikáció az FTR-KI01 CKI v1.3.

v1.2 történeti, frozen specifikáció; a MAG nem migrálja automatikusan v1.2-re vagy v1.2-ről a bemenetet.

A canonical v1.3 kötelező metadata mezői közé tartozik:
- cki_spec_version = 1.3
- embedded_cki_export_count

source_metadata és processing_metadata nem canonical CKI v1.3 struktúrák.

## CKI import

Elsődleges stabil identity: metadata.conversation_url.

Import állapotok:
- NEW
- EXACT_DUPLICATE
- UPDATE_CANDIDATE
- IDENTITY_UNKNOWN

Azonos conversation_url mellett több CKI export megengedett. Ezért conversation_url nem kezelendő automatikusan UNIQUE mezőként.

Canonical összehasonlítás:
- object key order nem számít
- whitespace nem számít
- array order számít

UPDATE_CANDIDATE esetén nincs automatikus overwrite.

## AP protection

Az AP saját parserrel és saját Supabase storage/import logikával működik. A CKI-fejlesztés nem módosíthatja az AP retrieved_at-alapú frissítési szabályát.

## Development rules

Minden jelentős kódmódosítás ellenőrzött Git checkpointot igényel.
DB-függő módosítás csak ténylegesen ellenőrzött Supabase-séma alapján kerülhet a stabil ágba.

## Current development branch

MAG v0.2.4 fejlesztési branch:
mag-v0.2.4-impl

Scope:
- common type detection
- strict CKI v1.3 validation
- CKI duplicate/update-candidate logic
- AP regression protection
- CKI v1.3 exporter

Az embedded_cki_export_count külön DB-oszlopának élő sémába kötése még függőben van.
