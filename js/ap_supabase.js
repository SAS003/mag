/*
==========================================================
MAG v0.2
ap_supabase.js
Article Profile Supabase Save
==========================================================
*/


function normalizeCanonicalUrl(value) {

    if (!value) return null;

    let url = String(value).trim();

    // Markdown link:
    // [https://example.com](https://example.com)
    const markdownMatch =
        url.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i);

    if (markdownMatch) {
        url = markdownMatch[2];
    }

    return url.trim();
}


async function saveAPToSupabase(record) {

    console.log("saveAPToSupabase elindult");


    try {

        // ==================================================
        // 1. OBJECT ÉS PROFILE
        // ==================================================

        const object = {

            ...record.object,

            canonical_url:
                normalizeCanonicalUrl(
                    record.object?.canonical_url
                )

        };


        const profile =
            record.profile;


        // ==================================================
        // 2. RETRIEVED_AT KINYERÉSE
        // ==================================================

        const incomingRetrievedAtRaw =
            record.object?.retrieved_at ??
            record.profile?.source_retrieval?.retrieved_at ??
            record.raw_json?.source?.retrieval?.retrieved_at ??
            null;


        console.log(
            "AP incoming retrieved_at RAW:",
            incomingRetrievedAtRaw
        );


        if (!incomingRetrievedAtRaw) {

            setStatus(
                "⚠️ Az új Article Profile nem tartalmaz retrieved_at értéket. Nem írjuk felül.",
                "warning"
            );

            return;
        }


        const incomingRetrievedAt =
            new Date(
                incomingRetrievedAtRaw
            );


        if (
            Number.isNaN(
                incomingRetrievedAt.getTime()
            )
        ) {

            setStatus(
                "❌ Az Article Profile retrieved_at értéke nem érvényes dátum: " +
                incomingRetrievedAtRaw,
                "error"
            );

            return;
        }


        object.retrieved_at =
            incomingRetrievedAt.toISOString();


        console.log(
            "AP incoming retrieved_at NORMALIZED:",
            object.retrieved_at
        );


        // ==================================================
        // 3. CANONICAL URL ELLENŐRZÉSE
        // ==================================================

        if (!object.canonical_url) {

            setStatus(
                "❌ AP mentés: hiányzik a canonical URL.",
                "error"
            );

            return;
        }


        // ==================================================
        // 4. MEGLÉVŐ OBJECT KERESÉSE
        // ==================================================

        const lookupResponse = await fetch(

            CONFIG.SUPABASE_URL +
            "/rest/v1/ap_content_objects" +
            "?canonical_url=eq." +
            encodeURIComponent(
                object.canonical_url
            ) +
            "&select=id,date_modified,retrieved_at",

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


        console.log(
            "AP lookup találatok:",
            existing
        );


        // ==================================================
        // 5. ÚJ OBJECT
        // ==================================================

        if (existing.length === 0) {

            console.log(
                "AP új object mentése"
            );


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

                        body:
                            JSON.stringify(object)

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


            // ==================================================
            // 6. PROFILE LÉTREHOZÁSA
            // ==================================================

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

                        body:
                            JSON.stringify({

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
        // 7. MEGLÉVŐ OBJECT
        // ==================================================

        const existingObject =
            existing[0];


        console.log(
            "AP kiválasztott rekord:",
            existingObject
        );


        const existingRetrievedAt =
            existingObject.retrieved_at
                ? new Date(
                    existingObject.retrieved_at
                )
                : null;


        // ==================================================
        // 8. ÚJ KINYERÉS ELLENŐRZÉSE
        // ==================================================

        if (
            existingRetrievedAt &&
            incomingRetrievedAt <= existingRetrievedAt
        ) {

            setStatus(
                "⚠️ Ez az Article Profile már létezik, és nem újabb kinyerés. Nem írjuk felül.",
                "warning"
            );

            return;
        }


        // ==================================================
        // 9. FELÜLÍRÁS
        // ==================================================

        const updatePayload = {

            ...object,

            updated_at:
                new Date().toISOString()

        };


        console.log(
            "AP PATCH OBJECT:",
            JSON.stringify(
                updatePayload,
                null,
                2
            )
        );


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

                        // FONTOS:
                        // A Supabase adja vissza a ténylegesen
                        // módosított rekordot.
                        "Prefer":
                            "return=representation"

                    },

                    body:
                        JSON.stringify(
                            updatePayload
                        )

                }

            );


        console.log(
            "AP PATCH STATUS:",
            updateObjectResponse.status
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
        // 10. PATCH VÁLASZ ELLENŐRZÉSE
        // ==================================================

        const updatedObjects =
            await updateObjectResponse.json();


        console.log(
            "AP PATCH RESPONSE:",
            updatedObjects
        );


        if (
            !Array.isArray(updatedObjects) ||
            updatedObjects.length === 0
        ) {

            setStatus(
                "❌ A Supabase nem adott vissza frissített Article Profile rekordot.",
                "error"
            );

            return;
        }


        const updatedObject =
            updatedObjects[0];


        console.log(
            "AP ténylegesen mentett retrieved_at:",
            updatedObject.retrieved_at
        );


        // ==================================================
        // 11. TÉNYLEGES ADATBÁZIS-ELLENŐRZÉS
        // ==================================================

        if (
            !updatedObject.retrieved_at ||
            new Date(
                updatedObject.retrieved_at
            ).getTime() !==
            incomingRetrievedAt.getTime()
        ) {

            setStatus(
                "❌ A felülírás nem ellenőrizhető: a Supabase által visszaadott retrieved_at nem egyezik az új értékkel.",
                "error"
            );

            return;
        }


        // ==================================================
        // 12. PROFILE FRISSÍTÉSE
        // ==================================================

        const now =
            new Date().toISOString();


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

                    body:
                        JSON.stringify({

                            ...profile,

                            last_updated_at:
                                now,

                            updated_at:
                                now

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


        // ==================================================
        // 13. CSAK VALÓDI SIKER ESETÉN
        // ==================================================

        setStatus(
            "✅ Feltöltés sikerült, felülírva: " +
            updatedObject.retrieved_at,
            "success"
        );

    }

    catch (err) {

        console.error(
            "AP mentési hiba:",
            err
        );

        setStatus(
            "❌ AP mentési hiba: " +
            err.message,
            "error"
        );

    }

}