# Changelog Leeghwater

Versienummers hier (v1, v2 …) zijn git-tags. Tussen haakjes de versie van het gepubliceerde artifact.

## v4 – 16 oktober 2026 (artifactversie 97)
- Planning: het tekstveld "Voorgangers" is vervangen door keuzelijsten in drie kolommen: Volgt op, Relatie (volgend op, gelijk beginnen, gelijk eindigen, klaar vóór start, klaar na start) en Vertraging in werkdagen (negatief = overlap). Opmerking Pieter.

## v3 – 16 oktober 2026 (artifactversie 96)
- Planning (Tijdschema): werken met de muis, zoals in Eisenhower. Balk slepen = verschuiven, rand slepen = duur, bolletje naar een andere balk slepen = "start na einde van", rechtsklik = menu met koppelingen in gewone taal.
- Koppelingen gaan voor de datum (afspraak Pieter): slepen past de wachtdagen van de koppeling aan (negatief = overlap) en alles erachter schuift mee. Een vaste datum betekent nu "niet eerder dan": een voorganger die uitloopt duwt de werkgang op.
- Bij elke balk staat waarom hij daar start; bij aanwijzen lichten de koppellijnen op. Meldingen hebben een knop "Ongedaan maken".
- Fasering: onder de werkgangen staat waarom de werkgang start en wat er tegelijk loopt, met een knop naar de Planning.
- Nieuwe test `tests/slepen-planning.mjs`. Bestaande planningen: datums ongewijzigd (regressietest).

## v2 – 16 oktober 2026 (artifactversie 95)
- Hoofdfases draaien (◀/▶ bij de hoofdfases) werkt nu als wisselen van plek in de tijd. De werkgangen gaan mee met hun hoofdfase, maar de startdatum en koppeling van de eerste werkgang blijven bij de plek in de volgorde. Eerder raakten werkgangen hun datum kwijt (Heymansstraat) of liep de volgorde door elkaar.
- Na het draaien verschijnt een melding als een vaste datum midden in een hoofdfase de volgorde breekt (bijv. Boezemweg 2.6 op 30 november). Die datum wordt niet stilletjes aangepast.
- Fasering: de lijst rechts is per werkgang opgebouwd. Depot, routes, bouwhekken, schildjes en borden zitten ingeklapt onder "Voorzieningen" bij de werkgang (opmerking Pieter).
- Nieuwe test `tests/draaien-hoofdfases.mjs`.

## v1 – 13 oktober 2026 (artifactversie 94)
Eerste versie onder versiebeheer. Broncode opgesplitst in 21 delen; `build.py` bouwt een pagina die byte voor byte gelijk is aan de gepubliceerde versie 94.

Inhoud van deze versie (opgebouwd tussen 26 september en 12 oktober 2026):
- Faseringseditor: hoofdfases, werkgangen, werkvakken, werkgrens uit de PDF, hekken, schildjes, rijroutes, looproutes, depot.
- Verkeersborden in het gereedschap: catalogus van 17 borden (o.a. J16, C7 verboden voor vrachtauto's). Wit, behalve J16 en de omleidingsborden (geel; dat laatste is nog niet door Pieter bevestigd).
- Tijdschema als planning zoals MS Project: takenlijst met balken, voorgangers (EB/BB/EE/BE met speling), kritiek pad, basisplanning, % gereed, uitvoerders, stoppunten, aandachtslijst. Drie tabbladen: Planning, Bestekposten, Kalender en bronnen.
- Bestek en begroting inlezen; bestekposten per werkgang koppelen met slepen (start op 0, bestekvolgorde, volgposten verborgen); hoofdstukken koppelen aan werkzaamheden met naamvoorstel en voorzet naar oppervlakte.
- PDF's in GKB-huisstijl: fasering-PDF en planning-PDF, met afdrukvoorbeeld direct op de pagina en afdrukken per hoofdfase.
- Tabblad "Overzicht werkgangen" verwijderd.

## Eerdere versies (alleen in het log)
Artifactversies 1 t/m 93 zijn niet als broncode in deze map bewaard; ze staan alleen in de versiegeschiedenis van het artifact en in de gespreksnotitie van 9 oktober 2026 (00-Inbox). Bekende tussenstappen uit dat gesprek: versie 82 (vóór het planningswerk) en versie 91 (vóór de verkeersborden); de datums daarvan zijn niet vastgelegd.
