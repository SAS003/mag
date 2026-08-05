/*
==========================================================
MAG v0.2
list.js
==========================================================
*/

async function loadCKIList() {

    setListPlaceholder("Betöltés...");

    try {

        const response = await fetch(

            CONFIG.SUPABASE_URL +
            "/rest/v1/" +
            CONFIG.TABLE +
            "?select=conversation_start,logical_title,primary_topic" +
            "&order=conversation_start.desc",

            {

                headers: {

                    "apikey":
                        CONFIG.SUPABASE_ANON_KEY,

                    "Authorization":
                        "Bearer " +
                        CONFIG.SUPABASE_ANON_KEY

                }

            }

        );

        if (!response.ok) {

            throw new Error(

                "HTTP " + response.status

            );

        }

        const records = await response.json();

        renderCKIList(records);

    }

    catch (err) {

        setListPlaceholder(

            "❌ " + err.message

        );

    }

}

function renderCKIList(records) {

    const container =

        document.getElementById("ckiList");

    if (records.length === 0) {

        setListPlaceholder(

            "Nincs még CKI rekord."

        );

        return;

    }

    container.innerHTML = "";

    records.forEach(record => {

        container.innerHTML += `

            <div class="cki-item">

                <div class="cki-date">

                    ${record.conversation_start ?? ""}

                </div>

                <div class="cki-title">

                    ${record.logical_title}

                </div>

                <div class="cki-topic">

                    ${record.primary_topic}

                </div>

            </div>

        `;

    });

}

function setListPlaceholder(text) {

    document.getElementById("ckiList").innerHTML =

        `<div class="placeholder">${text}</div>`;

}