/*
==========================================================
MAG v0.2.9
cki_update.js
==========================================================

CKI UPDATE DECISION UI

UPDATE_CANDIDATE is not a final save action.
The user must explicitly choose:
- update an existing candidate record, or
- save as a new record.

The module also shows a structural comparison summary.
==========================================================
*/

let pendingCKIUpdateDecision = null;


function clearCKIUpdateDecision() {

    pendingCKIUpdateDecision = null;

    const panel =
        document.getElementById(
            "ckiDecisionPanel"
        );

    if (!panel) return;

    panel.classList.add("hidden");

    const candidates =
        document.getElementById(
            "ckiCandidates"
        );

    if (candidates) {
        candidates.innerHTML = "";
    }

}


function canonicalValue(value) {

    return canonicalCKIComparisonValue(
        value
    );

}


function collectDifferencePaths(
    incoming,
    existing,
    path = "",
    output = [],
    limit = 50
) {

    if (
        output.length >= limit
    ) {
        return output;
    }

    if (Object.is(incoming, existing)) {
        return output;
    }

    const incomingArray =
        Array.isArray(incoming);

    const existingArray =
        Array.isArray(existing);

    if (
        incomingArray !==
        existingArray
    ) {

        output.push(
            path || "<root>"
        );

        return output;

    }

    if (
        incomingArray &&
        existingArray
    ) {

        if (
            incoming.length !==
            existing.length
        ) {

            output.push(
                path + ".length"
            );

        }

        const length =
            Math.min(
                incoming.length,
                existing.length
            );

        for (
            let i = 0;
            i < length &&
            output.length < limit;
            i++
        ) {

            collectDifferencePaths(
                incoming[i],
                existing[i],
                path + "[" + i + "]",
                output,
                limit
            );

        }

        return output;

    }

    const incomingObject =
        incoming !== null &&
        typeof incoming === "object";

    const existingObject =
        existing !== null &&
        typeof existing === "object";

    if (
        incomingObject &&
        existingObject
    ) {

        const keys =
            Array.from(
                new Set([
                    ...Object.keys(
                        incoming
                    ),
                    ...Object.keys(
                        existing
                    )
                ])
            ).sort();

        for (
            const key of keys
        ) {

            if (
                output.length >= limit
            ) {
                break;
            }

            const childPath =
                path
                    ? path + "." + key
                    : key;

            collectDifferencePaths(
                incoming[key],
                existing[key],
                childPath,
                output,
                limit
            );

        }

        return output;

    }

    output.push(
        path || "<root>"
    );

    return output;

}


function candidateSummary(
    candidate
) {

    const json =
        canonicalValue(
            candidate.cki_json
        );

    const metadata =
        json &&
        typeof json === "object"
            ? json.metadata
            : null;

    return {
        logical_title:
            candidate.logical_title ??
            metadata?.logical_title ??
            "",
        chat_title:
            candidate.chat_title ??
            metadata?.chat_title ??
            "",
        conversation_start:
            candidate.conversation_start ??
            metadata?.conversation_start ??
            null,
        inserted_at:
            candidate.inserted_at ??
            null,
        id:
            candidate.id,
        json
    };

}


function createText(
    tag,
    text
) {

    const el =
        document.createElement(
            tag
        );

    el.textContent =
        text ?? "";

    return el;

}


function renderCKIUpdateDecision(
    record,
    existing
) {

    pendingCKIUpdateDecision = {
        record,
        candidates:
            existing
    };

    const panel =
        document.getElementById(
            "ckiDecisionPanel"
        );

    const container =
        document.getElementById(
            "ckiCandidates"
        );

    const summary =
        document.getElementById(
            "ckiDecisionSummary"
        );

    if (
        !panel ||
        !container ||
        !summary
    ) {
        return;
    }

    container.innerHTML = "";

    const heading =
        existing.length === 1
            ? "1 meglévő rekord található."
            : existing.length +
              " meglévő rekord található.";

    summary.textContent =
        heading +
        " A beérkező CKI nem azonos egyik meglévő rekorddal sem. Az alábbi összehasonlítás alapján választhatsz.";

    existing.forEach(
        candidate => {

            const info =
                candidateSummary(
                    candidate
                );

            const differences =
                collectDifferencePaths(
                    record.raw_json,
                    info.json
                );

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "cki-candidate";

            const title =
                createText(
                    "h3",
                    info.logical_title ||
                        "(névtelen CKI)"
                );

            const meta =
                createText(
                    "div",
                    "Rekord ID: " +
                    String(
                        info.id ?? ""
                    )
                );

            meta.className =
                "cki-candidate-meta";

            const detail =
                createText(
                    "div",
                    "Beszélgetés: " +
                    String(
                        info.chat_title ||
                        ""
                    ) +
                    " · Dátum: " +
                    String(
                        info.conversation_start ??
                        ""
                    )
                );

            detail.className =
                "cki-candidate-meta";

            const diffTitle =
                createText(
                    "div",
                    "Eltérő mezők:"
                );

            diffTitle.className =
                "cki-candidate-label";

            const diffList =
                document.createElement(
                    "ul"
                );

            diffList.className =
                "cki-diff-list";

            if (
                differences.length === 0
            ) {

                diffList.appendChild(
                    createText(
                        "li",
                        "Nincs kimutatható eltérés."
                    )
                );

            }
            else {

                differences.forEach(
                    difference => {

                        diffList.appendChild(
                            createText(
                                "li",
                                difference
                            )
                        );

                    }
                );

                if (
                    differences.length >= 50
                ) {

                    diffList.appendChild(
                        createText(
                            "li",
                            "… további eltérések lehetnek."
                        )
                    );

                }

            }

            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "button-row";

            const updateButton =
                document.createElement(
                    "button"
                );

            updateButton.textContent =
                "Frissítés erre a rekordra";

            updateButton.onclick =
                async function () {

                    const confirmed =
                        window.confirm(
                            "A kiválasztott meglévő rekord teljes CKI-tartalma felülíródik a beérkező rekorddal. Folytatod?"
                        );

                    if (!confirmed) {
                        return;
                    }

                    await updateExistingCKIRecord(
                        candidate,
                        record
                    );

                };

            actions.appendChild(
                updateButton
            );

            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(detail);
            card.appendChild(diffTitle);
            card.appendChild(diffList);
            card.appendChild(actions);

            container.appendChild(card);

        }
    );

    const saveNewButton =
        document.getElementById(
            "saveCKIAsNewBtn"
        );

    if (saveNewButton) {

        saveNewButton.onclick =
            async function () {

                await saveCKIAsNew(
                    record
                );

            };

    }

    const cancelButton =
        document.getElementById(
            "cancelCKIUpdateBtn"
        );

    if (cancelButton) {

        cancelButton.onclick =
            function () {

                clearCKIUpdateDecision();

                setStatus(
                    "A mentési művelet megszakítva.",
                    "warning"
                );

            };

    }

    panel.classList.remove(
        "hidden"
    );

}


