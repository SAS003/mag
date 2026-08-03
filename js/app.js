/*
==========================================================
MAG v0.1
app.js
==========================================================
*/

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

        currentRecord = result.record;

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

}
