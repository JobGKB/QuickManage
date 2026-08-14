<!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Rapportage profielen</title>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

    <style>
        :root { --gkb-green: #439034; }

        * { box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 24px;
            background: #f2f2f2;
            color: #222;
        }

        .toolbar {
            max-width: 1100px;
            margin: 0 auto 16px;
            display: flex;
            justify-content: flex-end;
        }

        .btn-pdf {
            background: var(--gkb-green);
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 10px 18px;
            font-size: 14px;
            cursor: pointer;
            transition: opacity .2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-pdf:hover { opacity: .88; }
        .btn-pdf:disabled { opacity: .5; cursor: default; }

        /* A4-landscape verhouding voor het rapport */
        .report {
            max-width: 1100px;
            margin: 0 auto;
            background: #fff;
            padding: 10px 10px;
            border: 1px solid #000000;
        }

        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .report-date { font-size: 13px; color: #333; text-align: right; }
        .report-title { font-size: 30px; font-weight: 600; margin: 4px 0 20px; }
        .report-title .nr { color: var(--gkb-green); }

        .logo { text-align: right; line-height: 1; margin-top: 6px; }
        .logo .mark { font-size: 30px; font-weight: 800; color: var(--gkb-green); letter-spacing: 1px; }
        .logo .sub { font-size: 11px; color: var(--gkb-green); }

        .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 40px;
            margin-bottom: 24px;
            font-size: 13px;
        }
        .meta .row { display: grid; grid-template-columns: 210px 1fr; }
        .meta .label { font-weight: 700; }

        .meta-info {
            display: grid;
            grid-template-columns:   1fr;
            gap: 4px 20px;
            margin-bottom: 24px;
            font-size: 13px;
        }
        
        .meta-info .row { display: grid; grid-template-columns: 210px 1fr; }

        .meta-info .label { font-weight: 700; } 

        .border {
             border: 1px solid #000000; padding: 8px 12px;   
            }

        .content {
            display: flex;
            gap: 30px;
            align-items: start;
        }

        .chart-wrap { 
            position: relative; height: 520px;
             
        }

        table.points { width: 100%; border-collapse: collapse; font-size: 12px; }
        table.points th { text-align: left; border-bottom: 1px solid #333; padding: 4px 6px; }
        table.points td { padding: 3px 6px; }
        table.points td.meting { text-align: right; }

        .report-footer {
            margin-top: 28px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <label for="profielSelect" style="align-self:center; margin-right:8px; font-size:14px;">Profiel:</label>
        <select id="profielSelect" style="align-self:center; margin-right:12px; padding:8px; border-radius:4px; border:1px solid #ccc;"></select>
        <button id="downloadPdf" class="btn-pdf" type="button" style="margin-right:8px;">
            &#128190; Download PDF
        </button>
        <button id="exportAll" class="btn-pdf" type="button">
            &#128230; Exporteer alle (ZIP)
        </button>
    </div>

    <div class="report" id="report">

        <div class="report-header">
            <div>
                <div class="report-title"><strong>Profiel: <span class="nr" id="p-nummer"></span></strong></div>
            </div>

        </div>

        <div class="chart-wrap">
                <canvas id="profielChart"></canvas>
        </div>


        <div class="content">

                <table class="points">
                    <thead>
                        <tr>
                            <th>Puntnr</th>
                            <th>Puntsoort</th>
                            <th>Afstand</th>

                            <th style="text-align:right;">Meting</th>
                        </tr>
                    </thead>
                    <tbody id="p-tbody"></tbody>
                </table>


                <div class="meta-info ">
                <div class="row"><span class="label">Uitpeildatum:</span><span id="p-uitpeildatum"></span></div>
                    <div class="row"><span class="label">Legger:</span><span id="p-legger"></span></div>
                    <div class="row"><span class="label">Polderpeil (m&#185; NAP):</span><span id="p-polderpeil"></span></div>
                    <div class="row"><span class="label">Waterpeil gemeten (m&#185; NAP):</span><span id="p-waterpeil"></span></div>
                </div>

                <div class="meta-info">
                    <div class="border">
                        <div class="row">
                            <div class="report-date" id="p-datum"></div>
                                <div class="logo">
                                    <img src="{{ asset('storage/gkb-groen.png') }}" alt="GKB Logo" width="80" >
                                </div>
                        </div>

                        <div class="row"><span class="label">Project:</span><span id="p-project"></span></div>
                        <div class="row"><span class="label">Opdrachtgever:</span><span id="p-opdrachtgever"></span></div>
                        <div class="row"><span class="label">Baggervak:</span><span id="p-baggervak"></span></div>
                        <div class="row"><span class="label">Watergang:</span><span id="p-watergang"></span></div>
                    </div>

                </div>

        </div>

    </div>

    <script>
        const profielen = @json($profielen);
        let huidigeIndex = 0;

        // Getal netjes formatteren (bv. 0.00 -> "0", 1.670 -> "1.67").
        const fmtAfstand = (v) => Number(v).toFixed(2).replace(/\.?0+$/, '');

        // Witte achtergrond zodat de grafiek-afbeelding in de PDF niet transparant is.
        const whiteBackground = {
            id: 'whiteBackground',
            beforeDraw: (chart) => {
                const { ctx } = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            },
        };

        // Chart.js-configuratie voor één profiel.
        function chartConfig(profiel) {
            const afstanden = profiel.punten.map(p => p.afstand);
            const xMin = Math.min(...afstanden);
            const xMax = Math.max(...afstanden);
            const horizontaal = (waarde) => [{ x: xMin, y: waarde }, { x: xMax, y: waarde }];

            return {
                type: 'line',
                plugins: [whiteBackground],
                data: {
                    datasets: [
                        {
                            label: 'Baggerhoogte',
                            data: profiel.punten
                                .filter(p => p.baggerhoogte !== undefined && p.baggerhoogte !== null)
                                .map(p => ({ x: p.afstand, y: p.baggerhoogte })),
                            borderColor: '#2e8b2e',
                            backgroundColor: '#2e8b2e',
                            pointRadius: 3,
                            tension: 0,
                        },
                        {
                            label: 'Bodemdiepte',
                            data: profiel.punten.map(p => ({ x: p.afstand, y: p.meting })),
                            borderColor: '#e60000',
                            backgroundColor: '#e60000',
                            pointRadius: 3,
                            tension: 0,
                        },
                        {
                            label: 'Polderpeil',
                            data: horizontaal(profiel.polderpeil),
                            borderColor: '#0000cc',
                            pointRadius: 0,
                            borderWidth: 2,
                        },
                        {
                            label: 'Waterlijn',
                            data: horizontaal(profiel.waterpeil),
                            borderColor: '#00c0e0',
                            pointRadius: 0,
                            borderWidth: 2,
                        },
                        {
                            label: 'Legger',
                            data: horizontaal(profiel.legger),
                            borderColor: '#f0a020',
                            pointRadius: 0,
                            borderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        title: { display: true, text: profiel.nummer, font: { size: 18 } },
                        legend: { position: 'bottom', labels: { boxWidth: 24, usePointStyle: false } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} NAP m1 @ ${ctx.parsed.x} m1`,
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: { display: true, text: 'Afstand (m1)' },
                            min: xMin,
                            max: xMax,
                            afterBuildTicks: (axis) => {
                                axis.ticks = afstanden.map(v => ({ value: v }));
                            },
                            ticks: {
                                callback: (v) => Number(v).toFixed(2),
                                maxRotation: 90,
                                minRotation: 90,
                            },
                        },
                        y: {
                            title: { display: true, text: 'Hoogte (NAP m1)' },
                        },
                    },
                },
            };
        }

        let profielChart = new Chart(document.getElementById('profielChart'), chartConfig(profielen[0]));

        // Tabel en meta-informatie invullen voor het gekozen profiel.
        function renderTabelEnMeta(profiel) {
            const set = (id, waarde) => {
                document.getElementById(id).textContent = (waarde === null || waarde === undefined) ? '' : waarde;
            };
            set('p-nummer', profiel.nummer);
            set('p-uitpeildatum', profiel.uitpeildatum);
            set('p-legger', profiel.legger);
            set('p-polderpeil', profiel.polderpeil);
            set('p-waterpeil', profiel.waterpeil);
            set('p-datum', profiel.datum);
            set('p-project', profiel.project);
            set('p-opdrachtgever', profiel.opdrachtgever);
            set('p-baggervak', profiel.baggervak);
            set('p-watergang', profiel.watergang);

            const tbody = document.getElementById('p-tbody');
            tbody.innerHTML = '';
            profiel.punten.forEach((p) => {
                const tr = document.createElement('tr');
                [p.puntnr, p.puntsoort, fmtAfstand(p.afstand)].forEach((val) => {
                    const td = document.createElement('td');
                    td.textContent = val;
                    tr.appendChild(td);
                });
                const tdMeting = document.createElement('td');
                tdMeting.className = 'meting';
                tdMeting.textContent = p.meting;
                tr.appendChild(tdMeting);
                tbody.appendChild(tr);
            });
        }

        // Volledige weergave (grafiek + tabel + meta) voor een profielindex tonen.
        function toonProfiel(index) {
            huidigeIndex = index;
            const profiel = profielen[index];
            renderTabelEnMeta(profiel);
            profielChart.destroy();
            profielChart = new Chart(document.getElementById('profielChart'), chartConfig(profiel));
        }

        // PDF opbouwen met echte tekst (selecteerbaar) + de grafiek als afbeelding.
        function buildPdf(profiel, chartImg) {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const green = [67, 144, 52];

            // Titel: "Rapportage profiel <nr>" met groen nummer.
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            pdf.setTextColor(0, 0, 0);
            const titel = 'Rapportage profiel ';
            pdf.text(titel, 15, 20);
            pdf.setTextColor(...green);
            pdf.text(String(profiel.nummer), 15 + pdf.getTextWidth(titel), 20);
            pdf.setTextColor(0, 0, 0);

            // Datum rechtsboven.
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(String(profiel.datum || ''), 282, 12, { align: 'right' });

            // GKB-logo rechtsboven (indien geladen).
            const logo = document.querySelector('.logo img');
            if (logo && logo.complete && logo.naturalWidth) {
                const logoW = 24;
                const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
                try { pdf.addImage(logo, 'PNG', 282 - logoW, 15, logoW, logoH); } catch (e) { /* logo optioneel */ }
            }

            // Meta-informatie in twee kolommen.
            const linkerKolom = [
                ['Project:', profiel.project],
                ['Opdrachtgever:', profiel.opdrachtgever],
                ['Baggervak:', profiel.baggervak],
                ['Watergang:', profiel.watergang],
            ];
            const rechterKolom = [
                ['Uitpeildatum:', profiel.uitpeildatum],
                ['Legger:', profiel.legger],
                ['Polderpeil (m\u00B9 NAP):', profiel.polderpeil],
                ['Waterpeil gemeten (m\u00B9 NAP):', profiel.waterpeil],
            ];
            pdf.setFontSize(10);
            const metaTop = 34;
            const regelHoogte = 6;
            const tekenKolom = (rows, labelX, waardeX) => {
                rows.forEach(([label, waarde], i) => {
                    const y = metaTop + i * regelHoogte;
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(String(label), labelX, y);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(waarde === null || waarde === undefined ? '' : String(waarde), waardeX, y);
                });
            };
            tekenKolom(linkerKolom, 15, 45);
            tekenKolom(rechterKolom, 150, 205);

            // Grafiek als afbeelding (canvas kan niet als tekst).
            pdf.addImage(chartImg, 'PNG', 15, 64, 170, 120);

            // Puntentabel als echte tekst.
            const tblX = 192;
            const col = { nr: tblX, afstand: tblX + 16, soort: tblX + 36, meting: 285 };
            let y = 66;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.text('Puntnr', col.nr, y);
            pdf.text('Afstand', col.afstand, y);
            pdf.text('Puntsoort', col.soort, y);
            pdf.text('Meting', col.meting, y, { align: 'right' });
            pdf.setDrawColor(60, 60, 60);
            pdf.line(tblX, y + 1.5, 285, y + 1.5);

            pdf.setFont('helvetica', 'normal');
            y += 7;
            profiel.punten.forEach((p) => {
                pdf.text(String(p.puntnr), col.nr, y);
                pdf.text(fmtAfstand(p.afstand), col.afstand, y);
                pdf.text(String(p.puntsoort), col.soort, y);
                pdf.text(String(p.meting), col.meting, y, { align: 'right' });
                y += 6;
            });

            // Voettekst.
            pdf.setFontSize(9);
            pdf.setTextColor(90, 90, 90);
            pdf.text(`Rapportage profiel ${profiel.nummer}`, 15, 202);
            pdf.text('1/1', 282, 202, { align: 'right' });

            return pdf;
        }

        // Twee frames wachten zodat Chart.js de grafiek gegarandeerd getekend heeft.
        const wachtOpRender = () => new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        // Bestand downloaden vanuit een blob.
        function downloadBlob(blob, bestandsnaam) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = bestandsnaam;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }

        // Profielkeuze vullen en koppelen.
        const select = document.getElementById('profielSelect');
        profielen.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `Profiel ${p.nummer}`;
            select.appendChild(opt);
        });
        select.addEventListener('change', (e) => toonProfiel(Number(e.target.value)));

        // Huidige (eerste) profiel tonen.
        renderTabelEnMeta(profielen[0]);

        // PDF van het getoonde profiel downloaden.
        document.getElementById('downloadPdf').addEventListener('click', function () {
            const btn = this;
            btn.disabled = true;
            try {
                const profiel = profielen[huidigeIndex];
                const chartImg = profielChart.toBase64Image('image/png', 1);
                buildPdf(profiel, chartImg).save(`profiel-${profiel.nummer}.pdf`);
            } catch (err) {
                console.error(err);
                alert('Er ging iets mis bij het genereren van de PDF.');
            } finally {
                btn.disabled = false;
            }
        });

        // Alle profielen als ZIP exporteren (één PDF per profiel).
        document.getElementById('exportAll').addEventListener('click', async function () {
            const btn = this;
            btn.disabled = true;
            const origineleIndex = huidigeIndex;
            try {
                const zip = new JSZip();
                for (const profiel of profielen) {
                    // Grafiek van dit profiel renderen om een correcte afbeelding te krijgen.
                    profielChart.destroy();
                    profielChart = new Chart(document.getElementById('profielChart'), chartConfig(profiel));
                    await wachtOpRender();
                    const chartImg = profielChart.toBase64Image('image/png', 1);
                    const pdf = buildPdf(profiel, chartImg);
                    zip.file(`profiel-${profiel.nummer}.pdf`, pdf.output('blob'));
                }
                const blob = await zip.generateAsync({ type: 'blob' });
                downloadBlob(blob, 'profielplaatjes.zip');
            } catch (err) {
                console.error(err);
                alert('Er ging iets mis bij het exporteren van de ZIP.');
            } finally {
                // Weergave herstellen naar het oorspronkelijk gekozen profiel.
                toonProfiel(origineleIndex);
                select.value = origineleIndex;
                btn.disabled = false;
            }
        });
    </script>

    
</body>
</html>

{{-- //////////////////////////////////////////////////// --}}

{{-- //////////////////////////////////////////////////// --}}


{{-- //////////////////////////////////////////////////// --}}




{{-- //////////////////////////////////////////////////// --}}


{{-- //////////////////////////////////////////////////// --}}

{{-- //////////////////////////////////////////////////// --}}

{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}

{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}
{{-- //////////////////////////////////////////////////// --}}




<!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 1.2cm; }
        * { box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #222; font-size: 11px; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .title { font-size: 22px; font-weight: bold; }
        .title .nr { color: #439034; }
        .date { text-align: right; font-size: 10px; color: #333; }
        .logo { text-align: right; }

        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
        .meta-table td { padding: 2px 4px; vertical-align: top; }
        .meta-table .label { font-weight: bold; width: 130px; }

        .body-table { width: 100%; border-collapse: collapse; }
        .body-table > tbody > tr > td { vertical-align: top; }
        .chart-cell { width: 62%; }
        .points-cell { width: 38%; padding-left: 14px; }

        table.points { width: 100%; border-collapse: collapse; font-size: 10px; }
        table.points th { text-align: left; border-bottom: 1px solid #333; padding: 3px 4px; }
        table.points td { padding: 2px 4px; }
        table.points td.meting { text-align: right; }

        .footer { margin-top: 16px; padding-top: 6px; border-top: 1px solid #ddd; font-size: 9px; color: #666; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td.right { text-align: right; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('storage/gkb-groen.png');
        $fmtAfstand = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, '.', ''), '0'), '.');
    @endphp

    <table class="header-table">
        <tr>
            <td>
                <div class="title">Rapportage profiel <span class="nr">{{ $profiel['profielcode'] ?? '' }}</span></div>
            </td>
            <td style="width: 30%;">
                <div class="date">{{ $profiel['datum'] ?? '' }}</div>
                @if (is_file($logoPath))
                    <div class="logo"><img src="{{ $logoPath }}" alt="GKB" height="34"></div>
                @endif
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td class="label">Project:</td>
            <td>{{ $profiel['project'] ?? '' }}</td>
            <td class="label">Uitpeildatum:</td>
            <td>{{ $profiel['uitpeildatum'] ?? '' }}</td>
        </tr>
        <tr>
            <td class="label">Opdrachtgever:</td>
            <td>{{ $profiel['opdrachtgever'] ?? '' }}</td>
            <td class="label">Legger:</td>
            <td>{{ $profiel['legger'] ?? '' }}</td>
        </tr>
        <tr>
            <td class="label">Baggervak:</td>
            <td>{{ $profiel['baggervak'] ?? '' }}</td>
            <td class="label">Polderpeil (m&#185; NAP):</td>
            <td>{{ $profiel['polderpeil'] ?? '' }}</td>
        </tr>
        <tr>
            <td class="label">Watergang:</td>
            <td>{{ $profiel['watergang'] ?? '' }}</td>
            <td class="label">Waterpeil gemeten (m&#185; NAP):</td>
            <td>{{ $profiel['waterpeil'] ?? '' }}</td>
        </tr>
    </table>

    <table class="body-table">
        <tr>
            <td class="chart-cell">
                <img src="data:image/svg+xml;base64,{{ base64_encode($chartSvg) }}" style="width: 100%;" alt="Profielgrafiek">
            </td>
            <td class="points-cell">
                <table class="points">
                    <thead>
                        <tr>
                            <th>Puntnr</th>
                            <th>Puntsoort</th>
                            <th>Afstand</th>
                            <th style="text-align:right;">Meting</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($profiel['punten'] ?? [] as $punt)
                            <tr>
                                <td>{{ $punt['puntnr'] ?? '' }}</td>
                                <td>{{ $punt['puntsoort'] ?? '' }}</td>
                                <td>{{ $fmtAfstand($punt['afstand'] ?? 0) }}</td>
                                <td class="meting">{{ $punt['meting'] ?? '' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>Rapportage profiel {{ $profiel['nummer'] ?? '' }}</td>
                <td class="right">1/1</td>
            </tr>
        </table>
    </div>
</body>
</html>