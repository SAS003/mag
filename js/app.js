/*
==========================================================
MAG app
==========================================================
*/

console.log("MAG", CONFIG.VERSION);

let currentRecord = null;


function inputElement() {
    return document.getElementById("jsonInput");
}


function renderRuntimeVersion() {

    const versionElement =
        document.getElementById("runtimeVersion");

    if (versionElement) {
        versionElement.textContent =
            "v" + CONFIG.VERSION;
    }

}


function clearAllPreviews() {
    clearPreview();
    clearAPPreview();
}


function reportDetection(detection) {

    if (
        detection.detection_status ===
        MAG_DETECTION_STATUSES.AMBIGUOUS
    ) {
        setStatus(
            "⚠️ A bemenet egyszerre több támogatott tartalomtípus jeleit tartalmazza. " +
            "A routing nem indítható.\n" +
            detection.detection_evidence.join(" | "),
            "warning"
        );

        return false;
    }

    if (
        detection.detection_status ===
        MAG_DETECTION_STATUSES.UNKNOWN
    ) {
        setStatus(
            "❌ A bemenettípus nem azonosítható egyértelműen.\n" +
            detection.detection_evidence.join(" | "),
            "error"
        );

        return false;
    }

    return true;
}


async function handleAPSave(raw) {

    const result = parseAP(raw);

    if (!result.success) {
        currentRecord = null;
        clearAllPreviews();

        setStatus(
            "❌ AP: " +
            result.errors.join(" | ") +
            " | verzió: " +
            result.version,
            "error"
        );

        return;
    }

    currentRecord = result.record;

    clearPreview();
    showAPPreview(currentRecord);

    await saveAPToSupabase(currentRecord);
}


async function handleCKISave(raw) {

    const result = parseCKI(raw);

    if (result.repaired) {
        inputElement().value =
            result.repairedText;

        currentRecord = null;
        clearAllPreviews();

        setStatus(
            "⚠️ A JSON szintaktikai hibája automatikusan javítva.\n" +
            "A tartalom és a CKI séma nem változott.\n" +
            "Nyomd meg ismét a Save vagy Preview gombot.",
            "warning"
        );

        return;
    }

    if (!result.success) {
        currentRecord = null;
        clearAllPreviews();

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

    clearAPPreview();
    showPreview(currentRecord);

    await saveToSupabase(currentRecord);
}


function handlePreview(raw) {

    const detection =
        detectContentType(raw);

    if (!reportDetection(detection)) {
        currentRecord = null;
        clearAllPreviews();
        return;
    }


    if (
        detection.detected_type ===
        MAG_CONTENT_TYPES.AP
    ) {
        const result = parseAP(raw);

        if (!result.success) {
            currentRecord = null;
            clearAllPreviews();

            setStatus(
                "❌ AP: " +
                result.errors.join(" | ") +
                " | verzió: " +
                result.version,
                "error"
            );

            return;
        }

        currentRecord = result.record;

        clearPreview();
        showAPPreview(currentRecord);

        setStatus(
            "✅ Érvényes Article Profile",
            "success"
        );

        return;
    }


    if (
        detection.detected_type ===
        MAG_CONTENT_TYPES.CKI
    ) {
        const result = parseCKI(raw);

        if (result.repaired) {
            inputElement().value =
                result.repairedText;

            currentRecord = null;
            clearAllPreviews();

            setStatus(
                "⚠️ A JSON szintaktikai hibája automatikusan javítva.\n" +
                "A tartalom és a CKI séma nem változott.\n" +
                "Nyomd meg ismét a Preview gombot.",
                "warning"
            );

            return;
        }

        if (!result.success) {
            currentRecord = null;
            clearAllPreviews();

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

        clearAPPreview();
        showPreview(currentRecord);

        setStatus(
            "✅ Érvényes CKI " +
            result.version,
            "success"
        );
    }
}


window.onload = function () {

    renderRuntimeVersion();

    const input = inputElement();

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

    const exportCKIBtn =
        document.getElementById("exportCKIBtn");

    const exportCorpusBtn =
        document.getElementById("exportCorpusBtn");


    saveBtn.onclick = async function () {

        const raw =
            input.value.trim();

        const detection =
            detectContentType(raw);

        if (!reportDetection(detection)) {
            currentRecord = null;
            clearAllPreviews();
            return;
        }

        if (
            detection.detected_type ===
            MAG_CONTENT_TYPES.AP
        ) {
            await handleAPSave(raw);
            return;
        }

        if (
            detection.detected_type ===
            MAG_CONTENT_TYPES.CKI
        ) {
            await handleCKISave(raw);
        }
    };


    previewBtn.onclick = function () {
        handlePreview(input.value.trim());
    };


    copySqlBtn.onclick = async function () {

        const sqlText =
            document.getElementById("sqlOutput").value;

        try {
            await navigator.clipboard.writeText(
                sqlText
            );

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


    exportCKIBtn.onclick = function () {
        exportCurrentCKI();
    };


    clearBtn.onclick = function () {

        input.value = "";
        currentRecord = null;

        clearAllPreviews();

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

        if (
            !currentRecord.raw_json ||
            !currentRecord.raw_json.metadata ||
            currentRecord.raw_json.metadata.cki_spec_version !==
                "1.3"
        ) {
            setStatus(
                "⚠️ SQL-generálás jelenleg CKI v1.3 rekordokra értelmezett.",
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
