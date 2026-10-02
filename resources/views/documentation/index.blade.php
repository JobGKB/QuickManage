<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.min.js" integrity="sha384-cuYeSxntonz0PPNlHhBs68uyIAVpIIOZZ5JqeqvYYIcEL727kskC66kF92t6Xl2V" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('storage/fav-cm.png') }}">

    <title>Documentatie - {{ config('app.name', 'QuickManage') }}</title>
    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="https://fonts.bunny.net/css?family=Nunito" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/docs.css') }}">
</head>
<body>

    <section class="header">
        <div class="container border-left">
            <div class="row">
                <div class="col-lg-12">
                    <div class="header-wrapper">
                        <img src="{{ asset('storage/logo-cm.png') }}" alt="QuickManage Logo" class="img">
                        <input type="text" class="searchbar" id="doc_search" placeholder="Zoeken...">
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="content">
        <div class="container border-left">
            <div class="row">

                <div class="col-lg-3">
                    <div class="menu">
                        <ul>
                            <li><a href="#introductie">Introductie</a></li>
                            <li><a href="#aan-de-slag">Aan de slag</a></li>
                            <li class="menu-group">
                                <span class="menu-title">Profielplaatjes</span>
                                <ul>
                                    <li><a href="#profielplaatjes">Genereren</a></li>
                                    <li><a href="#profielplaatjes-download">Downloaden</a></li>
                                    <li><a href="#foutmeldingen">Foutmeldingen</a></li>
                                </ul>
                            </li>
                        </ul>
                        <p class="no-results" id="no_results">Geen resultaten gevonden.</p>
                    </div>
                </div>

                <div class="col-lg-9">

                    {{-- Introductie --}}
                    <div class="doc-section" id="content-introductie">
                        <h1>Introductie</h1>
                        <p>Welkom bij de documentatie van QuickManage.</p>
                        <p>Op deze pagina vind je uitleg over de functionaliteiten en API's die QuickManage aanbiedt. Gebruik het menu aan de linkerkant om door de verschillende onderdelen te navigeren, of gebruik de zoekbalk bovenin om snel een onderwerp te vinden.</p>
                        <p>Heb je vragen of loop je ergens tegenaan? Neem dan contact op met de GIS-afdeling van GKB Groep.</p>

                        <h4>Onderdelen</h4>
                        <ul>
                            <li><a href="#aan-de-slag">Aan de slag</a>: algemene informatie over het aanroepen van de API.</li>
                            <li><a href="#profielplaatjes">Profielplaatjes genereren</a>: automatisch PDF-profielplaatjes laten maken op basis van meetgegevens.</li>
                            <li><a href="#profielplaatjes-download">Profielplaatjes downloaden</a>: het ophalen van de gegenereerde profielplaatjes als zip-bestand.</li>
                            <li><a href="#foutmeldingen">Foutmeldingen</a>: overzicht van mogelijke foutcodes en hoe je deze oplost.</li>
                        </ul>
                    </div>

                    {{-- Aan de slag --}}
                    <div class="doc-section" id="content-aan-de-slag">
                        <h3>Aan de slag</h3>
                        <p>De QuickManage API is een REST API die met JSON werkt. Alle endpoints zijn bereikbaar onder de volgende basis-URL:</p>
                        <p>
                            <strong id="base_url">https://gisdev.gkbgroep.nl/api</strong>
                            <i class="fa-solid fa-copy copy-btn" data-copy-target="base_url" role="button" title="Kopiëren"></i>
                        </p>

                        <h5>Headers</h5>
                        <p>Stuur bij elk request de volgende headers mee:</p>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Header</th><th>Waarde</th><th>Omschrijving</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><code>Content-Type</code></td><td><code>application/json</code></td><td>De request body wordt als JSON verstuurd.</td></tr>
                                <tr><td><code>Accept</code></td><td><code>application/json</code></td><td>Zorgt ervoor dat foutmeldingen ook als JSON worden teruggegeven in plaats van een redirect.</td></tr>
                            </tbody>
                        </table>

                        <h5>Tips</h5>
                        <ul>
                            <li>Gebruik bij voorkeur HTTP/2 wanneer je client dit ondersteunt.</li>
                            <li>Het genereren van grote aantallen profielplaatjes kan enige tijd duren. Stel de timeout van je client daarom ruim in (bijvoorbeeld 5 minuten).</li>
                            <li>Splits grote hoeveelheden profielen op in meerdere requests (chunking) van maximaal 250 profielen per request.</li>
                        </ul>
                    </div>

                    {{-- Profielplaatjes genereren --}}
                    <div class="doc-section" id="content-profielplaatjes">
                        <h3>Automatisch genereren van profielplaatjes</h3>
                        <p class="endpoint">
                            <span class="method method-post">POST</span>
                            <strong id="api_url_generate">https://gisdev.gkbgroep.nl/api/profielplaatjes/generate</strong>
                            <i class="fa-solid fa-copy copy-btn" data-copy-target="api_url_generate" role="button" title="Kopiëren"></i>
                        </p>
                        <p>Met dit endpoint worden op basis van meetgegevens automatisch profielplaatjes (PDF) gegenereerd. Per profiel wordt één PDF aangemaakt; alle PDF's worden gebundeld in één zip-bestand. Als antwoord ontvang je een downloadlink naar dit zip-bestand.</p>
                        <p>Er kunnen maximaal <strong>250 profielen</strong> per request worden gegenereerd. Afhankelijk van de serverbelasting kan dit enige tijd duren.</p>

                        <h5>Request body</h5>
                        <p>De request body moet een JSON-object bevatten met de sleutel <code>profielen</code>, met daarin een array van profielen. Elk profiel bevat de onderstaande velden. Optionele velden mogen leeg zijn of gevuld met een placeholder (bijv. <code>"-"</code>).</p>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Veld</th><th>Type</th><th>Verplicht</th><th>Omschrijving</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><code>profielcode</code></td><td>string</td><td>Ja</td><td>De code van het profiel (max. 50 tekens). Wordt ook gebruikt als bestandsnaam van de PDF.</td></tr>
                                <tr><td><code>project</code></td><td>string</td><td>Ja</td><td>De code van het project (max. 255 tekens).</td></tr>
                                <tr><td><code>opdrachtgever</code></td><td>string</td><td>Ja</td><td>De naam van de opdrachtgever (max. 255 tekens).</td></tr>
                                <tr><td><code>omschrijving</code></td><td>string</td><td>Ja</td><td>Een korte omschrijving van het profiel (max. 255 tekens).</td></tr>
                                <tr><td><code>baggercode</code></td><td>string</td><td>Ja</td><td>De baggercode (max. 100 tekens).</td></tr>
                                <tr><td><code>legger</code></td><td>string</td><td>Ja</td><td>De legger (max. 100 tekens).</td></tr>
                                <tr><td><code>polderpeil</code></td><td>string</td><td>Ja</td><td>Het polderpeil (max. 100 tekens).</td></tr>
                                <tr><td><code>waterpeil</code></td><td>string</td><td>Ja</td><td>Het waterpeil (max. 100 tekens).</td></tr>
                                <tr><td><code>dynamic_fields</code></td><td>array</td><td>Ja</td><td>Een array met daarin een object van maximaal 2 dynamische velden. De naam en waarde van elk veld bepaal je zelf; deze worden op het profielplaatje getoond.</td></tr>
                                <tr><td><code>punten</code></td><td>array</td><td>Ja</td><td>Een array van meetpunten (minimaal 1). Zie de tabel hieronder.</td></tr>
                            </tbody>
                        </table>

                        <h5>Punten</h5>
                        <p>Elk punt in de array <code>punten</code> is een object met de volgende velden:</p>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Veld</th><th>Type</th><th>Omschrijving</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><code>puntnr</code></td><td>integer</td><td>Het volgnummer van het punt.</td></tr>
                                <tr><td><code>afstand</code></td><td>float</td><td>De afstand in meters vanaf het beginpunt van het profiel.</td></tr>
                                <tr><td><code>puntsoort</code></td><td>string</td><td>De soort van het punt. Zie de puntsoorten hieronder.</td></tr>
                                <tr><td><code>meting</code></td><td>float</td><td>De gemeten hoogte op dat punt (t.o.v. NAP).</td></tr>
                            </tbody>
                        </table>

                        <h5>Puntsoorten</h5>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Puntsoort</th><th>Betekenis</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><code>insteek</code></td><td>Insteek van de watergang (begin- of eindpunt van het profiel).</td></tr>
                                <tr><td><code>vast</code></td><td>Vaste bodem; onderdeel van de bodemdiepte (rode lijn).</td></tr>
                                <tr><td><code>bagger</code></td><td>Bovenkant baggerlaag; onderdeel van de baggerhoogte (groene lijn).</td></tr>
                                <tr><td><code>baggervasteb</code></td><td>Punt waar bagger en vaste bodem samenvallen (rand van het baggervak).</td></tr>
                            </tbody>
                        </table>

                        <p class="toggle" data-toggle-target="request_json" role="button">
                            Voorbeeld request body (JSON) <i class="fa-solid fa-arrow-right toggle-icon"></i>
                        </p>
                        <div class="code-block collapsed" id="request_json">
                            <i class="fa-solid fa-copy copy-btn" data-copy-target="request_json_code" role="button" title="Kopiëren"></i>
