# Broncode Leeghwater

> **In QuickManage**: deze map wordt live geserveerd op `/leeghwater` (geen bouwstap nodig; de pagina wordt op dezelfde manier aan elkaar gezet als met `build.py`). De Claude-runtime wordt vervangen door `public/js/artifact-apps/claude-runtime.js`. De database is het lokale bestand `storage/app/private/artifact-apps/leeghwater/database.json` (niet MySQL), tekeningen staan in `.../leeghwater/assets/`. "Claude laten meekijken" (sample) werkt alleen in Claude. Zie `docs/modules/artifact-apps.md` in de root van het project.

## Bouwen
```
python3 build.py          # dist/page.html  (dit publiceer je)
python3 build.py --test   # ook dist/test.html (nep-database, niet publiceren)
```
`build.py` plakt aan elkaar: `00-kop.html`, `<style>` + `10-stijl.css` + `</style>`, `20-pagina.html`, `<script>` + alle `3x/4x-*.js` op volgorde + `</script>`.
De scripts vormen samen één functie `(() => { … })();`: het eerste deel opent die, het laatste sluit hem. Losse delen zijn dus geen zelfstandige modules; controleer na bouwen met `node --check` op het script of draai de tests.

Het artifact-platform zet zelf een schil (`<!doctype html><html><head>…<body>` en `</body></html>`) om de pagina heen; `page.html` bevat die schil niet.

## Delen
| Bestand | Inhoud |
|---|---|
| 30-basis-en-toestand | hulpfuncties, kleuren, werkzaamheden, formaten, toestand `S` |
| 31-capabilities | koppeling met `window.claude` (db, assets, downloads, sample, user) |
| 32-navigatie-home-nieuw | navigatie, projectenoverzicht, nieuw project |
| 33-project-en-opslaan | project openen, wijzigingen van anderen verwerken, opslaan, automatische backups |
| 34-validatie-import | formaatcontrole, import en backup terugzetten |
| 35-overzicht-beheer | overzicht, tabblad Project (beheer, werkzaamheden, versies, tekening vervangen) |
| 36-analyse | analyse met Claude (sample) |
| 37-tijdschema | kalender, feestdagen, vrije periodes en de planningsmotor (`planCompute`, `scheduleRows`) |
| 38-planning | het Planning-scherm: takenlijst met balken, detailpaneel, menu's |
| 39-hoofdstukken-koppelen | bestekhoofdstukken ↔ werkzaamheden, voorzet |
| 40-bestekposten-koppelen | slepen van bestekposten naar werkgangen |
| 41-ondersteuning | aandachtslijst, uitvoerders, bestek/begroting inlezen, standaardtaken |
| 42-pdf-export | fasering- en planning-PDF (jsPDF), afdrukvoorbeeld, backup |
| 43–46 editor-* | tekeneditor: geometrie, tekening, werkgrens, paneel, tekenen |
| 47-verkeersborden-en-start | bordencatalogus, toetsen, `render(); boot();` |

## Capabilities
`sample`, `assets`, `db`, `downloads`, `user` (scope `profile`). Bij publiceren de declaratie ongewijzigd laten.

## Database (gedeelde opslag)
- `projects/<id>` – projectgegevens: naam, nummer, plaats, opdrachtgever, tekening (asset-id `bg`, bij PDF ook `pdf`), `workExtent`, `counts`.
- `plans/<id>` – `{json, rev, updatedAt, updatedBy}`; `json` is de planning als tekst in formaat `heymansstraat-project-v1` of `leeghwater-project-v1`. Onbekende velden blijven behouden.
- `backups/<id>~<yyyymmddhhmmss>` – automatische en handmatige versies (`json`, `label`, `kind`, `at`, `by`), laatste 25 per project.
- `analyses/<id>` en `analyses/<id>-vorige` – uitkomst van "Claude laten meekijken".

Regels: altijd schrijven met de laatst gelezen versie (`if_version`); nooit een document overschrijven zonder het eerst te lezen; schrijven vanuit Claude alleen op verzoek van Pieter.

## Tests
Benodigd: Node met `playwright` (zie `tests/package.json`). Eerst `python3 build.py --test`.
- `node tests/regressie-planning.mjs` – start, eind en duur van alle werkgangen van beide projecten moeten gelijk zijn aan `tests/verwacht-planning.json`. `--opnieuw` schrijft een nieuwe verwachting (alleen na een bewuste planningswijziging door Pieter).
- `node tests/kliktest.mjs` – opent beide projecten, alle tabbladen en subtabbladen en de bordencatalogus; slaagt zonder JavaScript-fouten.
- `node tests/draaien-hoofdfases.mjs` – elke hoofdfase één plek naar voren en terug: geen werkgang zonder datum, geen overlap binnen een hoofdfase, terugdraaien geeft dezelfde planning.
- `node tests/slepen-planning.mjs` – rechtsklik-koppeling, balk en rand slepen, koppeling trekken en Ctrl+Z op Heymansstraat.
- `tests/seed.json` is de database-stand van 13-10-2026 voor de testpagina.

Stand 16-10-2026 (v3): alle vier de tests geslaagd. Extra controle: met versie 82 (vóór het planningswerk) is Heymansstraat identiek; bij Boezemweg wijkt werkgang 1.9 af omdat daar ná versie 82 in de app een voorganger (1.8 EB + 2 dagen) is ingesteld die versie 82 nog niet kende. Dat is een invoerwijziging, geen codefout.
