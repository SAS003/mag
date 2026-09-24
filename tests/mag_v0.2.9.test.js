/*
==========================================================
MAG regression tests
==========================================================
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(relativePath) {
    const filename = path.join(
        __dirname,
        "..",
        relativePath
    );

    vm.runInThisContext(
        fs.readFileSync(filename, "utf8"),
        { filename }
    );
}

load("js/config.js");

assert.equal(CONFIG.VERSION, "0.2.9");

const indexHtml = fs.readFileSync(
    path.join(__dirname, "..", "index.html"),
    "utf8"
);

assert.match(indexHtml, /id="runtimeVersion"/);
assert.doesNotMatch(
    indexHtml,
    /Conversation Knowledge Workspace · MAG v0.2.9/
);

load("js/ingest.js");
load("js/parser.js");

function makeCKI() {
    return {
        metadata: {
            source: "chatgpt",
            conversation_url: "https://chatgpt.com/c/test-027",
            chat_title: "Teszt",
            logical_title: "MAG v0.2.9 teszt",
            conversation_start: null,
            cki_spec_version: "1.3",
            context_scope: "current_context",
            context_confidence: "high",
            coverage_assessment: "Teszt export.",
            embedded_cki_export_count: 2
        },
        summary: "",
        retrieval_summary: "",
        topics: { primary: "", secondary: [], keywords: [] },
        discussion_topics: [],
        activities: [],
        results: [],
        key_decisions: [],
        outputs: [],
        open_ideas: [],
        ai_tags: [],
        side_threads: [],
        knowledge: { new: [], refined: [], rejected: [] },
        emerging_patterns: [],
        systems: [],
        references: { documents: [], rfcs: [], prompts: [], external: [] },
        search_questions: [],
        knowledge_objects: []
    };
}

{
    const parsed = parseCKI(JSON.stringify(makeCKI()));
    assert.equal(parsed.success, true);
    assert.equal(parsed.version, "1.3");
    assert.equal(parsed.record.embedded_cki_export_count, 2);
}

{
    const invalid = makeCKI();
    invalid.metadata.embedded_cki_export_count = -1;
    assert.equal(parseCKI(JSON.stringify(invalid)).success, false);
}

{
    const invalidType = makeCKI();
    invalidType.metadata.embedded_cki_export_count = "2";
    assert.equal(parseCKI(JSON.stringify(invalidType)).success, false);
}

{
    const v12 = makeCKI();
    v12.metadata.cki_spec_version = "1.2";
    assert.equal(parseCKI(JSON.stringify(v12)).success, false);
}

{
    const legacy = makeCKI();
    delete legacy.metadata;
    legacy.source_metadata = { source: "chatgpt" };
    legacy.processing_metadata = {};
    assert.equal(parseCKI(JSON.stringify(legacy)).success, false);
}

{
    const cki = makeCKI();
    const detection = detectContentType(JSON.stringify(cki));
    assert.equal(detection.detected_type, "CKI");
    assert.equal(detection.detection_status, "DETECTED");
}

{
    const ap = {
        schema_version: "1.0",
        language: "hu",
        content_type: "article_profile",
        source: { url: "https://example.com/article" },
        identity: { title: "AP teszt", slug: "ap-teszt" },
        content: { summary: "Teszt" },
        reader_journey: {},
        seo: {},
        status: { profile_status: "active" }
    };

    const detection = detectContentType(JSON.stringify(ap));
    assert.equal(detection.detected_type, "AP");
}

{
    const unknown = detectContentType('{"foo":"bar"}');
    assert.equal(unknown.detection_status, "UNKNOWN");
}

{
    const ambiguous = detectContentType(JSON.stringify({
        schema_version: "1.0",
        content_type: "article_profile",
        source: { url: "https://example.com" },
        identity: { title: "x" },
        metadata: {},
        cki_spec_version: "1.3",
        retrieval_summary: "",
        topics: { primary: "" }
    }));

    assert.equal(ambiguous.detection_status, "AMBIGUOUS");
}

load("js/supabase.js");
load("js/cki_update.js");
load("js/sql.js");

function makeCKIRecordForTests() {

    const raw_json = makeCKI();

    return {
        source: raw_json.metadata.source,
        conversation_url: raw_json.metadata.conversation_url,
        conversation_start:
            raw_json.metadata.conversation_start,
        chat_title: raw_json.metadata.chat_title,
        logical_title: raw_json.metadata.logical_title,
        cki_spec_version:
            raw_json.metadata.cki_spec_version,
        context_scope:
            raw_json.metadata.context_scope,
        context_confidence:
            raw_json.metadata.context_confidence,
        coverage_assessment:
            raw_json.metadata.coverage_assessment,
        embedded_cki_export_count:
            raw_json.metadata.embedded_cki_export_count,
        summary: raw_json.summary,
        retrieval_summary:
            raw_json.retrieval_summary,
        primary_topic:
            raw_json.topics.primary,
        secondary_topics:
            raw_json.topics.secondary,
        keywords:
            raw_json.topics.keywords,
        systems: raw_json.systems,
        knowledge_objects:
            raw_json.knowledge_objects,
        raw_json
    };

}

{
    const record = {
        source: "chatgpt",
        conversation_url: "https://chatgpt.com/c/test-027",
        conversation_start: null,
        chat_title: "Teszt",
        logical_title: "MAG",
        cki_spec_version: "1.3",
        context_scope: "current_context",
        context_confidence: "high",
        coverage_assessment: "Teszt",
        embedded_cki_export_count: 2,
        summary: "",
        retrieval_summary: "",
        primary_topic: "",
        secondary_topics: [],
        keywords: [],
        systems: [],
        knowledge_objects: [],
        raw_json: makeCKI()
    };

    const payload = buildCKISupabasePayload(record);
    assert.equal(payload.embedded_cki_export_count, 2);

    const generated = buildInsertSQL(record);
    assert.match(generated, /embedded_cki_export_count/);
    assert.match(generated, /2/);
}

{
    global.window = {};
    const elements = {};

    global.document = {
        getElementById(id) {
            if (!elements[id]) {
                elements[id] = {
                    classList: {
                        add() {},
                        remove() {}
                    },
                    appendChild() {},
                    innerHTML: "",
                    textContent: ""
                };
            }
            return elements[id];
        }
    };

    global.clearPreview = () => {};
    global.clearAPPreview = () => {};
    global.setStatus = () => {};
    global.loadCKIList = () => {};

    load("js/app.js");
    window.onload();

    assert.equal(
        elements.runtimeVersion.textContent,
        "v" + CONFIG.VERSION
    );
}


{
    const incoming = makeCKI();
    incoming.metadata.conversation_start =
        "2026-09-25";

    const existing = makeCKI();
    existing.metadata.conversation_start =
        "2026-09-24";

    const paths =
        collectDifferencePaths(
            incoming,
            existing
        );

    assert.ok(
        paths.includes(
            "metadata.conversation_start"
        )
    );
}


(async function () {

    const record = {
        source: "chatgpt",
        conversation_url: " https://chatgpt.com/c/test-027 ",
        conversation_start: null,
        chat_title: "Teszt",
        logical_title: "MAG",
        cki_spec_version: "1.3",
        context_scope: "current_context",
        context_confidence: "high",
        coverage_assessment: "Teszt",
        embedded_cki_export_count: 2,
        summary: "",
        retrieval_summary: "",
        primary_topic: "",
        secondary_topics: [],
        keywords: [],
        systems: [],
        knowledge_objects: [],
        raw_json: makeCKI()
    };

    const originalFetch = global.fetch;

    {
        const calls = [];
        const messages = [];

        global.setStatus = (message) => messages.push(message);

        const equivalentJSON = {
            knowledge_objects: [],
            systems: [],
            emerging_patterns: [],
            metadata: {
                embedded_cki_export_count: 2,
                coverage_assessment: "Teszt export.",
                context_confidence: "high",
                context_scope: "current_context",
                cki_spec_version: "1.3",
                conversation_start: null,
                logical_title: "MAG v0.2.9 teszt",
                chat_title: "Teszt",
                conversation_url: "https://chatgpt.com/c/test-027",
                source: "chatgpt"
            },
            summary: "",
            retrieval_summary: "",
            topics: { keywords: [], secondary: [], primary: "" },
            discussion_topics: [],
            activities: [],
            results: [],
            key_decisions: [],
            outputs: [],
            open_ideas: [],
            ai_tags: [],
            side_threads: [],
            knowledge: { rejected: [], refined: [], new: [] },
            references: { external: [], prompts: [], rfcs: [], documents: [] },
            search_questions: []
        };

        global.fetch = async (url, options = {}) => {
            calls.push({ url, options });
            assert.equal(options.method, "GET");

            return {
                ok: true,
                json: async () => [
                    {
                        id: "existing-1",
                        cki_json: JSON.stringify(equivalentJSON)
                    }
                ]
            };
        };

        const result = await saveToSupabase(record);

        assert.equal(result.state, "EXACT_DUPLICATE");
        assert.equal(calls.length, 1);
        assert.equal(calls[0].options.method, "GET");
        assert.equal(
            messages.at(-1).includes("EXACT_DUPLICATE"),
            true
        );
    }

    {
        const calls = [];
        const messages = [];

        global.setStatus = (message) => messages.push(message);

        const differentJSON = makeCKI();
        differentJSON.summary = "Eltérő tartalom.";

        global.fetch = async (url, options = {}) => {
            calls.push({ url, options });
            assert.equal(options.method, "GET");

            return {
                ok: true,
                json: async () => [
                    {
                        id: "existing-2",
                        cki_json: differentJSON
                    }
                ]
            };
        };

        const result = await saveToSupabase(record);

        assert.equal(result.state, "UPDATE_CANDIDATE");
        assert.equal(result.existing_count, 1);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].options.method, "GET");
        assert.equal(
            messages.at(-1).includes("UPDATE_CANDIDATE"),
            true
        );
    }

    {
        const calls = [];
        const messages = [];

        global.setStatus = (message) => messages.push(message);

        global.fetch = async (url, options = {}) => {
            calls.push({ url, options });

            if (options.method === "GET") {
                return {
                    ok: true,
                    json: async () => []
                };
            }

            assert.equal(options.method, "POST");

            const payload = JSON.parse(options.body);

            assert.equal(
                payload.conversation_url,
                "https://chatgpt.com/c/test-027"
            );

            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result = await saveToSupabase(record);

        assert.equal(result.state, "NEW");
        assert.equal(calls.length, 2);
        assert.equal(calls[0].options.method, "GET");
        assert.equal(calls[1].options.method, "POST");
        assert.equal(
            messages.at(-1).includes("NEW"),
            true
        );
    }

    {
        const calls = [];
        const messages = [];

        global.setStatus = (message) => messages.push(message);

        const identityUnknownRecord = {
            ...record,
            conversation_url: null
        };

        global.fetch = async (url, options = {}) => {
            calls.push({ url, options });

            assert.equal(options.method, "POST");

            return {
                ok: true,
                json: async () => ({})
            };
        };

        const result =
            await saveToSupabase(
                identityUnknownRecord
            );

        assert.equal(
            result.state,
            "IDENTITY_UNKNOWN"
        );

        assert.equal(
            calls.length,
            1
        );

        assert.equal(
            messages.at(-1).includes(
                "IDENTITY_UNKNOWN"
            ),
            true
        );
    }

    global.fetch = originalFetch;

    {
        const candidateJSON = makeCKI();
        candidateJSON.metadata.conversation_start =
            "2026-09-24";

        const incomingRecord = {
            ...makeCKIRecordForTests(),
            conversation_url:
                "https://chatgpt.com/c/test-update"
        };

        const candidate = {
            id: "candidate-1",
            cki_json: candidateJSON
        };

        const calls = [];
        const messages = [];

        global.setStatus =
            message => messages.push(message);

        global.fetch =
            async (url, options = {}) => {

                calls.push({
                    url,
                    options
                });

                if (
                    options.method ===
                    "GET"
                ) {
                    return {
                        ok: true,
                        json:
                            async () => [
                                {
                                    id:
                                        "candidate-1",
                                    cki_json:
                                        candidateJSON
                                }
                            ]
                    };
                }

                assert.equal(
                    options.method,
                    "PATCH"
                );

                const payload =
                    JSON.parse(
                        options.body
                    );

                assert.equal(
                    payload.conversation_url,
                    "https://chatgpt.com/c/test-update"
                );

                return {
                    ok: true,
                    json:
                        async () => ({})
                };

            };

        global.loadCKIList =
            async () => {};

        const result =
            await updateExistingCKIRecord(
                candidate,
                incomingRecord
            );

        assert.equal(
            result.success,
            true
        );

        assert.equal(
            result.state,
            "UPDATE_EXISTING"
        );

        assert.equal(
            result.id,
            "candidate-1"
        );

        assert.equal(
            calls.length,
            2
        );

        assert.equal(
            calls[0].options.method,
            "GET"
        );

        assert.equal(
            calls[1].options.method,
            "PATCH"
        );
    }

    {
        const record = {
            ...makeCKIRecordForTests(),
            conversation_url:
                "https://chatgpt.com/c/test-new"
        };

        const calls = [];
        const messages = [];

        global.setStatus =
            message => messages.push(message);

        global.fetch =
            async (url, options = {}) => {

                calls.push({
                    url,
                    options
                });

                assert.equal(
                    options.method,
                    "POST"
                );

                return {
                    ok: true,
                    json:
                        async () => ({})
                };

            };

        const result =
            await saveCKIAsNew(
                record
            );

        assert.equal(
            result.success,
            true
        );

        assert.equal(
            result.state,
            "SAVE_AS_NEW"
        );

        assert.equal(
            calls.length,
            1
        );

        assert.ok(
            messages.at(-1).includes(
                "SAVE_AS_NEW"
            )
        );
    }

    {
        const candidateJSON =
            makeCKI();

        const candidate = {
            id:
                "candidate-conflict",
            cki_json:
                candidateJSON
        };

        const incomingRecord = {
            ...makeCKIRecordForTests(),
            conversation_url:
                "https://chatgpt.com/c/test-conflict"
        };

        const changedJSON =
            makeCKI();

        changedJSON.summary =
            "Időközben módosult.";

        const calls = [];

        global.setStatus =
            () => {};

        global.fetch =
            async () => {

                calls.push(
                    true
                );

                return {
                    ok: true,
                    json:
                        async () => [
                            {
                                id:
                                    "candidate-conflict",
                                cki_json:
                                    changedJSON
                            }
                        ]
                };

            };

        const result =
            await updateExistingCKIRecord(
                candidate,
                incomingRecord
            );

        assert.equal(
            result.success,
            false
        );

        assert.equal(
            result.state,
            "UPDATE_CONFLICT"
        );

        assert.equal(
            calls.length,
            1
        );

    }


    console.log(
        "MAG v0.2.9 tests: OK"
    );

})();
