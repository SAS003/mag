/*
==========================================================
MAG v0.2.1
parser.js
==========================================================

CKI input compatibility:
- canonical CKI v1.2: root.metadata
- legacy MAG structure: root.source_metadata + root.processing_metadata
- ChatGPT wrapper: root.cki_json
- mixed Markdown/prose containing one CKI JSON object
==========================================================
*/

const CKI_CANONICAL_VERSION = "1.2";


function extractJSONCandidate(text) {

    const source = String(text ?? "")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/:contentReference.*$/gm, "")
        .trim();

    // 1. Direct JSON input.
    try {

        JSON.parse(source);

        return source;

    }

    catch {}

    // 2. Prefer fenced JSON blocks that contain a CKI-shaped object.
    const fenced = /\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/gi;
    const fencedCandidates = [];

    let match;

    while ((match = fenced.exec(source)) !== null) {

        const candidate =
            match[1].trim();

        try {

            const parsed =
                JSON.parse(candidate);

            fencedCandidates.push({
                text: candidate,
                json: parsed
            });

        }

        catch {}

    }


    const isCKIShaped = (json) => {

        if (
            !json ||
            typeof json !== "object" ||
            Array.isArray(json)
        ) {

            return false;

        }

        return Boolean(
            json.metadata ||
            json.source_metadata ||
            json.cki_json ||
            json.topics ||
            json.summary
        );

    };


    const ckiFenced =
        fencedCandidates.find(
            item => isCKIShaped(item.json)
        );


    if (ckiFenced)
        return ckiFenced.text;


    if (fencedCandidates.length === 1)
        return fencedCandidates[0].text;


    // 3. Balanced-object extraction for Markdown/prose without code fences.
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;


    for (let i = 0; i < source.length; i++) {

        const ch = source[i];


        if (start === -1) {

            if (ch === "{") {

                start = i;
                depth = 1;
                inString = false;
                escaped = false;

            }

            continue;

        }


        if (escaped) {

            escaped = false;

            continue;

        }


        if (ch === "\\" && inString) {

            escaped = true;

            continue;

        }


        if (ch === '"') {

            inString = !inString;

            continue;

        }


        if (inString)
            continue;


        if (ch === "{")
            depth++;


        if (ch === "}")
            depth--;


        if (depth === 0) {

            const candidate =
                source.slice(start, i + 1);

            try {

                const parsed =
                    JSON.parse(candidate);

                if (isCKIShaped(parsed))
                    return candidate;

            }

            catch {}

            start = -1;

        }

    }


    return source;

}


function normalizeInput(text) {

    if (!text) return "";

    return extractJSONCandidate(text).trim();

}


/*
==========================================================
JSON SZINTAKTIKAI JAVÍTÁS
==========================================================

Csak egyértelmű JSON-szintaktikai hibát javítunk.
A CKI tartalmát nem generáljuk újra.
==========================================================
*/

function repairJSONSyntax(text) {

    let repaired = text;


    repaired = repaired.replace(
        /\\([^"\\\/bfnrtu])/g,
        "$1"
    );


    repaired = repaired.replace(
        /,\s*([}\]])/g,
        "$1"
    );


    return repaired;

}


/*
==========================================================
CKI ENVELOPE / SCHEMA RESOLUTION
==========================================================
*/

function unwrapCKIEnvelope(json) {

    if (
        json &&
        typeof json === "object" &&
        !Array.isArray(json) &&
        json.cki_json &&
        typeof json.cki_json === "object" &&
        !Array.isArray(json.cki_json) &&
        !json.metadata &&
        !json.source_metadata
    ) {

        return json.cki_json;

    }


    return json;

}


function getMetadata(json) {

    if (
        json?.metadata &&
        typeof json.metadata === "object"
    ) {

        return json.metadata;

    }


    // Backward compatibility with the former MAG-side structure.
    if (
        json?.source_metadata &&
        typeof json.source_metadata === "object"
    ) {

        return json.source_metadata;

    }


    return null;

}


