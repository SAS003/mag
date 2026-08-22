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

        const result =
            parseCKI(input.value);

        if (result.repaired) {

        input.value = result.repairedText;

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

        currentRecord = result.record;

        showPreview(currentRecord);

        await saveToSupabase(currentRecord);

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

    const result =
        parseCKI(input.value);


    // JSON szintaktikai javítás történt
    if (result.repaired) {

        input.value =
            result.repairedText;

        currentRecord = null;

        clearPreview();

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

    showPreview(currentRecord);

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