/*
==========================================================
MAG v0.1
preview.js
==========================================================
*/

function showPreview(record) {

    document.getElementById("previewPanel")
        .classList.remove("hidden");

    setText("pvLogicalTitle", record.logical_title);

    setText("pvChatTitle", record.chat_title);

    setText("pvConversationStart", record.conversation_start);

    setText("pvPrimaryTopic", record.primary_topic);

    setText(
        "pvSystems",
        joinArray(record.systems)
    );

    setText("pvSummary", record.summary);

    setText(
        "pvRetrievalSummary",
        record.retrieval_summary
    );

}


function clearPreview() {

    document.getElementById("previewPanel")
        .classList.add("hidden");

    setText("pvLogicalTitle", "");

    setText("pvChatTitle", "");

    setText("pvConversationStart", "");

    setText("pvPrimaryTopic", "");

    setText("pvSystems", "");

    setText("pvSummary", "");

    setText("pvRetrievalSummary", "");

}


function setStatus(message, type = "success") {

    const el = document.getElementById("status");

    el.className = "status";

    el.classList.add(type);

    el.textContent = message;

}


function setText(id, value) {

    const el = document.getElementById(id);

    if (!el) return;

    el.textContent = value ?? "";

}


function joinArray(arr) {

    if (!Array.isArray(arr))
        return "";

    return arr.join(", ");

}
