/*
==========================================================
MAG v0.2
app.js
==========================================================
*/

console.log("MAG", CONFIG.VERSION);

let currentRecord = null;

window.onload = function () {

    const input =
        document.getElementById("jsonInput");

    const previewBtn =
        document.getElementById("previewBtn");

    const clearBtn =
        document.getElementById("clearBtn");

    const sqlBtn =
        document.getElementById("sqlBtn");

    const copySqlBtn =
        document.getElementById("copySqlBtn");

    const saveBtn =
        document.getElementById("saveBtn");

    const exportCorpusBtn =
        document.getElementById("exportCorpusBtn");


   saveBtn.onclick = async function () {

    const raw =
        input.value.trim();


    // ======================================================
    // ARTICLE PROFILE
    // ======================================================

    const apResult =
        parseAP(raw);


    if (
        apResult.success ||
        (
            apResult.version !== "ismeretlen" &&
            apResult.errors.length > 0 &&
            raw.includes('"schema_version"')
        )
    ) {

        if (!apResult.success) {

            currentRecord = null;

            clearPreview();

            clearAPPreview();

            setStatus(
                "❌ AP: " +
                apResult.errors.join(" | ") +
                " | verzió: " +
                apResult.version,
                "error"
            );

            return;

        }


        currentRecord =
            apResult.record;


        await saveAPToSupabase(
            currentRecord
        );

        return;

    }


    // ======================================================
    // CKI — MEGLÉVŐ LOGIKA
    // ======================================================

    const result =
        parseCKI(input.value);


    if (result.repaired) {

        input.value =
            result.repairedText;

        setStatus(
            "⚠️ A JSON szintaktikai hibája automatikusan javítva.\n" +
            "A tartalom és a CKI séma nem változott.",
            "warning"
        );

        return;

    }


    if (!result.success) {

        clearPreview();

        setStatus(
            "❌ " +
            result.errors.join(" | ") +
            " | CKI verzió: " +
            result.version,
            "error"
        );

        return;

    }


    currentRecord =
        result.record;

    showPreview(
        currentRecord
    );

    await saveToSupabase(
        currentRecord
    );

};

    copySqlBtn.onclick = async function () {

        const text =
            document.getElementById("sqlOutput").value;

        try {

            await navigator.clipboard.writeText(text);

            setStatus(
                "✅ SQL a vágólapra másolva.",
                "success"
            );

        }

        catch {

            setStatus(
                "❌ Nem sikerült másolni.",
                "error"
            );

        }

    };


previewBtn.onclick = function () {

    const raw =
        input.value.trim();


    // ======================================================
    // ARTICLE PROFILE DETECTION
    // ======================================================

    let parsed = null;

    try {

        parsed =
            JSON.parse(
                normalizeAPInput(raw)
            );

    }

    catch {

        parsed = null;

    }


    // ======================================================
    // ARTICLE PROFILE
    // ======================================================

    if (
        parsed &&
        parsed.schema_version &&
        parsed.content_type === "article_profile" &&
        parsed.source?.url
    ) {

        const result =
            parseAP(raw);


        if (!result.success) {

            currentRecord = null;

            clearPreview();

            clearAPPreview();

            setStatus(
                "❌ AP: " +
                result.errors.join(" | ") +
                " | verzió: " +
                result.version,
                "error"
            );

            return;

        }


        currentRecord =
            result.record;


        clearPreview();

        showAPPreview(
            currentRecord
        );


        setStatus(
            "✅ Érvényes Article Profile",
            "success"
        );

        return;

    }


    // ======================================================
    // CKI
    // ======================================================

    const result =
        parseCKI(raw);


    // JSON szintaktikai javítás történt
    if (result.repaired) {

        input.value =
            result.repairedText;

        currentRecord = null;

        clearPreview();

        clearAPPreview();

        setStatus(
            "⚠️ A JSON szintaktikai hibája automatikusan javítva.\n" +
            "A tartalom és a CKI séma nem változott.",
            "warning"
        );

        return;

    }


    // Normál CKI validáció hibával
    if (!result.success) {

        currentRecord = null;

        clearPreview();

        clearAPPreview();

        setStatus(
            "❌ " +
            result.errors.join(" | ") +
            " | CKI verzió: " +
            result.version,
            "error"
        );

        return;

    }


    // Érvényes CKI
    currentRecord =
        result.record;


    clearAPPreview();

    showPreview(
        currentRecord
    );

    setStatus(
        "✅ Érvényes CKI",
        "success"
    );

};


    clearBtn.onclick = function () {

        input.value = "";

        currentRecord = null;

        clearPreview();

        document
            .getElementById("sqlPanel")
            .classList.add("hidden");

        document
            .getElementById("sqlOutput")
            .value = "";

        setStatus("");

    };


    sqlBtn.onclick = function () {

        if (!currentRecord) {

            setStatus(
                "Először készíts Preview-t.",
                "warning"
            );

            return;

        }

        generateSQL(currentRecord);

    };


    exportCorpusBtn.onclick = function () {

        exportCorpus();

    };


    loadCKIList();

};