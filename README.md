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