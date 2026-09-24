/*
==========================================================
MAG v0.2.3
parser.js
==========================================================

CKI input contract:
- canonical CKI v1.3 only
- JSON may be direct, fenced, or embedded in prose
- syntax-only repair is allowed
- schema migration/repair is forbidden
- legacy source_metadata / processing_metadata are rejected
==========================================================
*/

const CKI_CANONICAL_VERSION = "1.3";

const CKI_ROOT_REQUIRED_FIELDS = [
    "metadata",
    "summary",
    "retrieval_summary",
    "topics",
    "discussion_topics",
    "activities",
    "results",
    "key_decisions",
    "outputs",
    "open_ideas",
    "ai_tags",
    "side_threads",
    "knowledge",
    "emerging_patterns",
    "systems",
    "references",
    "search_questions",
    "knowledge_objects"
];

const CKI_METADATA_REQUIRED_FIELDS = [
    "source",
    "conversation_url",
    "chat_title",
    "logical_title",
    "conversation_start",
    "cki_spec_version",
    "context_scope",
    "context_confidence",
    "coverage_assessment",
    "embedded_cki_export_count"
];

const CKI_ROOT_ARRAY_FIELDS = [
    "discussion_topics",
    "activities",
    "results",
    "key_decisions",
    "outputs",
    "open_ideas",
    "ai_tags",
    "side_threads",
    "emerging_patterns",
    "systems",
    "search_questions",
    "knowledge_objects"
];

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function isStringOrNull(value) {
    return value === null || typeof value === "string";
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function looksLikeCanonicalCKI(json) {
    return isObject(json) &&
        isObject(json.metadata) &&
        json.metadata.cki_spec_version === CKI_CANONICAL_VERSION &&
        hasOwn(json, "summary") &&
        hasOwn(json, "retrieval_summary") &&
        isObject(json.topics) &&
        hasOwn(json.topics, "primary");
}

function looksLikeCKIStructural(json) {
    return isObject(json) &&
        isObject(json.metadata) &&
        hasOwn(json.metadata, "cki_spec_version") &&
        hasOwn(json, "retrieval_summary") &&
        isObject(json.topics);
}

function extractJSONCandidate(text) {
    const source = String(text ?? "")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/:contentReference.*$/gm, "")
        .trim();

    try {
        JSON.parse(source);
        return source;
    }
    catch {}

    const fenced = new RegExp(
        String.fromCharCode(96, 96, 96) +
        "(?:json)?\\s*([\\s\\S]*?)" +
        String.fromCharCode(96, 96, 96),
        "gi"
    );

    const fencedCandidates = [];
    let match;

    while ((match = fenced.exec(source)) !== null) {
        const candidate = match[1].trim();

        try {
            const parsed = JSON.parse(candidate);
            fencedCandidates.push({
                text: candidate,
                json: parsed
            });
        }
        catch {}
    }

    const canonicalFenced =
        fencedCandidates.find(
            item => looksLikeCanonicalCKI(item.json)
        );

    if (canonicalFenced)
        return canonicalFenced.text;

    const ckiFenced =
        fencedCandidates.find(
            item => looksLikeCKIStructural(item.json)
        );

    if (ckiFenced)
        return ckiFenced.text;

    if (fencedCandidates.length === 1)
        return fencedCandidates[0].text;

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
                const parsed = JSON.parse(candidate);

                if (
                    looksLikeCanonicalCKI(parsed) ||
                    looksLikeCKIStructural(parsed)
                ) {
                    return candidate;
                }
            }
            catch {}

            start = -1;
        }
    }

    return source;
}

function normalizeInput(text) {
    if (!text)
        return "";

    return extractJSONCandidate(text).trim();
}

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

function getCKIVersion(json) {
    if (
        isObject(json?.metadata) &&
        hasOwn(json.metadata, "cki_spec_version")
    ) {
        return String(
            json.metadata.cki_spec_version
        );
    }

    return "ismeretlen";
}

