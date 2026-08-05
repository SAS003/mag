/*
==========================================================
MAG v0.2
supabase.js
==========================================================
*/

async function saveToSupabase(record) {

    try {

        const response = await fetch(

            CONFIG.SUPABASE_URL +
            "/rest/v1/" +
            CONFIG.TABLE,

            {

                method: "POST",

                headers: {

                    "apikey":
                        CONFIG.SUPABASE_ANON_KEY,

                    "Authorization":
                        "Bearer " +
                        CONFIG.SUPABASE_ANON_KEY,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=minimal"

                },

                body: JSON.stringify({

                    source:
                        record.source,

                    conversation_url:
                        record.conversation_url,

                    conversation_start:
                        record.conversation_start,

                    chat_title:
                        record.chat_title,

                    logical_title:
                        record.logical_title,

                    cki_spec_version:
                        record.cki_spec_version,

                    context_scope:
                        record.context_scope,

                    context_confidence:
                        record.context_confidence,

                    coverage_assessment:
                        record.coverage_assessment,

                    summary:
                        record.summary,

                    retrieval_summary:
                        record.retrieval_summary,

                    primary_topic:
                        record.primary_topic,

                    secondary_topics:
                        record.secondary_topics,

                    keywords:
                        record.keywords,

                    systems:
                        record.systems,

                    knowledge_objects:
                        record.knowledge_objects,

                    cki_json:
                        record.raw_json

                })

            }

        );

        if (response.ok) {

            setStatus(
                "✅ CKI sikeresen elmentve.",
                "success"
            );

            return;

        }

        const error =
            await response.json();

        if (
            error.code === "23505"
        ) {

            setStatus(
                "⚠ Ez a beszélgetés már szerepel az adatbázisban.",
                "warning"
            );

            return;

        }

        setStatus(

            "❌ " +

            (
                error.message ??
                "Ismeretlen hiba."
            ),

            "error"

        );

    }

    catch (err) {

        setStatus(

            "❌ " +

            err.message,

            "error"

        );

    }

}