<pre><code class="language-json" id="request_json_code">{
    "profielen": [
        {
            "profielcode": "30_12_B",
            "project": "BARE2621",
            "opdrachtgever": "Gemeente Barendrecht",
            "omschrijving": "Baggeren Begraafplaats Ouden Dyck",
            "baggercode": "-",
            "legger": "-",
            "polderpeil": "-",
            "waterpeil": "-",
            "dynamic_fields": [
                {
                    "inpeildatum": "-",
                    "Bagger m3 / strekkende meter": "0.07"
                }
            ],
            "punten": [
                {"puntnr": 1, "afstand": 0, "puntsoort": "insteek", "meting": -1.63},
                {"puntnr": 2, "afstand": 0.17, "puntsoort": "baggervasteb", "meting": -2.05},
                {"puntnr": 3, "afstand": 0.49, "puntsoort": "baggervasteb", "meting": -2.36},
                {"puntnr": 4, "afstand": 0.9, "puntsoort": "baggervasteb", "meting": -2.45},
                {"puntnr": 5, "afstand": 1.39, "puntsoort": "baggervasteb", "meting": -2.59},
                {"puntnr": 6, "afstand": 1.9, "puntsoort": "baggervasteb", "meting": -2.76},
                {"puntnr": 7, "afstand": 2.44, "puntsoort": "vast", "meting": -2.95},
                {"puntnr": 8, "afstand": 2.44, "puntsoort": "bagger", "meting": -2.88},
                {"puntnr": 9, "afstand": 2.87, "puntsoort": "vast", "meting": -2.95},
                {"puntnr": 10, "afstand": 2.87, "puntsoort": "bagger", "meting": -2.88},
                {"puntnr": 11, "afstand": 3.4, "puntsoort": "baggervasteb", "meting": -2.74},
                {"puntnr": 12, "afstand": 3.88, "puntsoort": "baggervasteb", "meting": -2.59},
                {"puntnr": 13, "afstand": 4.33, "puntsoort": "baggervasteb", "meting": -2.46},
                {"puntnr": 14, "afstand": 4.83, "puntsoort": "baggervasteb", "meting": -2.33},
                {"puntnr": 15, "afstand": 5.44, "puntsoort": "baggervasteb", "meting": -2.24},
                {"puntnr": 16, "afstand": 5.98, "puntsoort": "baggervasteb", "meting": -2.05},
                {"puntnr": 17, "afstand": 8.08, "puntsoort": "insteek", "meting": -1.24}
            ]
        }
    ]
}</code></pre>
                        </div>

                        <h5>Response</h5>
                        <p>Bij succes ontvang je statuscode <strong>200</strong> met daarin de downloadlink naar het zip-bestand. Gebruik <code>download_url</code> om de profielplaatjes op te halen (zie <a href="#profielplaatjes-download">Downloaden</a>).</p>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Veld</th><th>Type</th><th>Omschrijving</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><code>status</code></td><td>string</td><td>Altijd <code>success</code> bij een geslaagd request.</td></tr>
                                <tr><td><code>message</code></td><td>string</td><td>Leesbare melding met het aantal gegenereerde profielplaatjes.</td></tr>
                                <tr><td><code>count</code></td><td>integer</td><td>Aantal gegenereerde profielplaatjes.</td></tr>
                                <tr><td><code>zipfile</code></td><td>string</td><td>Bestandsnaam van het zip-bestand.</td></tr>
                                <tr><td><code>download_url</code></td><td>string</td><td>Volledige URL waarmee het zip-bestand gedownload kan worden.</td></tr>
                                <tr><td><code>generated_at</code></td><td>string</td><td>Tijdstip van genereren (ISO 8601).</td></tr>
                            </tbody>
                        </table>

                        <p class="toggle" data-toggle-target="response_json" role="button">
                            Voorbeeld response code 200 (JSON) <i class="fa-solid fa-arrow-right toggle-icon"></i>
                        </p>
                        <div class="code-block collapsed" id="response_json">
