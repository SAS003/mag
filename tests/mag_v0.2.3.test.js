/*
==========================================================
MAG v0.2.3
tests/mag_v0.2.3.test.js
==========================================================
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(relativePath) {
    const filename =
        path.join(
            __dirname,
            "..",
            relativePath
        );

    vm.runInThisContext(
        fs.readFileSync(filename, "utf8"),
        { filename }
    );
}


load("js/ingest.js");
load("js/parser.js");
load("js/ap_parser.js");


function makeCKI() {

    return {
        metadata: {
            source: "chatgpt",
            conversation_url:
                "https://chatgpt.com/c/test-123",
            chat_title: "Teszt",
            logical_title: "CKI routing teszt",
            conversation_start: null,
            cki_spec_version: "1.3",
            context_scope: "current_context",
            context_confidence: "high",
            coverage_assessment:
                "A teszt a teljes exportot tartalmazza.",
            embedded_cki_export_count: 0
        },

        summary: "",
        retrieval_summary: "",

        topics: {
            primary: "",
            secondary: [],
            keywords: []
        },

        discussion_topics: [],
        activities: [],
        results: [],
        key_decisions: [],
        outputs: [],
        open_ideas: [],
        ai_tags: [],
        side_threads: [],

        knowledge: {
            new: [],
            refined: [],
            rejected: []
        },

        emerging_patterns: [],
        systems: [],

        references: {
            documents: [],
            rfcs: [],
            prompts: [],
            external: []
        },

        search_questions: [],
        knowledge_objects: []
    };

}


{
    const text =
        JSON.stringify(
            makeCKI()
        );

    const detection =
        detectContentType(
            text
        );

    assert.equal(
        detection.detected_type,
        "CKI"
    );

    assert.equal(
        detection.detection_status,
        "DETECTED"
    );


    const parsed =
        parseCKI(
            text
        );

    assert.equal(
        parsed.success,
        true
    );

    assert.equal(
        parsed.version,
        "1.3"
    );

    assert.equal(
        parsed.record.embedded_cki_export_count,
        0
    );

}


{
    const v12 =
        makeCKI();

    v12.metadata.cki_spec_version =
        "1.2";

    const parsed =
        parseCKI(
            JSON.stringify(v12)
        );

    assert.equal(
        parsed.success,
        false
    );

    assert.match(
        parsed.errors.join(" | "),
        /Érvénytelen CKI verzió/
    );

}


{
    const legacy =
        makeCKI();

    delete legacy.metadata;

    legacy.source_metadata = {
        source: "chatgpt"
    };

    legacy.processing_metadata = {};

    const parsed =
        parseCKI(
            JSON.stringify(legacy)
        );

    assert.equal(
        parsed.success,
        false
    );

    assert.match(
        parsed.errors.join(" | "),
        /source_metadata/
    );

}


{
    const invalid =
        makeCKI();

    invalid.metadata.embedded_cki_export_count =
        "1";

    const parsed =
        parseCKI(
            JSON.stringify(invalid)
        );

    assert.equal(
        parsed.success,
        false
    );

}


{
    const ap = {

        schema_version: "1.0",
        language: "hu",
        content_type: "article_profile",

        source: {
            url: "https://example.com/article",
            retrieval: {
                retrieved_at:
                    "2026-09-24T12:00:00Z"
            }
        },

        identity: {
            title: "AP teszt",
            slug: "ap-teszt"
        },

        content: {
            summary: "Teszt"
        },

        reader_journey: {},
        seo: {},

        status: {
            profile_status: "active"
        }

    };


    const detection =
        detectContentType(
            JSON.stringify(ap)
        );

    assert.equal(
        detection.detected_type,
        "AP"
    );


    const parsed =
        parseAP(
            JSON.stringify(ap)
        );

    assert.equal(
        parsed.success,
        true
    );

}


{
    const detection =
        detectContentType(
            '{"foo":"bar"}'
        );

    assert.equal(
        detection.detection_status,
        "UNKNOWN"
    );

}


{
    const ambiguous =
        JSON.stringify({
            schema_version: "1.0",
            content_type: "article_profile",
            source: {
                url: "https://example.com"
            },
            identity: {
                title: "x"
            },
            metadata: {},
            cki_spec_version: "1.3",
            retrieval_summary: "",
            topics: {
                primary: ""
            }
        });

    const detection =
        detectContentType(
            ambiguous
        );

    assert.equal(
        detection.detection_status,
        "AMBIGUOUS"
    );

}


console.log(
    "MAG v0.2.3 tests: OK"
);
