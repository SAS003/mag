/*
==========================================================
MAG v0.2.11
CKI import failure diagnostics
==========================================================

CKI-only helper. It does not repair input or change validation.
It summarizes the original parser/validator/storage error and
uses the input JSON only to suggest a likely cause.
==========================================================
*/

function clearCKIImportDiagnostic() {
    const panel = document.getElementById("ckiImportDiagnostic");
    if (panel) panel.classList.add("hidden");
}

function describeCKIImportFailure({
    stage,
    rawInput,
    errors,
    version
}) {
    const raw = typeof rawInput === "string"
        ? rawInput
        : rawInput && typeof rawInput === "object"
            ? JSON.stringify(rawInput, null, 2)
            : String(rawInput ?? "");
    const messages = (Array.isArray(errors) ? errors : [errors])
        .filter(value => value !== null && value !== undefined)
        .map(value => {
            if (typeof value === "string") return value;
            if (typeof value === "object") {
                return [
                    value.message,
                    value.details,
                    value.hint,
                    value.code ? "code=" + value.code : null,
                    value.status ? "status=" + value.status : null
                ].filter(Boolean).join(" | ") || JSON.stringify(value);
            }
            return String(value);
        });
    const originalError = messages.join(" | ") || "Nincs részletes hibaüzenet.";
    let phase = stage || "CKI feldolgozás";
    let likelyCause = "A rendelkezésre álló hibaüzenetből nem állapítható meg biztosan az ok.";
    let nextStep = "A fenti eredeti hibaüzenet alapján ellenőrizd a megjelölt feldolgozási lépést.";

    if (stage === "database") {
        const code = messages.join(" ").match(/(?:code[=: ]+)([A-Z0-9]+)/i)?.[1] || "";
        if (code === "23505") {
            phase = "Adatbázis-mentés";
            likelyCause = "Az adatbázis egyedi korlátozás miatti ütközést jelzett.";
            nextStep = "Ellenőrizd az ütköző rekordot; a meglévő adatot a MAG nem írja felül automatikusan.";
        } else if (/Failed to fetch|NetworkError|network request|fetch failed/i.test(originalError)) {
            phase = "Adatbázis-kapcsolat";
            likelyCause = "A böngésző nem tudta befejezni a Supabase-kérést; hálózati vagy elérési hiba lehetséges.";
            nextStep = "Ellenőrizd a kapcsolatot, majd próbáld újra. Ha ismétlődik, nézd meg a böngésző hálózati hibáját.";
        } else if (/401|403|permission denied|row.level security|RLS|JWT/i.test(originalError)) {
            phase = "Adatbázis-jogosultság";
            likelyCause = "A Supabase elutasíthatta a kérést jogosultsági vagy RLS-szabály miatt.";
            nextStep = "Ellenőrizd a Supabase-válasz státuszkódját és a vonatkozó jogosultsági szabályt.";
        } else if (/PGRST204|42703|column .* does not exist|schema cache/i.test(originalError)) {
            phase = "Adatbázis-séma";
            likelyCause = "A mentési mezők és a Supabase által elérhető séma között eltérés lehet.";
            nextStep = "Hasonlítsd össze a konkrét hibában megnevezett oszlopot a live CKI-táblával.";
        } else {
            phase = "Adatbázis-mentés";
            likelyCause = "A Supabase mentési kérés hibával tért vissza; a pontos okot az eredeti válasz tartalmazhatja.";
            nextStep = "A teljes Supabase-hibaüzenet és kód alapján vizsgáld tovább a mentést.";
        }
    } else if (/source_metadata|processing_metadata/i.test(raw) ||
               /source_metadata|processing_metadata/i.test(originalError)) {
        phase = "CKI v1.3 sémaellenőrzés";
        likelyCause = "A bemenet a régi source_metadata / processing_metadata szerkezetet használhatja, amely nem canonical CKI v1.3.";
        nextStep = "Az exportot a canonical CKI v1.3 specifikáció szerint kell előállítani; a MAG nem alakítja át automatikusan a régi sémát.";
    } else if (stage === "detection") {
        phase = "Bemenettípus-felismerés";
        likelyCause = "A bemenet nem tartalmazta egyértelműen a CKI felismeréséhez szükséges szerkezeti jeleket.";
        nextStep = "Ellenőrizd, hogy a teljes CKI JSON-t illesztetted-e be, és szerepel-e benne a metadata.cki_spec_version, retrieval_summary és topics.primary mező.";
    } else if (/Érvénytelen CKI verzió|cki_spec_version|elvárt: 1\\.3/i.test(originalError) ||
               (version && version !== "ismeretlen" && version !== "1.3")) {
        phase = "CKI verzióellenőrzés";
        likelyCause = "A bemenet verziójelölése nem felel meg a MAG által elfogadott CKI v1.3-nak.";
        nextStep = "Ellenőrizd a metadata.cki_spec_version értékét és a használt export-specifikációt.";
    } else if (/Unexpected token|Expected property name|Expected ','|JSON.parse|position \d+|unterminated|end of JSON input|is not valid JSON/i.test(originalError)) {
        phase = "JSON-szintaxis";
        likelyCause = "A bemenet nem érvényes JSON, vagy a szintaktikai javítás sem tudta biztonságosan feldolgozni.";
        nextStep = "Ellenőrizd a hiba körüli idézőjeleket, vesszőket, kapcsos zárójeleket és escape-szekvenciákat.";
        const position = originalError.match(/position\s+(\d+)/i);
        if (position) {
            const offset = Number(position[1]);
            const before = raw.slice(0, offset);
            const line = before.split("\n").length;
            const column = offset - before.lastIndexOf("\n");
            nextStep += " A parser pozíciója: " + offset + " (kb. " + line + ". sor, " + column + ". oszlop).";
        }
    } else if (/Hiányzik a |Hiányzik:|Érvénytelen metadata\.|mező kell legyen|mező tömb kell legyen|nem megengedett/i.test(originalError)) {
        phase = "CKI v1.3 sémaellenőrzés";
        likelyCause = "A JSON olvasható, de hiányzó kötelező mező, nem megfelelő adattípus vagy nem megengedett szerkezet miatt nem felel meg a CKI v1.3-nak.";
        nextStep = "A fenti validációs üzenetben megnevezett mezőt ellenőrizd az export-specifikáció alapján.";
    } else if (/CKI/i.test(raw) && /metadata|retrieval_summary|topics/i.test(raw)) {
        likelyCause = "A bemenet CKI-re hasonlít, de a parser vagy a validátor elutasította; a pontos okot a fenti hibaüzenet határolja be.";
        nextStep = "A konkrét hibaüzenet alapján javítsd az exportot, majd futtasd újra a Preview ellenőrzést.";
    }

    let inputEvidence = "A bemenet tartalma nem volt JSON-ként értelmezhető.";
    try {
        const json = JSON.parse(raw);
        const detectedVersion = json?.metadata?.cki_spec_version;
        inputEvidence = "A bemenet JSON-ként olvasható" +
            (detectedVersion !== undefined ? "; CKI-verzió: " + String(detectedVersion) : "") +
            ".";
        if (json?.source_metadata || json?.processing_metadata) {
            inputEvidence += " Régi metadata-objektum is jelen van.";
        }
        if (json?.metadata && !Object.prototype.hasOwnProperty.call(json.metadata, "cki_spec_version")) {
            inputEvidence += " A metadata.cki_spec_version mező hiányzik.";
        }
    } catch {
        inputEvidence = "A teljes bemenet nem értelmezhető JSON-ként.";
    }

    return { phase, originalError, likelyCause, nextStep, inputEvidence };
}

function showCKIImportFailureDiagnostic({
    stage,
    rawInput,
    errors,
    version
}) {
    const panel = document.getElementById("ckiImportDiagnostic");
    if (!panel) return;

    const report = describeCKIImportFailure({
        stage,
        rawInput,
        errors,
        version
    });

    const values = {
        ckiDiagPhase: report.phase,
        ckiDiagError: report.originalError,
        ckiDiagEvidence: report.inputEvidence,
        ckiDiagCause: report.likelyCause,
        ckiDiagNextStep: report.nextStep
    };

    for (const [id, value] of Object.entries(values)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    panel.classList.remove("hidden");
}
