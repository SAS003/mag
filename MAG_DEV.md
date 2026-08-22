# MAG — Development Status

**Version:** v0.2.x  
**Status:** active development

---

## 1. Jelenlegi állapot

A MAG működő fejlesztési állapotban van.

### Működő funkciók

✔ CKI JSON import  
✔ JSON syntax normalization  
✔ Automatikus javítható JSON-szintaktikai hibák kezelése  
✔ CKI strukturális validáció  
✔ Preview  
✔ Save → Supabase  
✔ Generate SQL  
✔ CKI lista betöltése Supabase-ből  
✔ CKI Corpus export  
✔ GitHub repository kapcsolat

---

## 2. CKI Import működési logika

A CKI import két külön validációs réteget használ.

### 2.1 JSON szintaktikai réteg

Feladata:

- bemenet normalizálása
- Markdown code block eltávolítása
- BOM eltávolítása
- egyértelmű JSON escape-hibák automatikus javítása

Ha a JSON javítható:

> ⚠️ A JSON szintaktikai hibája automatikusan javítva.  
> A tartalom és a CKI séma nem változott.

A javított JSON visszakerül az input mezőbe.

### 2.2 CKI strukturális validáció

A JSON syntax repair után külön fut le a meglévő CKI-validáció.

A syntax repair és a CKI validation nem ugyanaz a réteg.

### 2.3 Preview folyamat

**1. Preview**

Ha javítható JSON-szintaktikai hiba van:

→ javítás  
→ javított JSON visszaírása  
→ javítási üzenet  
→ nincs "Érvényes CKI"

**2. Preview**

A már javított JSON:

→ CKI strukturális validáció  
→ hiba vagy  
→ `✅ Érvényes CKI`

---

## 3. Jelenlegi adatfolyam

```text
CKI JSON
   ↓
normalizeInput()
   ↓
JSON syntax check / repair
   ↓
CKI structure validation
   ↓
buildRecord()
   ↓
Preview
   ↓
Save → Supabase
   ↓
Generate SQL
   ↓
CKI Corpus Export
````

---

## 4. Projektstruktúra

A MAG jelenlegi JavaScript moduljai:

```text
js/
├── config.js
├── parser.js
├── preview.js
├── sql.js
├── supabase.js
├── list.js
├── cki_corpus_v1.js
└── app.js
```

### Fő szerepek

**config.js**
Supabase kapcsolat és projektkonfiguráció.

**parser.js**
CKI normalizálás, JSON syntax repair, CKI structure validation, record építés.

**preview.js**
CKI rekord Preview megjelenítése.

**sql.js**
SQL generálás.

**supabase.js**
Supabase kommunikáció.

**list.js**
CKI lista betöltése és megjelenítése.

**cki_corpus_v1.js**
CKI Corpus export.

**app.js**
A felület eseményeinek és moduljainak összekapcsolása.

---

## 5. Supabase

A MAG Supabase projektet használ adatbázisként.

Jelenlegi fontos táblák:

* `cki_conversations`
* `cki_relationship_suggestions`
* `cki_profiles`

A táblanevek projektazonosítóval kezdődnek, hogy ne keveredjenek más projektek tábláival.

---

## 6. Következő fejlesztési területek

A következő fejlesztéseket úgy kell hozzáadni, hogy a jelenlegi CKI Core működése ne sérüljön.

### Tervezett

□ Relationship Suggestions feldolgozás
□ Profile kezelés
□ Kereső
□ Open Chat
□ CKI részletező nézet
□ Knowledge Object kezelés
□ További corpus funkciók

A pontos sorrend fejlesztés közben kerül meghatározásra.

---

## 7. Fejlesztési környezet

### Lokális fejlesztés

A MAG lokálisan fut Live Server segítségével.

Példa:

```text
http://127.0.0.1:5500/index.html
```

A fejlesztés VS Code-ban történik.

### Git

A repository kezelése GitHub Desktop / Git segítségével történik.

Munkaritmus:

```text
működő állapot
    ↓
módosítás
    ↓
teszt
    ↓
commit
    ↓
push
```

Csak működő, ellenőrzött állapot kerül commitba.

---

## 8. Stabilitási szabály

A MAG meglévő CKI Core működését új funkció miatt nem szabad véletlenül megváltoztatni.

Kiemelten védett területek:

* CKI parser
* JSON syntax repair
* CKI validation
* Preview
* Save
* SQL generation
* Corpus export

Új funkció esetén elsődlegesen új modult kell létrehozni, és csak szükség esetén módosítani a meglévő Core-fájlokat.

A részletes stabilitási szabályokat a `README.md` tartalmazza.

---

## 9. Jelenlegi fejlesztési checkpoint

**MAG v0.2.x**

A jelenlegi működő állapot:

* CKI import működik
* JSON syntax repair működik
* Preview működik
* CKI validation működik
* Save → Supabase működik
* SQL export működik
* CKI lista működik
* CKI Corpus export működik
* a működő állapot Git commitban és GitHubon rögzítve van

**Innen kell folytatni.**

Ne állítsuk vissza korábbi állapotra a működő Core-t új funkció fejlesztése miatt.

