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

assert.equal(CONFIG.VERSION, "0.2.7");

const indexHtml = fs.readFileSync(
    path.join(__dirname, "..", "index.html"),
    "utf8"
);

assert.match(indexHtml, /id="runtimeVersion"/);
assert.doesNotMatch(
    indexHtml,
    /Conversation Knowledge Workspace · MAG v0\.2\.7/
);

load("js/ingest.js");
load("js/parser.js");

function makeCKI() {
    return {
        metadata: {
            source: "chatgpt",
            conversation_url: "https://chatgpt.com/c/test-027",
            chat_title: "Teszt",
            logical_title: "MAG v0.2.7 teszt",
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
load("js/sql.js");

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
                elements[id] = {};
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

console.log("MAG v0.2.7 tests: OK");
