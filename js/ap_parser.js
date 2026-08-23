/*
==========================================================
MAG v0.1
ap_parser.js
Article Profile Import Parser
==========================================================
*/


function normalizeAPInput(text) {

    if (!text) return "";

    let t = text;

    // BOM eltávolítása
    t = t.replace(/^\uFEFF/, "");

    // Markdown code block eleje
    t = t.replace(/^```(?:json)?\s*/i, "");

    // Markdown code block vége
    t = t.replace(/\s*```$/i, "");

    // Windows sortörések
    t = t.replace(/\r\n/g, "\n");

    return t.trim();

}


function validateAPStructure(json) {

    const errors = [];

    if (!json.schema_version)
        errors.push("Hiányzik: schema_version");

    if (!json.language)
        errors.push("Hiányzik: language");

    if (!json.content_type)
        errors.push("Hiányzik: content_type");

    if (!json.source)
        errors.push("Hiányzik: source");

    if (!json.source?.url)
        errors.push("Hiányzik: source.url");

    if (!json.identity)
        errors.push("Hiányzik: identity");

    if (!json.identity?.title)
        errors.push("Hiányzik: identity.title");

    if (!json.content)
        errors.push("Hiányzik: content");

    if (!json.content?.summary)
        errors.push("Hiányzik: content.summary");

    if (!json.reader_journey)
        errors.push("Hiányzik: reader_journey");

    if (!json.seo)
        errors.push("Hiányzik: seo");

    if (!json.status)
        errors.push("Hiányzik: status");

    return errors;

}


function buildAPRecord(json) {

    return {

        object: {

            canonical_url:
                json.source?.url ?? null,

            slug:
                json.identity?.slug ?? null,

            content_type:
                json.identity?.content_type ??
                json.content_type ??
                null,

            title:
                json.identity?.title ?? null,

            h1:
                json.identity?.h1 ?? null,

            status:
                json.status?.profile_status ??
                "active",

            date_published:
                json.identity?.publication_date ?? null,

            date_modified:
                json.identity?.modified_date ?? null,

            retrieved_at:
                json.source?.retrieval?.retrieved_at ?? null

        },

        profile: {

            schema_version:
                json.schema_version ?? null,

            language:
                json.language ?? null,

            content_type:
                json.content_type ?? null,

            summary:
                json.content?.summary ?? null,

            core_question:
                json.content?.core_question ?? null,

            reader_problem:
                json.content?.reader_problem ?? null,

            reader_recognition:
                json.content?.reader_recognition ?? null,

            core_insight:
                json.content?.core_insight ?? null,

            key_concepts:
                json.content?.key_concepts ?? [],

            themes:
                json.content?.themes ?? [],

            emotional_territory:
                json.content?.emotional_territory ?? [],

            reader_intent:
                json.content?.reader_intent ?? [],

            content_role:
                json.content?.content_role ?? [],

            entry_point:
                json.reader_journey?.entry_point ?? null,

            reader_state:
                json.reader_journey?.reader_state ?? null,

            direction_after_reading:
                json.reader_journey?.direction_after_reading ?? null,

            possible_next_questions:
                json.reader_journey?.possible_next_questions ?? [],

            natural_next_steps:
                json.reader_journey?.natural_next_steps ?? [],

            primary_topic:
                json.seo?.primary_topic ?? null,

            secondary_topics:
                json.seo?.secondary_topics ?? [],

            search_intent:
                json.seo?.search_intent ?? null,

            entities:
                json.seo?.entities ?? [],

            brand_alignment:
                json.content_quality?.brand_alignment ?? null,

            conceptual_clarity:
                json.content_quality?.conceptual_clarity ?? null,

            currentness:
                json.content_quality?.currentness ?? null,

            reusability:
                json.content_quality?.reusability ?? null,

            notes:
                json.content_quality?.notes ?? null,

            source_retrieval:
                json.source?.retrieval ?? {},

            source_validation:
                json.source_validation ?? {},

            information_sources:
                json.information_sources ?? []

        },

        raw_json: json

    };

}


function parseAP(text) {

    const result = {

        success: false,

        record: null,

        version: "ismeretlen",

        errors: [],

        warnings: []

    };


    try {

        const normalized =
            normalizeAPInput(text);

        const json =
            JSON.parse(normalized);


        if (json.schema_version) {

            result.version =
                json.schema_version;

        }


        const validationErrors =
            validateAPStructure(json);


        if (validationErrors.length > 0) {

            result.errors =
                validationErrors;

            return result;

        }


        result.record =
            buildAPRecord(json);
console.log(
    "AP parser retrieved_at:",
    result.record.object.retrieved_at
);
        result.success = true;


        return result;

    }

    catch (err) {

        result.errors.push(
            err.message
        );

        return result;

    }

}