function validateCKIStructure(json) {
    const errors = [];

    if (!isObject(json)) {
        errors.push("A bemenet nem JSON objektum.");
        return errors;
    }

    for (const field of CKI_ROOT_REQUIRED_FIELDS) {
        if (!hasOwn(json, field))
            errors.push("Hiányzik a root." + field + ".");
    }

    if (hasOwn(json, "source_metadata")) {
        errors.push(
            "Nem canonical CKI v1.3: source_metadata nem megengedett."
        );
    }

    if (hasOwn(json, "processing_metadata")) {
        errors.push(
            "Nem canonical CKI v1.3: processing_metadata nem megengedett."
        );
    }

    if (!isObject(json.metadata)) {
        errors.push("A root.metadata nem objektum.");
    }
    else {
        for (const field of CKI_METADATA_REQUIRED_FIELDS) {
            if (!hasOwn(json.metadata, field)) {
                errors.push(
                    "Hiányzik a metadata." + field + "."
                );
            }
        }

        if (
            json.metadata.cki_spec_version !==
            CKI_CANONICAL_VERSION
        ) {
            errors.push(
                "Érvénytelen CKI verzió: metadata.cki_spec_version = " +
                String(json.metadata.cki_spec_version) +
                ", elvárt: 1.3."
            );
        }

        const embeddedCount =
            json.metadata.embedded_cki_export_count;

        if (
            embeddedCount !== null &&
            (
                !Number.isInteger(embeddedCount) ||
                embeddedCount < 0
            )
        ) {
            errors.push(
                "Érvénytelen metadata.embedded_cki_export_count: null vagy 0-nál nagyobb/egyenlő egész szám kell."
            );
        }

        if (!isStringOrNull(json.metadata.source)) {
            errors.push(
                "A metadata.source string vagy null lehet."
            );
        }

        for (const field of [
            "conversation_url",
            "chat_title",
            "logical_title",
            "conversation_start",
            "coverage_assessment"
        ]) {
            if (!isStringOrNull(json.metadata[field])) {
                errors.push(
                    "A metadata." + field +
                    " string vagy null lehet."
                );
            }
        }

        if (
            json.metadata.context_scope !== null &&
            ![
                "current_context",
                "full_export",
                "partial_document",
                "other"
            ].includes(json.metadata.context_scope)
        ) {
            errors.push(
                "Érvénytelen metadata.context_scope."
            );
        }

        if (
            json.metadata.context_confidence !== null &&
            ![
                "very_high",
                "high",
                "medium",
                "low",
                "very_low"
            ].includes(json.metadata.context_confidence)
        ) {
            errors.push(
                "Érvénytelen metadata.context_confidence."
            );
        }
    }

    if (typeof json.summary !== "string") {
        errors.push(
            "A summary mező string kell legyen."
        );
    }

    if (typeof json.retrieval_summary !== "string") {
        errors.push(
            "A retrieval_summary mező string kell legyen."
        );
    }

    if (!isObject(json.topics)) {
        errors.push(
            "A topics mező objektum kell legyen."
        );
    }
    else {
        if (typeof json.topics.primary !== "string") {
            errors.push(
                "A topics.primary mező string kell legyen."
            );
        }

        if (!Array.isArray(json.topics.secondary)) {
            errors.push(
                "A topics.secondary mező tömb kell legyen."
            );
        }

        if (!Array.isArray(json.topics.keywords)) {
            errors.push(
                "A topics.keywords mező tömb kell legyen."
            );
        }
    }

    for (const field of CKI_ROOT_ARRAY_FIELDS) {
        if (!Array.isArray(json[field])) {
            errors.push(
                "A root." + field + " mező tömb kell legyen."
            );
        }
    }

    if (!isObject(json.knowledge)) {
        errors.push(
            "A knowledge mező objektum kell legyen."
        );
    }
    else {
        for (const field of [
            "new",
            "refined",
            "rejected"
        ]) {
            if (!Array.isArray(json.knowledge[field])) {
                errors.push(
                    "A knowledge." + field +
                    " mező tömb kell legyen."
                );
            }
        }
    }

    if (!isObject(json.references)) {
        errors.push(
            "A references mező objektum kell legyen."
        );
    }
    else {
        for (const field of [
            "documents",
            "rfcs",
            "prompts",
            "external"
        ]) {
            if (!Array.isArray(json.references[field])) {
                errors.push(
                    "A references." + field +
                    " mező tömb kell legyen."
                );
            }
        }
    }

    return errors;
}

function buildRecord(json) {
    const metadata = json.metadata;

    return {
        source: metadata.source ?? null,
        conversation_url: metadata.conversation_url ?? null,
        chat_title: metadata.chat_title ?? null,
        logical_title: metadata.logical_title ?? null,
        conversation_start: metadata.conversation_start ?? null,
        cki_spec_version: metadata.cki_spec_version,
        context_scope: metadata.context_scope ?? null,
        context_confidence: metadata.context_confidence ?? null,
        coverage_assessment: metadata.coverage_assessment ?? null,
        embedded_cki_export_count:
            metadata.embedded_cki_export_count,
        summary: json.summary,
        retrieval_summary: json.retrieval_summary,
        primary_topic: json.topics.primary,
        secondary_topics: json.topics.secondary,
        keywords: json.topics.keywords,
        systems: json.systems,
        knowledge_objects: json.knowledge_objects,
        raw_json: json
    };
}

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

        try {
            json = JSON.parse(normalized);
        }
        catch (firstError) {
            const repaired =
                repairJSONSyntax(normalized);

            if (repaired === normalized) {
                result.errors.push(
                    firstError.message
                );
                return result;
            }

            try {
                json = JSON.parse(repaired);
                result.repaired = true;
                result.repairedText =
                    JSON.stringify(
                        json,
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

        result.success = true;

        return result;
    }
    catch (err) {
        result.errors.push(
            err?.message ??
            String(err)
        );
        return result;
    }
}