<pre><code class="language-json">{
    "status": "success",
    "message": "1 profielplaatje(s) gegenereerd.",
    "count": 1,
    "zipfile": "profielplaatjes_20261001_101500_AbC123.zip",
    "download_url": "https://gisdev.gkbgroep.nl/api/profielplaatjes/download/profielplaatjes_20261001_101500_AbC123.zip",
    "generated_at": "2026-10-01T10:15:00+02:00"
}</code></pre>
                        </div>
                    </div>

                    {{-- Profielplaatjes downloaden --}}
                    <div class="doc-section" id="content-profielplaatjes-download">
                        <h3>Downloaden van profielplaatjes</h3>
                        <p class="endpoint">
                            <span class="method method-get">GET</span>
                            <strong id="api_url_download">https://gisdev.gkbgroep.nl/api/profielplaatjes/download/{bestandsnaam}</strong>
                            <i class="fa-solid fa-copy copy-btn" data-copy-target="api_url_download" role="button" title="Kopiëren"></i>
                        </p>
                        <p>Met dit endpoint download je een eerder gegenereerd zip-bestand met profielplaatjes. In de praktijk gebruik je hiervoor direct de <code>download_url</code> uit de response van het <a href="#profielplaatjes">genereren</a>-endpoint.</p>

                        <h5>Parameters</h5>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Parameter</th><th>Type</th><th>Omschrijving</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><code>bestandsnaam</code></td><td>string</td><td>De waarde van <code>zipfile</code> uit de generate-response. Alleen letters, cijfers, punten, underscores en streepjes zijn toegestaan.</td></tr>
                            </tbody>
                        </table>

                        <h5>Response</h5>
                        <ul>
                            <li><strong>200</strong>: het zip-bestand (<code>application/zip</code>). Elk profiel zit hierin als losse PDF met de naam <code>profiel-{profielcode}.pdf</code>.</li>
                            <li><strong>404</strong>: het bestand bestaat niet (meer).</li>
                        </ul>

                        <p class="toggle" data-toggle-target="download_404_json" role="button">
                            Voorbeeld response code 404 (JSON) <i class="fa-solid fa-arrow-right toggle-icon"></i>
                        </p>
                        <div class="code-block collapsed" id="download_404_json">
