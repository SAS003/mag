-- MAG CKI v1.0 update policy
-- Applied to the live Supabase project on 2026-09-25.
-- The current MAG client uses the anon role and already permits
-- unrestricted SELECT/INSERT access for this private development app.

DROP POLICY IF EXISTS "cki_conversations update"
ON public.cki_conversations;

CREATE POLICY "cki_conversations update"
ON public.cki_conversations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
