async function exportCorpus() {

    console.log("Export indul");

    try {

        const response = await fetch(

            CONFIG.SUPABASE_URL +
            "/rest/v1/" +
            CONFIG.TABLE +
            "?select=logical_title,cki_json",

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

        console.log(response.status);

        const records = await response.json();

        const blob = new Blob(

        [

            JSON.stringify(

                records,

                null,

                2

            )

        ],

        {

            type: "application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "cki_corpus.json";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    setStatus(

        "✅ CKI Corpus exportálva.",

        "success"

    );

    }

    catch (err) {

        console.error(err);

    }

}