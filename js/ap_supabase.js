/*
==========================================================
MAG v0.2
ap_supabase.js
Article Profile Supabase Save
==========================================================
*/


async function saveAPToSupabase(record) {

    console.log("saveAPToSupabase elindult");
    console.log("CONFIG:", CONFIG);
    console.log("URL:", CONFIG.SUPABASE_URL);
    console.log("TABLE:", "ap_content_objects");
    console.log("KEY EXISTS:", !!CONFIG.SUPABASE_ANON_KEY);


    try {

        const object =
            record.object;

        const profile =
            record.profile;


        // ==================================================
        // 1. ELLENŐRZÉS
        // ==================================================

        if (!object?.canonical_url) {

            setStatus(
                "❌ AP mentés: hiányzik a canonical URL.",
                "error"
            );

            return;

        }


        // ==================================================
        // 2. MEGLÉVŐ OBJECT KERESÉSE
        // ==================================================

        const lookupResponse = await fetch(

            CONFIG.SUPABASE_URL +
            "/rest/v1/ap_content_objects" +
            "?canonical_url=eq." +
            encodeURIComponent(
                object.canonical_url
            ) +
            "&select=id,date_modified",

            {

                method: "GET",

                headers: {

                    "apikey":
                        CONFIG.SUPABASE_ANON_KEY,

                    "Authorization":
                        "Bearer " +
                        CONFIG.SUPABASE_ANON_KEY

                }

            }

        );


        if (!lookupResponse.ok) {

            const error =
                await lookupResponse.text();

            setStatus(
                "❌ AP keresési hiba: " +
                error,
                "error"
            );

            return;

        }


        const existing =
            await lookupResponse.json();


        // ==================================================
        // 3. ÚJ OBJECT
        // ==================================================

        if (existing.length === 0) {
console.log("AP headers test");
console.log("API key exists:", !!CONFIG.SUPABASE_ANON_KEY);
            const objectResponse =
                await fetch(

                    CONFIG.SUPABASE_URL +
                    "/rest/v1/ap_content_objects",

                    {

                        method: "POST",

                        headers: {

                            "apikey":
                                CONFIG.SUPABASE_ANON_KEY,

                            "Authorization":
                                "Bearer " +
                                CONFIG.SUPABASE_ANON_KEY,

                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=representation"

                        },

                        body: JSON.stringify(object)

                    }

                );


            if (!objectResponse.ok) {

                const error =
                    await objectResponse.text();

                setStatus(
                    "❌ AP object mentési hiba: " +
                    error,
                    "error"
                );

                return;

            }


            const createdObject =
                await objectResponse.json();

            const contentObject =
                createdObject[0];


            // ==============================================
            // 4. PROFILE LÉTREHOZÁSA
            // ==============================================

            const profileResponse =
                await fetch(

                    CONFIG.SUPABASE_URL +
                    "/rest/v1/ap_content_profiles",

                    {

                        method: "POST",

                        headers: {

                            "apikey":
                                CONFIG.SUPABASE_ANON_KEY,

                            "Authorization":
                                "Bearer " +
                                CONFIG.SUPABASE_ANON_KEY,

                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=minimal"

                        },

                        body: JSON.stringify({

                            ...profile,

                            content_object_id:
                                contentObject.id

                        })

                    }

                );


            if (!profileResponse.ok) {

                const error =
                    await profileResponse.text();

                setStatus(
                    "❌ AP profile mentési hiba: " +
                    error,
                    "error"
                );

                return;

            }


            setStatus(
                "✅ Article Profile sikeresen elmentve.",
                "success"
            );

            return;

        }


        // ==================================================
        // 5. MÁR LÉTEZŐ OBJECT
        // ==================================================

        const existingObject =
            existing[0];


        const existingDate =
            existingObject.date_modified
                ? new Date(
                    existingObject.date_modified
                )
                : null;


        const incomingDate =
            object.date_modified
                ? new Date(
                    object.date_modified
                )
                : null;


        // ==================================================
        // 6. NINCS DATE MODIFIED
        // ==================================================

        if (!incomingDate) {

            setStatus(
                "⚠️ Ez az Article Profile már létezik, és nincs dateModified értéke. Nem írjuk felül.",
                "warning"
            );

            return;

        }


        // ==================================================
        // 7. RÉGEBBI / AZONOS
        // ==================================================

        if (
            existingDate &&
            incomingDate <= existingDate
        ) {

            setStatus(
                "⚠️ A meglévő Article Profile azonos vagy újabb. Nem írjuk felül.",
                "warning"
            );

            return;

        }


        // ==================================================
        // 8. ÚJABB PROFILE
        // ==================================================

        const updateObjectResponse =
            await fetch(

                CONFIG.SUPABASE_URL +
                "/rest/v1/ap_content_objects" +
                "?id=eq." +
                encodeURIComponent(
                    existingObject.id
                ),

                {

                    method: "PATCH",

                    headers: {

                        "apikey":
                            CONFIG.SUPABASE_ANON_KEY,

                        "Authorization":
                            "Bearer " +
                            CONFIG.SUPABASE_ANON_KEY,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"

                    },

                    body: JSON.stringify({

                        ...object,

                        updated_at:
                            new Date().toISOString()

                    })

                }

            );


        if (!updateObjectResponse.ok) {

            const error =
                await updateObjectResponse.text();

            setStatus(
                "❌ AP object frissítési hiba: " +
                error,
                "error"
            );

            return;

        }


        // ==================================================
        // 9. PROFILE FRISSÍTÉSE
        // ==================================================

        const updateProfileResponse =
            await fetch(

                CONFIG.SUPABASE_URL +
                "/rest/v1/ap_content_profiles" +
                "?content_object_id=eq." +
                encodeURIComponent(
                    existingObject.id
                ),

                {

                    method: "PATCH",

                    headers: {

                        "apikey":
                            CONFIG.SUPABASE_ANON_KEY,

                        "Authorization":
                            "Bearer " +
                            CONFIG.SUPABASE_ANON_KEY,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"

                    },

                    body: JSON.stringify({

                        ...profile,

                        last_updated_at:
                            new Date().toISOString(),

                        updated_at:
                            new Date().toISOString()

                    })

                }

            );


        if (!updateProfileResponse.ok) {

            const error =
                await updateProfileResponse.text();

            setStatus(
                "❌ AP profile frissítési hiba: " +
                error,
                "error"
            );

            return;

        }


        setStatus(
            "✅ Újabb Article Profile verzió mentve.",
            "success"
        );

    }

    catch (err) {

        console.error(err);

        setStatus(
            "❌ AP mentési hiba: " +
            err.message,
            "error"
        );

    }

}