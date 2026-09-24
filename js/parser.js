/*
==========================================================
MAG v0.2.2
parser.js
==========================================================

CKI input contract:
- canonical CKI v1.2 only
- JSON may be direct, fenced, or embedded in prose
- validation is strict: non-v1.2 structures are rejected
- legacy source_metadata / processing_metadata are NOT
  treated as canonical CKI v1.2
==========================================================
*/

const CKI_CANONICAL_VERSION = "1.2";


function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}


function looksLikeCanonicalCKI(json) {

    return isObject(json) &&
        isObject(json.metadata) &&
        Object.prototype.hasOwnProperty.call(json, "summary") &&
        Object.prototype.hasOwnProperty.call(json, "retrieval_summary") &&
        isObject(json.topics) &&
        Boolean(json.topics.primary);
}


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

    // 2. Fenced JSON blocks.
    const fenced = /```(?:json)?\s*([\s\S]*?)```/gi;
    const fencedCandidates = [];
    let match;

    while ((match = fenced.exec(source)) !== null) {

        const candidate = match[1].trim();

        try {
            const parsed = JSON.parse(candidate);
            fencedCandidates.push({ text: candidate, json: parsed });
        }
        catch {}
    }

    const canonicalFenced = fencedCandidates.find(
        item => looksLikeCanonicalCKI(item.json)
    );

    if (canonicalFenced)
        return canonicalFenced.text;

    if (fencedCandidates.length === 1)
        return fencedCandidates[0].text;

    // 3. Balanced-object extraction from surrounding prose.
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

        if (ch === "{") depth++;
        if (ch === "}") depth--;

        if (depth === 0) {

            const candidate = source.slice(start, i + 1);

            try {
                const parsed = JSON.parse(candidate);

                if (looksLikeCanonicalCKI(parsed))
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
A CKI struktúrát és tartalmat nem alakítjuk át.
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
CKI v1.2 VALIDATION
==========================================================
*/

function getCKIVersion(json) {

    if (json?.cki_spec_version)
        return String(json.cki_spec_version);

    if (json?.processing_metadata?.cki_spec_version)
        return String(json.processing_metadata.cki_spec_version);

    if (json?.metadata?.cki_spec_version)
        return String(json.metadata.cki_spec_version);

    if (looksLikeCanonicalCKI(json))
        return CKI_CANONICAL_VERSION;

    return "ismeretlen";
}


function validateCKIStructure(json) {

    const errors = [];

    if (!isObject(json)) {
        errors.push("A bemenet nem objektum.");
        return errors;
    }

    // Canonical CKI v1.2 requires root.metadata.
    if (!isObject(json.metadata))
        errors.push("Nem CKI v1.2: hiányzik a root.metadata.");

    // Legacy MAG v1.1-shaped input must not be silently upgraded.
    if (json.source_metadata || json.processing_metadata) {
        errors.push("Nem CKI v1.2: legacy source_metadata/processing_metadata szerkezet.");
    }

    if (!Object.prototype.hasOwnProperty.call(json, "summary"))
        errors.push("Nem CKI v1.2: hiányzik a summary.");

    if (!Object.prototype.hasOwnProperty.call(json, "retrieval_summary"))
        errors.push("Nem CKI v1.2: hiányzik a retrieval_summary.");

    if (!isObject(json.topics))
        errors.push("Nem CKI v1.2: hiányzik a topics.");

    if (!json?.topics?.primary)
        errors.push("Nem CKI v1.2: hiányzik a topics.primary.");

    return errors;
}


/*
==========================================================
BUILD RECORD
==========================================================
*/

function buildRecord(json) {

    const metadata = json.metadata || {};

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
            getCKIVersion(json),

        context_scope:
            metadata.context_scope ?? null,

        context_confidence:
            metadata.context_confidence ?? null,

        coverage_assessment:
            metadata.coverage_assessment ?? null,

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

        const normalized = normalizeInput(text);
        let json;

        // 1. Original JSON.
        try {
            json = JSON.parse(normalized);
        }
        catch (firstError) {

            // 2. Syntax-only repair.
            const repaired = repairJSONSyntax(normalized);

            if (repaired === normalized) {
                result.errors.push(firstError.message);
                return result;
            }

            try {
                json = JSON.parse(repaired);
                result.repaired = true;
                result.repairedText = JSON.stringify(json, null, 2);
            }
            catch {
                result.errors.push(
                    "A JSON szintaktikai hibája nem javítható automatikusan tartalmi módosítás nélkül."
                );
                return result;
            }
        }

        result.version = getCKIVersion(json);

        const validationErrors = validateCKIStructure(json);

        if (validationErrors.length > 0) {
            result.errors = validationErrors;
            return result;
        }

        result.record = buildRecord(json);
        result.success = true;

        return result;

    }
    catch (err) {
        result.errors.push(err.message);
        return result;
    }
}
