/*
==========================================================
MAG v0.1
sql.js
==========================================================
*/

function generateSQL(record) {

    const sql =
        buildInsertSQL(record);

    document
        .getElementById("sqlPanel")
        .classList.remove("hidden");

    document
        .getElementById("sqlOutput")
        .value = sql;

}


function buildInsertSQL(r) {

    return `INSERT INTO cki_conversations (

source,
conversation_url,
conversation_start,
chat_title,
logical_title,

cki_spec_version,
context_scope,
context_confidence,
coverage_assessment,

summary,
retrieval_summary,

primary_topic,
secondary_topics,
keywords,

systems,
knowledge_objects,

cki_json

)

VALUES (

${txt(r.source)},
${txt(r.conversation_url)},
${txt(r.conversation_start)},
${txt(r.chat_title)},
${txt(r.logical_title)},

${txt(r.cki_spec_version)},
${txt(r.context_scope)},
${txt(r.context_confidence)},
${txt(r.coverage_assessment)},

${txt(r.summary)},
${txt(r.retrieval_summary)},

${txt(r.primary_topic)},
${json(r.secondary_topics)},
${json(r.keywords)},

${json(r.systems)},
${json(r.knowledge_objects)},

${json(r.raw_json)}

);`;

}


function txt(value) {

    if (value === null || value === undefined)
        return "NULL";

    return "'" +
        String(value)
            .replace(/'/g, "''") +
        "'";

}


function json(value) {

    if (value === null || value === undefined)
        return "'[]'::jsonb";

    return "'" +
        JSON.stringify(value)
            .replace(/'/g, "''") +
        "'::jsonb";

}

