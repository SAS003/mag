/*
==========================================================
MAG v0.2.5
supabase.js
==========================================================

CKI import behavior:
- conversation_url is the primary stable identity;
- null/empty URL => IDENTITY_UNKNOWN;
- exact canonical JSON match => EXACT_DUPLICATE;
- same URL with different canonical JSON => UPDATE_CANDIDATE;
- UPDATE_CANDIDATE is never auto-overwritten;
- full validated CKI JSON is preserved unchanged.

The embedded_cki_export_count field is written to the verified live DB schema.
==========================================================
*/

function canonicalJSONStringify(value) {

    if (Array.isArray(value)) {

        return "[" +
            value
                .map(
                    item =>
                        canonicalJSONStringify(item)
                )
                .join(",") +
            "]";

    }


    if (
        value &&
        typeof value === "object"
    ) {

        return "{" +
            Object.keys(value)
                .sort()
                .map(
                    key =>
                        JSON.stringify(key) +
                        ":" +
                        canonicalJSONStringify(
                            value[key]
                        )
                )
                .join(",") +
            "}";

    }


    return JSON.stringify(value);

}


function canonicalCKIComparisonValue(value) {

    if (typeof value === "string") {

        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }

    }

    return value;

}


function buildCKISupabasePayload(record) {

    return {

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

        embedded_cki_export_count:
            record.embedded_cki_export_count,

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

    };

}


async function insertCKIRecord(
    record,
    identityState
) {

    const response =
        await fetch(
            CONFIG.SUPABASE_URL +
            "/rest/v1/" +
            CONFIG.TABLE,
            {
                method: "POST",

                headers: {
                    apikey:
                        CONFIG.SUPABASE_ANON_KEY,

                    Authorization:
                        "Bearer " +
                        CONFIG.SUPABASE_ANON_KEY,

                    "Content-Type":
                        "application/json",

                    Prefer:
                        "return=minimal"
                },

                body:
                    JSON.stringify(
                        buildCKISupabasePayload(
                            record
                        )
                    )
            }
        );


    if (response.ok) {

        if (
            identityState ===
            "IDENTITY_UNKNOWN"
        ) {

            setStatus(
                "✅ CKI elmentve. Állapot: IDENTITY_UNKNOWN (nincs stabil conversation_url).",
                "warning"
            );

        }
        else {

            setStatus(
                "✅ CKI sikeresen elmentve. Állapot: NEW.",
                "success"
            );

        }

        return {
            success: true,
            state:
                identityState ===
                    "IDENTITY_UNKNOWN"
                    ? "IDENTITY_UNKNOWN"
                    : "NEW"
        };

    }


    let error = {};

    try {
        error = await response.json();
    }
    catch {
        error = {
            message:
                await response.text()
        };
    }


    if (error.code === "23505") {

        setStatus(
            "⚠️ Az adatbázis egyedi korlátozása ütközést jelzett. Az ütköző rekordot nem írtuk felül.",
            "warning"
        );

        return {
            success: false,
            state: "EXISTENCE_CONFLICT",
            error
        };

    }


    setStatus(
        "❌ " +
        (
            error.message ??
            "Ismeretlen Supabase hiba."
        ),
        "error"
    );


    return {
        success: false,
        state: "ERROR",
        error
    };

}


async function saveToSupabase(record) {

    try {

        const rawUrl =
            record.conversation_url;

        const conversationUrl =
            typeof rawUrl === "string"
                ? rawUrl.trim()
                : null;


        /*
        --------------------------------------------------
        IDENTITY_UNKNOWN
        --------------------------------------------------
        No stable URL means no inferred identity.
        The record may still be stored, but no duplicate or
        overwrite decision is inferred from other fields.
        --------------------------------------------------
        */

        if (!conversationUrl) {

            return await insertCKIRecord(
                {
                    ...record,
                    conversation_url: null
                },
                "IDENTITY_UNKNOWN"
            );

        }


        /*
        --------------------------------------------------
        EXISTENCE CHECK
        --------------------------------------------------
        --------------------------------------------------
        */

        const lookupResponse =
            await fetch(
                CONFIG.SUPABASE_URL +
                "/rest/v1/" +
                CONFIG.TABLE +
                "?conversation_url=eq." +
                encodeURIComponent(
                    conversationUrl
                ) +
                "&select=id,cki_json",
                {
                    method: "GET",

                    headers: {
                        apikey:
                            CONFIG.SUPABASE_ANON_KEY,

                        Authorization:
                            "Bearer " +
                            CONFIG.SUPABASE_ANON_KEY
                    }
                }
            );


        if (!lookupResponse.ok) {

            const error =
                await lookupResponse.text();

            setStatus(
                "❌ CKI existence check hiba: " +
                error,
                "error"
            );

            return {
                success: false,
                state: "ERROR"
            };

        }


        const existing =
            await lookupResponse.json();


        /*
        --------------------------------------------------
        NEW
        --------------------------------------------------
        */

        if (existing.length === 0) {

            return await insertCKIRecord(
                {
                    ...record,
                    conversation_url:
                        conversationUrl
                },
                "NEW"
            );

        }


        /*
        --------------------------------------------------
        CANONICAL JSON COMPARISON
        --------------------------------------------------
        */

        const incomingCanonical =
            canonicalJSONStringify(
                record.raw_json
            );


        const exactDuplicate =
            existing.some(
                row => {

                    if (
                        row.cki_json ===
                        null ||
                        row.cki_json ===
                        undefined
                    ) {
                        return false;
                    }


                    const existingJSON =
                        canonicalCKIComparisonValue(
                            row.cki_json
                        );


                    return (
                        canonicalJSONStringify(
                            existingJSON
                        ) ===
                        incomingCanonical
                    );

                }
            );


        if (exactDuplicate) {

            setStatus(
                "⚠️ Ez a CKI már szerepel az adatbázisban. Állapot: EXACT_DUPLICATE. Nincs új INSERT.",
                "warning"
            );

            return {
                success: true,
                state: "EXACT_DUPLICATE"
            };

        }


        /*
        --------------------------------------------------
        UPDATE_CANDIDATE
        --------------------------------------------------
        Azonos URL + eltérő canonical JSON.
        Nincs automatikus overwrite.
        --------------------------------------------------
        */

        setStatus(
            "⚠️ Azonos conversation_url mellett eltérő CKI található. Állapot: UPDATE_CANDIDATE. Automatikus felülírás nem történt.",
            "warning"
        );


        return {
            success: true,
            state: "UPDATE_CANDIDATE",
            existing_count:
                existing.length
        };

    }
    catch (err) {

        console.error(
            "CKI mentési hiba:",
            err
        );

        setStatus(
            "❌ " +
            (
                err?.message ??
                String(err)
            ),
            "error"
        );

        return {
            success: false,
            state: "ERROR",
            error: err
        };

    }

}
