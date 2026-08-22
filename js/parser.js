/*
==========================================================
MAG v0.2
parser.js
==========================================================
*/


function normalizeInput(text) {

    if (!text) return "";

    let t = text;

    // BOM eltávolítása
    t = t.replace(/^\uFEFF/, "");

    // Markdown code block eleje
    t = t.replace(/^```(?:json)?\s*/i, "");

    // Markdown code block vége
    t = t.replace(/\s*```$/i, "");

    // ChatGPT contentReference maradványok
    t = t.replace(/:contentReference.*$/gm, "");

    // Windows sortörések
    t = t.replace(/\r\n/g, "\n");

    return t.trim();

}


/*
==========================================================
JSON SZINTAKTIKAI JAVÍTÁS
==========================================================
Csak olyan hibát javítunk, amely egyértelműen
JSON-szintaktikai hiba.

A tartalmat és a CKI struktúrát nem módosítjuk.
==========================================================
*/

function repairJSONSyntax(text) {

    let repaired = text;

    /*
    Hibás escape-ek javítása.

    Például:
    "source\_metadata"

    helyett:
    "source_metadata"

    A JSON-ban az "_" nem escape-elhető karakter,
    ezért a \_ egyértelmű szintaktikai hiba.
    */

    repaired = repaired.replace(
        /\\([^"\\/bfnrtu])/g,
        "$1"
    );

    return repaired;

}


/*
==========================================================
CKI STRUCTURE VALIDATION
==========================================================
*/

function validateCKIStructure(json) {

    const errors = [];

    if (!json.source_metadata)
        errors.push("Hiányzik: source_metadata");

    if (!json.processing_metadata)
        errors.push("Hiányzik: processing_metadata");

    if (!json.summary)
        errors.push("Hiányzik: summary");

    if (!json.topics)
        errors.push("Hiányzik: topics");

    if (!json.topics?.primary)
        errors.push("Hiányzik: topics.primary");

    return errors;

}


/*
==========================================================
BUILD RECORD
==========================================================
*/

function buildRecord(json) {

    return {

        source:
            json.source_metadata?.source ?? null,

        conversation_url:
            json.source_metadata?.conversation_url ?? null,

        chat_title:
            json.source_metadata?.chat_title ?? null,

        logical_title:
            json.source_metadata?.logical_title ?? null,

        conversation_start:
            json.source_metadata?.conversation_start ?? null,

        cki_spec_version:
            json.processing_metadata?.cki_spec_version ?? null,

        context_scope:
            json.processing_metadata?.context_scope ?? null,

        context_confidence:
            json.processing_metadata?.context_confidence ?? null,

        coverage_assessment:
            json.processing_metadata?.coverage_assessment ?? null,

        summary:
            json.summary ?? "",

        retrieval_summary:
            json.retrieval_summary ?? "",

        primary_topic:
            json.topics?.primary ?? "",

        secondary_topics:
            json.topics?.secondary ?? [],

        keywords:
            json.topics?.keywords ?? [],

        systems:
            json.systems ?? [],

        knowledge_objects:
            json.knowledge_objects ?? [],

        raw_json:
            json

    };

}


/*
==========================================================
PARSE CKI
==========================================================
*/

function parseCKI(text) {

    const result = {

        success: false,

        record: null,

        version: "ismeretlen",

        errors: [],

        warnings: [],

        repaired: false,

        repairedText: null

    };


    try {

        const normalized =
            normalizeInput(text);


        let json;


        /*
        --------------------------------------------------
        1. Eredeti JSON megpróbálása
        --------------------------------------------------
        */

        try {

            json = JSON.parse(normalized);

        }

        catch (firstError) {

            /*
            --------------------------------------------------
            2. Csak szintaktikai javítás
            --------------------------------------------------
            */

            const repaired =
                repairJSONSyntax(normalized);


            /*
            Ha a javítás nem változtatott semmin,
            nincs mit automatikusan javítani.
            */

            if (repaired === normalized) {

                result.errors.push(firstError.message);

                return result;

            }


            /*
            --------------------------------------------------
            3. A javított JSON újra parse-olása
            --------------------------------------------------
            */

            try {

                json = JSON.parse(repaired);

                result.repaired = true;

                result.repairedText =
                    JSON.stringify(json, null, 2);

                return result;    

            }

            catch (secondError) {

                result.errors.push(
                    "A JSON szintaktikai hibája nem javítható automatikusan tartalmi módosítás nélkül."
                );

                return result;

            }

        }


        /*
        --------------------------------------------------
        CKI verzió meghatározása
        --------------------------------------------------
        */

        if (json.processing_metadata?.cki_spec_version) {

            result.version =
                json.processing_metadata.cki_spec_version;

        }

        else if (json.metadata) {

            result.version =
                "1.1 vagy régebbi";

        }


        /*
        --------------------------------------------------
        MEGLÉVŐ CKI VALIDÁCIÓ
        --------------------------------------------------
        */

        const validationErrors =
            validateCKIStructure(json);


        if (validationErrors.length > 0) {

            result.errors =
                validationErrors;

            return result;

        }


        /*
        --------------------------------------------------
        RECORD ÉPÍTÉSE
        --------------------------------------------------
        */

        result.record =
            buildRecord(json);

        result.success =
            true;


        return result;

    }


    catch (err) {

        result.errors.push(
            err.message
        );

        return result;

    }

}