function getCKIVersion(json) {

    if (json?.cki_spec_version)
        return String(json.cki_spec_version);


    if (json?.processing_metadata?.cki_spec_version)
        return String(json.processing_metadata.cki_spec_version);


    if (json?.metadata?.cki_spec_version)
        return String(json.metadata.cki_spec_version);


    // Canonical CKI v1.2 is identified structurally because the
    // specification itself defines version 1.2 but does not require
    // a cki_spec_version property in every record.
    if (
        json?.metadata &&
        json?.topics &&
        Object.prototype.hasOwnProperty.call(
            json,
            "retrieval_summary"
        )
    ) {

        return CKI_CANONICAL_VERSION;

    }


    return "ismeretlen";

}


function validateCKIStructure(json) {

    const errors = [];
    const metadata = getMetadata(json);


    if (!metadata)
        errors.push("Hiányzik: metadata");


    if (
        !Object.prototype.hasOwnProperty.call(
            json ?? {},
            "summary"
        )
    ) {

        errors.push("Hiányzik: summary");

    }


    if (!json?.topics)
        errors.push("Hiányzik: topics");


    if (!json?.topics?.primary)
        errors.push("Hiányzik: topics.primary");


    return errors;

}


/*
==========================================================
CANONICALIZATION
==========================================================
*/

function canonicalizeCKI(json) {

    const source =
        unwrapCKIEnvelope(json);


    if (
        !source ||
        typeof source !== "object" ||
        Array.isArray(source)
    ) {

        return source;

    }


    if (
        source.metadata &&
        !source.source_metadata
    ) {

        return source;

    }


    // Legacy -> canonical metadata mapping.
    if (source.source_metadata) {

        const metadata = {
            ...(source.source_metadata || {})
        };


        if (source.processing_metadata) {

            for (const key of [
                "context_scope",
                "context_confidence",
                "coverage_assessment"
            ]) {

                if (
                    metadata[key] == null &&
                    source.processing_metadata[key] != null
                ) {

                    metadata[key] =
                        source.processing_metadata[key];

                }

            }

        }


        const canonical = {
            ...source,
            metadata
        };


        delete canonical.source_metadata;
        delete canonical.processing_metadata;


        return canonical;

    }


    return source;

}


/*
==========================================================
BUILD RECORD
==========================================================
*/

function buildRecord(json) {

    const canonical =
        canonicalizeCKI(json);

    const metadata =
        getMetadata(canonical) || {};

    const version =
        getCKIVersion(json);


    return {

        source:
            metadata.source ?? null,

        conversation_url:
            metadata.conversation_url ?? null,

        chat_title:
            metadata.chat_title ?? null,

        logical_title:
            metadata.logical_title ?? null,

        conversation_start:
            metadata.conversation_start ?? null,

        cki_spec_version:
            version,

        context_scope:
            metadata.context_scope ?? null,

        context_confidence:
            metadata.context_confidence ?? null,

        coverage_assessment:
            metadata.coverage_assessment ?? null,

        summary:
            canonical.summary ?? "",

        retrieval_summary:
            canonical.retrieval_summary ?? "",

        primary_topic:
            canonical.topics?.primary ?? "",

        secondary_topics:
            canonical.topics?.secondary ?? [],

        keywords:
            canonical.topics?.keywords ?? [],

        systems:
            canonical.systems ?? [],

        knowledge_objects:
            canonical.knowledge_objects ?? [],

        raw_json:
            canonical

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

            json =
                JSON.parse(normalized);

        }

        catch (firstError) {

            /*
            --------------------------------------------------
            2. Csak szintaktikai javítás
            --------------------------------------------------
            */

            const repaired =
                repairJSONSyntax(normalized);


            if (repaired === normalized) {

                result.errors.push(
                    firstError.message
                );

                return result;

            }


            /*
            --------------------------------------------------
            3. Javított JSON újra parse-olása
            --------------------------------------------------
            */

            try {

                json =
                    JSON.parse(repaired);

                result.repaired = true;

                result.repairedText =
                    JSON.stringify(
                        canonicalizeCKI(json),
                        null,
                        2
                    );

            }

            catch {

                result.errors.push(
                    "A JSON szintaktikai hibája nem javítható automatikusan tartalmi módosítás nélkül."
                );

                return result;

            }

        }


        json =
            unwrapCKIEnvelope(json);


        result.version =
            getCKIVersion(json);


        const validationErrors =
            validateCKIStructure(json);


        if (validationErrors.length > 0) {

            result.errors =
                validationErrors;

            return result;

        }


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