async function updateExistingCKIRecord(
    candidate,
    record
) {

    try {

        const id =
            candidate?.id;

        if (!id) {

            setStatus(
                "❌ Nem azonosítható a frissítendő rekord.",
                "error"
            );

            return {
                success: false,
                state: "UPDATE_ERROR"
            };

        }

        const latestResponse =
            await fetch(
                CONFIG.SUPABASE_URL +
                "/rest/v1/" +
                CONFIG.TABLE +
                "?id=eq." +
                encodeURIComponent(
                    id
                ) +
                "&select=id,cki_json",
                {
                    method: "GET",
                    headers: {
                        apikey:
                            CONFIG.SUPABASE_ANON_KEY,
                        Authorization:
                            "Bearer " +
                            CONFIG.SUPABASE_ANON_KEY
                    }
                }
            );

        if (
            !latestResponse.ok
        ) {

            const error =
                await latestResponse.text();

            setStatus(
                "❌ Nem sikerült ellenőrizni a frissítendő rekordot: " +
                error,
                "error"
            );

            return {
                success: false,
                state: "UPDATE_ERROR"
            };

        }

        const latest =
            await latestResponse.json();

        if (
            latest.length !== 1
        ) {

            setStatus(
                "❌ A frissítendő rekord már nem érhető el. Frissítés nem történt.",
                "error"
            );

            return {
                success: false,
                state: "UPDATE_CONFLICT"
            };

        }

        const expected =
            canonicalJSONStringify(
                canonicalValue(
                    candidate.cki_json
                )
            );

        const actual =
            canonicalJSONStringify(
                canonicalValue(
                    latest[0].cki_json
                )
            );

        if (
            expected !== actual
        ) {

            setStatus(
                "⚠️ A kiválasztott rekord időközben megváltozott. Frissítés nem történt; futtass új Save ellenőrzést.",
                "warning"
            );

            return {
                success: false,
                state: "UPDATE_CONFLICT"
            };

        }

        const updateResponse =
            await fetch(
                CONFIG.SUPABASE_URL +
                "/rest/v1/" +
                CONFIG.TABLE +
                "?id=eq." +
                encodeURIComponent(
                    id
                ),
                {
                    method: "PATCH",

                    headers: {
                        apikey:
                            CONFIG.SUPABASE_ANON_KEY,

                        Authorization:
                            "Bearer " +
                            CONFIG.SUPABASE_ANON_KEY,

                        "Content-Type":
                            "application/json",

                        Prefer:
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            buildCKISupabasePayload(
                                record
                            )
                        )
                }
            );

        if (
            !updateResponse.ok
        ) {

            let error = {};

            try {

                error =
                    await updateResponse.json();

            }
            catch {

                error = {
                    message:
                        await updateResponse.text()
                };

            }

            setStatus(
                "❌ A CKI frissítése sikertelen: " +
                (
                    error.message ??
                    "ismeretlen hiba"
                ),
                "error"
            );

            return {
                success: false,
                state: "UPDATE_ERROR",
                error
            };

        }

        clearCKIUpdateDecision();

        setStatus(
            "✅ A kiválasztott CKI rekord frissítve.",
            "success"
        );

        if (
            typeof loadCKIList ===
            "function"
        ) {
            await loadCKIList();
        }

        return {
            success: true,
            state: "UPDATE_EXISTING",
            id
        };

    }
    catch (err) {

        setStatus(
            "❌ " +
            (
                err?.message ??
                String(err)
            ),
            "error"
        );

        return {
            success: false,
            state: "UPDATE_ERROR",
            error: err
        };

    }

}


async function saveCKIAsNew(
    record
) {

    const result =
        await insertCKIRecord(
            record,
            "NEW"
        );

    if (
        result.success
    ) {

        clearCKIUpdateDecision();

        setStatus(
            "✅ A CKI új rekordként elmentve. Állapot: SAVE_AS_NEW.",
            "success"
        );

        if (
            typeof loadCKIList ===
            "function"
        ) {
            await loadCKIList();
        }

        return {
            ...result,
            state: "SAVE_AS_NEW"
        };

    }

    return result;

}


const showCKIUpdateDecision =
    renderCKIUpdateDecision;