<pre><code class="language-json">{
    "status": "error",
    "message": "Bestand niet gevonden."
}</code></pre>
                        </div>
                    </div>

                    {{-- Foutmeldingen --}}
                    <div class="doc-section" id="content-foutmeldingen">
                        <h3>Foutmeldingen</h3>
                        <p>Wanneer een request niet slaagt, geeft de API een foutcode terug met een JSON-body waarin de oorzaak staat beschreven.</p>
                        <table class="doc-table">
                            <thead>
                                <tr><th>Code</th><th>Betekenis</th><th>Oplossing</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><strong>404</strong></td><td>Het opgevraagde bestand bestaat niet.</td><td>Controleer de bestandsnaam of genereer de profielplaatjes opnieuw.</td></tr>
                                <tr><td><strong>422</strong></td><td>De request body is ongeldig (validatiefout).</td><td>Controleer de velden in <code>errors</code>; bijvoorbeeld een ontbrekende <code>profielcode</code> of meer dan 250 profielen.</td></tr>
                                <tr><td><strong>500</strong></td><td>Er is iets misgegaan op de server tijdens het genereren.</td><td>Probeer het later opnieuw. Blijft het probleem bestaan, neem dan contact op met de GIS-afdeling.</td></tr>
                            </tbody>
                        </table>

                        <p class="toggle" data-toggle-target="error_422_json" role="button">
                            Voorbeeld response code 422 (JSON) <i class="fa-solid fa-arrow-right toggle-icon"></i>
                        </p>
                        <div class="code-block collapsed" id="error_422_json">
<pre><code class="language-json">{
    "message": "Maximaal 250 profielen per aanvraag. Splits de aanvraag op in kleinere delen (chunking).",
    "errors": {
        "profielen": [
            "Maximaal 250 profielen per aanvraag. Splits de aanvraag op in kleinere delen (chunking)."
        ]
    }
}</code></pre>
                        </div>

                        <p class="toggle" data-toggle-target="error_500_json" role="button">
                            Voorbeeld response code 500 (JSON) <i class="fa-solid fa-arrow-right toggle-icon"></i>
                        </p>
                        <div class="code-block collapsed" id="error_500_json">
<pre><code class="language-json">{
    "status": "error",
    "message": "Genereren van de profielplaatjes is mislukt."
}</code></pre>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    </section>

    <section class="footer">
        <div class="container border-left">
            <div class="row">
                <div class="col-lg-12 text-center">
                    <div class="footer-wrapper">
                        <p>&copy; {{ date('Y') }} QuickManage. Alle rechten voorbehouden.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <script src="{{ asset('js/documentation/main.js') }}"></script>
</body>
</html>
