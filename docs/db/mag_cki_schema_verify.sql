-- MAG CKI database schema verification
-- Read-only verification queries. Do not modify data.
-- Run in Supabase SQL Editor against the project used by MAG.

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cki_conversations'
ORDER BY ordinal_position;

SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'cki_conversations'
ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'cki_conversations'
ORDER BY indexname;

-- Expected fields for MAG CKI v1.3 runtime:
-- id
-- inserted_at
-- source
-- conversation_url
-- conversation_start
-- chat_title
-- logical_title
-- cki_spec_version
-- context_scope
-- context_confidence
-- coverage_assessment
-- embedded_cki_export_count
-- summary
-- retrieval_summary
-- primary_topic
-- secondary_topics
-- keywords
-- systems
-- knowledge_objects
-- cki_json

-- Important:
-- conversation_url must NOT be UNIQUE under MAG-CKI-IC01 v1.1,
-- because multiple CKI exports may exist for the same conversation.
