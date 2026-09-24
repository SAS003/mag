/*
MAG v0.2.4
ingest.js
Common, type-neutral input detection.
*/
const MAG_CONTENT_TYPES = Object.freeze({ CKI: "CKI", AP: "AP" });
const MAG_DETECTION_STATUSES = Object.freeze({
    DETECTED: "DETECTED",
    UNKNOWN: "UNKNOWN",
    AMBIGUOUS: "AMBIGUOUS"
});

function hasKeyToken(text, key) {
    const escaped = key.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
    return new RegExp('"' + escaped + '"\\s*:').test(text);
}

function hasValueToken(text, key, value) {
    const escapedKey = key.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
    const escapedValue = value.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
    return new RegExp(
        '"' + escapedKey + '"\\s*:\\s*"' + escapedValue + '"',
        "i"
    ).test(text);
}

function detectContentType(input) {
    const raw = String(input ?? "")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .trim();

    if (!raw) {
        return {
            detected_type: null,
            detection_status: MAG_DETECTION_STATUSES.UNKNOWN,
            detection_evidence: ["Üres bemenet."]
        };
    }

    const ckiEvidence = [];
    const apEvidence = [];

    if (hasKeyToken(raw, "metadata")) ckiEvidence.push("root.metadata");
    if (hasKeyToken(raw, "cki_spec_version")) ckiEvidence.push("metadata.cki_spec_version");
    if (hasKeyToken(raw, "retrieval_summary")) ckiEvidence.push("retrieval_summary");
    if (hasKeyToken(raw, "topics") && hasKeyToken(raw, "primary")) ckiEvidence.push("topics.primary");

    if (hasKeyToken(raw, "schema_version")) apEvidence.push("schema_version");
    if (hasValueToken(raw, "content_type", "article_profile")) apEvidence.push("content_type=article_profile");
    if (hasKeyToken(raw, "source") && hasKeyToken(raw, "url")) apEvidence.push("source.url");
    if (hasKeyToken(raw, "identity")) apEvidence.push("identity");

    const ckiDetected =
        ckiEvidence.includes("root.metadata") &&
        ckiEvidence.includes("metadata.cki_spec_version") &&
        ckiEvidence.includes("retrieval_summary") &&
        ckiEvidence.includes("topics.primary");

    const apDetected =
        apEvidence.includes("schema_version") &&
        apEvidence.includes("content_type=article_profile") &&
        apEvidence.includes("source.url") &&
        apEvidence.includes("identity");

    if (ckiDetected && apDetected) {
        return {
            detected_type: null,
            detection_status: MAG_DETECTION_STATUSES.AMBIGUOUS,
            detection_evidence: [
                "CKI: " + ckiEvidence.join(", "),
                "AP: " + apEvidence.join(", ")
            ]
        };
    }

    if (ckiDetected) {
        return {
            detected_type: MAG_CONTENT_TYPES.CKI,
            detection_status: MAG_DETECTION_STATUSES.DETECTED,
            detection_evidence: ckiEvidence
        };
    }

    if (apDetected) {
        return {
            detected_type: MAG_CONTENT_TYPES.AP,
            detection_status: MAG_DETECTION_STATUSES.DETECTED,
            detection_evidence: apEvidence
        };
    }

    return {
        detected_type: null,
        detection_status: MAG_DETECTION_STATUSES.UNKNOWN,
        detection_evidence: [
            "Nem áll rendelkezésre egyértelmű CKI vagy AP strukturális bizonyíték.",
            "CKI evidence: " + (ckiEvidence.join(", ") || "nincs"),
            "AP evidence: " + (apEvidence.join(", ") || "nincs")
        ]
    };
}
