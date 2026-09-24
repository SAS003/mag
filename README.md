# mag
Conversation Knowledge Workspace
0803 Beszélgetések rendszerezése

mag/
│

├── index.html

│

├── css/

│   └── style.css

│

├── js/

│   ├── parser.js
│   ├── preview.js
│   ├── sql.js
│   ├── cki_corpus_v1.js
│   ├── cki_export.js
│   └── app.js
│

└── assets/

# MAG Core Contract

1. A meglévő CKI Import működése nem változhat új funkció miatt.
2. A JSON syntax repair és CKI validation egymástól külön réteg.
3. A Preview kétlépcsős működése megmarad.
4. A Save csak valid CKI-re működhet.
5. A Generate SQL a már validált rekordból dolgozik.
6. A Corpus Export működése nem változhat új adatmodul miatt.
7. Új funkció elsődlegesen új modulban jelenjen meg.
8. Minden nagyobb módosítás előtt legyen egy működő Git commit.
9. Tesztelés után commit, majd push.
10. Ha egy új funkció módosít egy Core-fájlt, előbb meg kell indokolni, miért nem oldható meg külön modulban.

# CKI Import / Export Contract

A MAG a kanonikus **FTR-KI01 CKI v1.2** szerkezetet kezeli:

- `metadata`
- `summary`
- `retrieval_summary`
- `topics.primary`
- további CKI v1.2 mezők

Import oldalon kompatibilitási réteg kezeli a korábbi MAG-struktúrát is:

- `source_metadata`
- `processing_metadata`

A parser képes a ChatGPT által adott olyan válaszból is kinyerni a CKI JSON objektumot, amelyben a JSON Markdown code blockban vagy körülötte magyarázó szöveg szerepel.

A `cki_json` wrapper kompatibilis importként kezelhető, de mentéshez és új exporthoz kanonikus CKI objektummá normalizálódik.

A **Export Current CKI** kizárólag egyetlen kanonikus CKI v1.2 JSON objektumot tölt le. A fájlnév a `metadata.logical_title` alapján képződik, majd `__CKI-v1.2.json` kiterjesztést kap.

A **Export CKI Corpus** ettől különálló, adatbázis/corpus szintű export és változatlanul működik.
