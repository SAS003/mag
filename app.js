let current = null;

function cleanInput(text){

    return text
        .trim()
        .replace(/^```json\s*/i,"")
        .replace(/^```\s*/,"")
        .replace(/```$/,"")
        .trim();

}

function buildRecord(j){

    return {

        source: j.source_metadata.source,

        conversation_url: j.source_metadata.conversation_url,

        conversation_start: j.source_metadata.conversation_start,

        chat_title: j.source_metadata.chat_title,

        logical_title: j.source_metadata.logical_title,

        cki_spec_version: j.processing_metadata.cki_spec_version,

        context_scope: j.processing_metadata.context_scope,

        context_confidence: j.processing_metadata.context_confidence,

        coverage_assessment: j.processing_metadata.coverage_assessment,

        summary: j.summary,

        retrieval_summary: j.retrieval_summary,

        primary_topic: j.topics.primary,

        secondary_topics: j.topics.secondary,

        keywords: j.topics.keywords,

        systems: j.systems,

        knowledge_objects: j.knowledge_objects,

        cki_json: j

    };

}

function parseCKI(){

    try{

        const raw=document.getElementById("jsonInput").value;

        const cleaned=cleanInput(raw);

        const json=JSON.parse(cleaned);

        current=buildRecord(json);

        document.getElementById("status").innerHTML="✅ Érvényes CKI";

        return current;

    }

    catch(e){

        current=null;

        document.getElementById("status").innerHTML=
            "❌ A beillesztett szöveg nem érvényes CKI JSON.";

        console.error(e);

        return null;

    }

}

document.getElementById("previewBtn").onclick=()=>{

    const j=parseCKI();

    if(!j) return;

    document.getElementById("preview").style.display="block";

    document.getElementById("pLogical").innerText=
        j.source_metadata.logical_title ?? "";

    document.getElementById("pDate").innerText=
        j.source_metadata.conversation_start ?? "";

    document.getElementById("pPrimary").innerText=
        j.topics.primary ?? "";

    document.getElementById("pSummary").innerText=
        j.summary ?? "";

    document.getElementById("pRetrieval").innerText=
        j.retrieval_summary ?? "";

};

document.getElementById("sqlBtn").onclick=()=>{

    const j=parseCKI();

    if(!j) return;

    function esc(v){

        if(v===null || v===undefined) return "NULL";

        return "'" + JSON.stringify(v).slice(1,-1).replace(/'/g,"''") + "'";

    }

    function arr(a){

        if(!a) return "NULL";

        return "ARRAY[" +

            a.map(x=>esc(x)).join(",")

            + "]";

    }

    const sql=`

INSERT INTO cki_conversations(

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

VALUES(

${esc(j.source_metadata.source)},

${esc(j.source_metadata.conversation_url)},

${esc(j.source_metadata.conversation_start)},

${esc(j.source_metadata.chat_title)},

${esc(j.source_metadata.logical_title)},

${esc(j.processing_metadata.cki_spec_version)},

${esc(j.processing_metadata.context_scope)},

${esc(j.processing_metadata.context_confidence)},

${esc(j.processing_metadata.coverage_assessment)},

${esc(j.summary)},

${esc(j.retrieval_summary)},

${esc(j.topics.primary)},

${arr(j.topics.secondary)},

${arr(j.topics.keywords)},

${arr(j.systems)},

${arr(j.knowledge_objects)},

${esc(JSON.stringify(j))}::jsonb

);

`;

    document.getElementById("sqlCard").style.display="block";

    document.getElementById("sqlOutput").value=sql;

};
