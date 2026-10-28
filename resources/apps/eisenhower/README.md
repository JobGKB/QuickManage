# Broncode Eisenhower

> **In QuickManage**: deze map wordt live geserveerd op `/eisenhower` (geen bouwstap nodig; de pagina wordt op dezelfde manier aan elkaar gezet als met `build.py`). De Claude-runtime wordt vervangen door `public/js/artifact-apps/claude-runtime.js` en de database door het lokale bestand `storage/app/private/artifact-apps/eisenhower/database.json` (niet MySQL). Zie `docs/modules/artifact-apps.md` in de root van het project. `versiebeheer/eisenhower.bundle` is niet meegenomen: de geschiedenis loopt nu verder in de git van QuickManage.

Broncode van het artifact **Eisenhower** (https://claude.ai/artifact/AGZqLMpeZHTJK2DoYpnGfc).
Stand: v1, 13 oktober 2026 (gelijk aan artifact-versie 58, versie-id `1791778633-0b8b`).

## Indeling

| Map / bestand | Wat |
|---|---|
| `src/head.html` | Titel, lettertypen, begin van de stijl |
| `src/style.css` | Opmaak (GKB-huisstijl) |
| `src/body.html` | De HTML van de pagina (menu, tabbladen, vensters) |
| `src/js/00…25-*.js` | Het script, in stukken per onderwerp (planning, slepen, vakanties, voorbereiding, Excel, …) |
| `src/tail.html` | Afsluiting van het script |
| `src/volgorde.json` | Volgorde waarin de stukken aan elkaar worden gezet |
| `build.py` | Zet de stukken aan elkaar tot `dist/page.html` |
| `dist/page.html` | De pagina zoals die gepubliceerd wordt |
| `tests/` | Nepdatabase (`mock.js`) en klik-test (`klik-test.js`) |
| `versiebeheer/eisenhower.bundle` | Volledige git-geschiedenis in één bestand |
| `CHANGELOG.md` | Wat er per versie veranderd is |

Let op: een deel van de scriptstukken komt uit eerdere versies en wordt niet meer via het menu gebruikt (o.a. `10-eisenhower`, `16`/`25-projectenlijst-inlezen`, `17-signalen`, `19-regiebord`, `20-voortgang`, `24-projectvenster`). Ze zijn bewust ongewijzigd gelaten zodat `dist/page.html` byte-voor-byte gelijk is aan de gepubliceerde pagina. Niet per functie gecontroleerd of alles echt ongebruikt is.

## Bouwen

```
python build.py
```

Resultaat: `dist/page.html`. De stukken worden met één regeleinde (`\n`) aan elkaar gezet. Op 13 oktober 2026 gecontroleerd: het resultaat is byte-voor-byte gelijk aan de inhoud van de gepubliceerde versie 58.

## Testen

Nodig: Python 3, Node en Playwright (`npm i playwright`).

```
python build.py --test
node tests/klik-test.js
```

`--test` maakt ook `dist/test.html`: de pagina met een nepdatabase (nepploegen, nepprojecten TEST001–TEST003, een vrije dag). `test.html` hoort niet in versiebeheer (staat in `.gitignore`).

De test controleert: overzicht opent, vrije dag telt niet mee (één balk, 5 werkdagen), twee periodes blijven twee balken, "Nog in te plannen" bovenaan, voorbereidingsteken bezig → gereed, Delete wist één periode, Ctrl+Z, weekoverzicht, tabblad Vakanties, geen scriptfouten. Laatste uitvoering (13 oktober 2026): 10 geslaagd, 0 mislukt.

## Opnieuw publiceren

Publiceer `dist/page.html` naar **dezelfde** artifact-URL (anders ontstaat een nieuw artifact met een lege database). Geef daarbij deze capabilities mee:

```json
{
  "db": {
    "rules": [
      { "path": "",   "read": "view", "write": "admin" },
      { "path": "vb", "read": "view", "write": "interact" }
    ]
  },
  "downloads": {},
  "user": { "scopes": ["profile"] }
}
```

Runtime-versie (contract): `0.2.63`.

Betekenis van de regels: iedereen die de pagina mag bekijken mag alles lezen; alleen de eigenaar (Pieter) mag de planning wijzigen; wie de rol Contributor heeft (werkvoorbereiders) mag alleen de collectie `vb` (stand van de voorbereiding) wijzigen.

## Database (collecties)

| Collectie | Inhoud |
|---|---|
| `ploegen` | Ploegen: naam, leden, kleur, type (eigen/derden), volgorde |
| `items` | Projecten op de planning: naam, ploeg, dagen, splits, klaar (= gearchiveerd), potlood/potDagen (voorlopig), parallel, uitleen, let, wacht, nietVoor, notitie |
| `vb` | Stand van de voorbereiding per item: `niet` / `bezig` / `gereed`, door wie en wanneer |
| `afwezig` | Vakanties/afwezigheid per persoon: groep (kantoor/buiten/inhuur), dagen |
| `meta` (`instellingen`) | Vrije dagen en feestdagen, checklist, administratiepunten |
| `projecten`, `meta/import` | Oud: de IW-projectenlijst uit een eerdere versie. Niet meer gebruikt door de pagina, nog wel in de database. |

## Versiebeheer

De geschiedenis staat in `versiebeheer/eisenhower.bundle` (één bestand, er staat bewust geen `.git`-map op de pc).

Terughalen:

```
git clone versiebeheer/eisenhower.bundle eisenhower-werkmap
```

Nieuwe versie vastleggen (in die werkmap, niet in OneDrive):

```
git add -A
git commit -m "Korte omschrijving"
git tag v2
git bundle create eisenhower.bundle --all
```

Kopieer daarna het nieuwe `eisenhower.bundle` naar `broncode/versiebeheer/` en vul `CHANGELOG.md` aan.
