/*
==========================================================
MAG v0.1
ap_preview.js
Article Profile Preview
==========================================================
*/

function clearAPPreview() {

    const panel =
        document.getElementById("apPreviewPanel");

    if (panel) {
        panel.classList.add("hidden");
    }

}


function showAPPreview(record) {

    if (!record) return;

    const panel =
        document.getElementById("apPreviewPanel");

    if (!panel) return;


    const object =
        record.object || {};

    const profile =
        record.profile || {};


    const setValue = function (id, value) {

        const element =
            document.getElementById(id);

        if (!element) return;

        if (Array.isArray(value)) {

            element.textContent =
                value.join(", ");

            return;

        }

        if (
            value !== null &&
            typeof value === "object"
        ) {

            element.textContent =
                JSON.stringify(value);

            return;

        }

        element.textContent =
            value ?? "";

    };


    setValue(
        "apvCanonicalUrl",
        object.canonical_url
    );

    setValue(
        "apvTitle",
        object.title
    );

    setValue(
        "apvH1",
        object.h1
    );

    setValue(
        "apvContentType",
        object.content_type
    );

    setValue(
        "apvSchemaVersion",
        profile.schema_version
    );

    setValue(
        "apvLanguage",
        profile.language
    );

    setValue(
        "apvPrimaryTopic",
        profile.primary_topic
    );

    setValue(
        "apvSearchIntent",
        profile.search_intent
    );

    setValue(
        "apvSummary",
        profile.summary
    );

    setValue(
        "apvCoreQuestion",
        profile.core_question
    );

    setValue(
        "apvCoreInsight",
        profile.core_insight
    );


    panel.classList.remove("hidden");

}