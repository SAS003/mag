console.log("MAG app.js v0.1.1");

let current = null;

function cleanInput(text){

    text = text.trim();

    if(text.startsWith("```")){

        const firstNewLine = text.indexOf("\n");

        text = text.substring(firstNewLine + 1);

        const lastFence = text.lastIndexOf("```");

        if(lastFence >= 0){
            text = text.substring(0,lastFence);
        }
    }

    // ChatGPT content reference-ek eltávolítása
    text = text.replace(/\s*:contentReference\[[^\]]*\]\{[^}]*\}/g,"");

    return text.trim();

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

        document.getElementById("status").innerHTML =
    "❌ " + e.message;

console.error(e);

        return null;

    }

}

document.getElementById("previewBtn").onclick=()=>{

    const r=parseCKI();

    if(!r) return;

    document.getElementById("preview").style.display="block";

    document.getElementById("pLogical").innerText =
        r.logical_title ?? "";

    document.getElementById("pDate").innerText =
        r.conversation_start ?? "";

    document.getElementById("pPrimary").innerText =
        r.primary_topic ?? "";

    document.getElementById("pSummary").innerText =
        r.summary ?? "";

    document.getElementById("pRetrieval").innerText =
        r.retrieval_summary ?? "";

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

${esc(r.source_metadata.source)},

${esc(r.source_metadata.conversation_url)},

${esc(r.source_metadata.conversation_start)},

${esc(r.source_metadata.chat_title)},

${esc(r.source_metadata.logical_title)},

${esc(r.processing_metadata.cki_spec_version)},

${esc(r.processing_metadata.context_scope)},

${esc(r.processing_metadata.context_confidence)},

${esc(r.processing_metadata.coverage_assessment)},

${esc(r.summary)},

${esc(r.retrieval_summary)},

${esc(r.topics.primary)},

${arr(r.topics.secondary)},

${arr(r.topics.keywords)},

${arr(r.systems)},

${arr(r.knowledge_objects)},

${esc(JSON.stringify(r.cki_json))}::jsonb

);

`;

    document.getElementById("sqlCard").style.display="block";

    document.getElementById("sqlOutput").value=sql;

};
