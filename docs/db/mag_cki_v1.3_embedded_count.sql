-- MAG CKI v1.3 database migration proposal
-- Status: PROPOSED — do not run until the live Supabase schema is verified.

ALTER TABLE public.cki_conversations
ADD COLUMN IF NOT EXISTS embedded_cki_export_count integer;

ALTER TABLE public.cki_conversations
DROP CONSTRAINT IF EXISTS cki_conversations_embedded_cki_export_count_check;

ALTER TABLE public.cki_conversations
ADD CONSTRAINT cki_conversations_embedded_cki_export_count_check
CHECK (embedded_cki_export_count IS NULL OR embedded_cki_export_count >= 0);

-- Do not add a UNIQUE constraint to conversation_url.
-- Multiple CKI exports for one conversation_url are permitted by the import contract.
