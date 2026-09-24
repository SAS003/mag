/*
==========================================================
MAG v0.2.4
cki_export.js
==========================================================

Exports the currently loaded, already validated CKI as one
canonical v1.3 JSON object.
==========================================================
*/

function sanitizeCKIFilename(name) {

    const fallback =
        "cki-export";

    let safe =
        String(name ?? "")
            .normalize("NFKD")
            .replace(/[^\p{L}\p{N}\s._-]/gu, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 120);

    if (!safe)
        safe = fallback;

    return (
        safe +
        "__CKI-v1.3.json"
    );
}


function canonicalizeCKI(json) {

    if (
        !json ||
        typeof json !== "object" ||
        Array.isArray(json)
    ) {
        throw new Error(
            "Az exportált CKI nem JSON objektum."
        );
    }

    return JSON.parse(
        JSON.stringify(json)
    );
}


function exportCurrentCKI() {

    if (
        !currentRecord ||
        !currentRecord.raw_json ||
        !currentRecord.raw_json.metadata ||
        currentRecord.raw_json.metadata.cki_spec_version !==
            "1.3"
    ) {
        setStatus(
            "Először tölts be és ellenőrizz egy érvényes CKI v1.3 rekordot.",
            "warning"
        );
        return;
    }

    let canonical;

    try {
        canonical =
            canonicalizeCKI(
                currentRecord.raw_json
            );
    }
    catch (err) {
        setStatus(
            "❌ CKI export hiba: " +
            err.message,
            "error"
        );
        return;
    }

    const blob =
        new Blob(
            [
                JSON.stringify(
                    canonical,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        sanitizeCKIFilename(
            canonical?.metadata?.logical_title
        );

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    setStatus(
        "✅ Kanonikus CKI v1.3 exportálva.",
        "success"
    );
}
