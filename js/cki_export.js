/*
==========================================================
MAG v0.2.1
cki_export.js
==========================================================

Exports the currently loaded CKI as one canonical JSON object.
This is separate from the CKI Corpus export, which remains a
database/corpus-level operation.
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
        "__CKI-v1.2.json"
    );

}


function exportCurrentCKI() {

    if (
        !currentRecord ||
        !currentRecord.raw_json ||
        !currentRecord.raw_json.topics
    ) {

        setStatus(
            "Először tölts be és ellenőrizz egy érvényes CKI-t.",
            "warning"
        );

        return;

    }


    const canonical =
        canonicalizeCKI(
            currentRecord.raw_json
        );


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
                type: "application/json;charset=utf-8"
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
        "✅ Kanonikus CKI v1.2 exportálva.",
        "success"
    );

}
