-- MAG CKI v1.3 live schema alignment
-- Status: APPLIED LIVE on 2026-09-25 via direct SQL.
-- Supabase migration history is currently empty.
--
-- Purpose:
--   1. add embedded_cki_export_count
--   2. allow multiple exports for one conversation_url
--   3. retain a non-unique URL lookup index

ALTER TABLE public.cki_conversations
  ADD COLUMN IF NOT EXISTS embedded_cki_export_count integer;

ALTER TABLE public.cki_conversations
  DROP CONSTRAINT IF EXISTS cki_conversations_conversation_url_key;

ALTER TABLE public.cki_conversations
  DROP CONSTRAINT IF EXISTS uq_cki_conversation_url;

DROP INDEX IF EXISTS public.cki_conversations_conversation_url_key;
DROP INDEX IF EXISTS public.uq_cki_conversation_url;
DROP INDEX IF EXISTS public.idx_cki_url_version;

ALTER TABLE public.cki_conversations
  DROP CONSTRAINT IF EXISTS cki_conversations_embedded_cki_export_count_check;

ALTER TABLE public.cki_conversations
  ADD CONSTRAINT cki_conversations_embedded_cki_export_count_check
  CHECK (
    embedded_cki_export_count IS NULL
    OR embedded_cki_export_count >= 0
  );

CREATE INDEX IF NOT EXISTS idx_cki_conversation_url
  ON public.cki_conversations (conversation_url);

-- Contract note:
-- conversation_url is an indexed identity lookup field, not a UNIQUE key.
-- Multiple CKI exports for one conversation_url are permitted.