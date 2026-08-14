<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Genereert profielplaatje-PDF's (grafiek als inline SVG + tabel) server-side.
 */
class ProfielPlaatjeService
{
    /** Afmetingen van de SVG-grafiek (px). */
    private const W = 760;
    private const H = 420;
    private const M_LEFT = 60;
    private const M_RIGHT = 20;
    private const M_TOP = 40;
    private const M_BOTTOM = 80;

    /**
     * Rendert één profiel naar PDF-binary (A4 liggend).
     */
    public function renderPdf(array $profiel): string
    {
        $svg = $this->buildSvg($profiel);

        return Pdf::loadView('profielplaatje.pdf', [
            'profiel'  => $profiel,
            'chartSvg' => $svg,
        ])->setPaper('a4', 'landscape')->output();
    }

    /**
     * Bouwt de grafiek als SVG-string (bodemdiepte + referentielijnen).
     */
    public function buildSvg(array $profiel): string
    {
        $punten = $profiel['punten'] ?? [];
        $afstanden = array_map(fn ($p) => (float) $p['afstand'], $punten);
        $metingen = array_map(fn ($p) => (float) $p['meting'], $punten);

        $refs = [
            (float) ($profiel['polderpeil'] ?? 0),
            (float) ($profiel['waterpeil'] ?? 0),
            (float) ($profiel['legger'] ?? 0),
        ];

        $xMin = $afstanden ? min($afstanden) : 0;
        $xMax = $afstanden ? max($afstanden) : 1;
        if ($xMax == $xMin) {
            $xMax = $xMin + 1;
        }

        $yValues = array_merge($metingen, $refs);
        $yMin = $yValues ? min($yValues) : -1;
        $yMax = $yValues ? max($yValues) : 0;
        $pad = ($yMax - $yMin) * 0.1 ?: 0.5;
        $yMin -= $pad;
        $yMax += $pad;

        $plotW = self::W - self::M_LEFT - self::M_RIGHT;
        $plotH = self::H - self::M_TOP - self::M_BOTTOM;

        $px = fn ($x) => self::M_LEFT + ($x - $xMin) / ($xMax - $xMin) * $plotW;
        $py = fn ($y) => self::M_TOP + ($yMax - $y) / ($yMax - $yMin) * $plotH;

        $svg = [];
        $svg[] = sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" font-family="Helvetica, Arial, sans-serif">',
            self::W,
            self::H,
            self::W,
            self::H
        );
        $svg[] = sprintf('<rect x="0" y="0" width="%d" height="%d" fill="#ffffff"/>', self::W, self::H);

        // Titel (profielnummer).
        $svg[] = sprintf(
            '<text x="%.1f" y="24" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">%s</text>',
            self::M_LEFT + $plotW / 2,
            e($profiel['profielcode'] ?? '')
        );

        // Plotkader.
        $svg[] = sprintf(
            '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" stroke="#cccccc"/>',
            self::M_LEFT,
            self::M_TOP,
            $plotW,
            $plotH
        );

        // Y-as ticks + horizontale gridlijnen.
        $yTicks = 5;
        for ($i = 0; $i <= $yTicks; $i++) {
            $val = $yMax - ($yMax - $yMin) * $i / $yTicks;
            $y = $py($val);
            $svg[] = sprintf(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#eeeeee"/>',
                self::M_LEFT,
                $y,
                self::M_LEFT + $plotW,
                $y
            );
            $svg[] = sprintf(
                '<text x="%.1f" y="%.1f" text-anchor="end" font-size="9" fill="#333">%.2f</text>',
                self::M_LEFT - 6,
                $y + 3,
                $val
            );
        }

        // X-as ticks + labels op elke afstand.
        foreach ($afstanden as $x) {
            $xp = $px($x);
            $svg[] = sprintf(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#eeeeee"/>',
                $xp,
                self::M_TOP,
                $xp,
                self::M_TOP + $plotH
            );
            $svg[] = sprintf(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#333"/>',
                $xp,
                self::M_TOP + $plotH,
                $xp,
                self::M_TOP + $plotH + 4
            );
            $svg[] = sprintf(
                '<text x="%.1f" y="%.1f" text-anchor="middle" font-size="8" fill="#333">%s</text>',
                $xp,
                self::M_TOP + $plotH + 14,
                number_format($x, 2, '.', '')
            );
        }

        // Astitels.
        $svg[] = sprintf(
            '<text x="%.1f" y="%.1f" text-anchor="middle" font-size="10" fill="#333">Afstand (m1)</text>',
            self::M_LEFT + $plotW / 2,
            self::M_TOP + $plotH + 34
        );
        $svg[] = sprintf(
            '<text x="16" y="%.1f" text-anchor="middle" font-size="10" fill="#333" transform="rotate(-90 16 %.1f)">Hoogte (NAP m1)</text>',
            self::M_TOP + $plotH / 2,
            self::M_TOP + $plotH / 2
        );

        // Horizontale referentielijnen.
        $refLijnen = [
            ['waarde' => (float) ($profiel['polderpeil'] ?? 0), 'kleur' => '#0000cc'],
            ['waarde' => (float) ($profiel['waterpeil'] ?? 0),  'kleur' => '#00c0e0'],
            ['waarde' => (float) ($profiel['legger'] ?? 0),     'kleur' => '#f0a020'],
        ];
        foreach ($refLijnen as $lijn) {
            $y = $py($lijn['waarde']);
            $svg[] = sprintf(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="2"/>',
                self::M_LEFT,
                $y,
                self::M_LEFT + $plotW,
                $y,
                $lijn['kleur']
            );
        }

        // Punt-classificatie.
        $soort = fn ($p) => strtolower(trim($p['puntsoort'] ?? ''));
        $isBagger = fn ($p) => $soort($p) === 'bagger';
        $isBaggervast = fn ($p) => in_array($soort($p), ['baggervasteb', 'bagger_en_vastebodem'], true);

        // Bodemdiepte (rood): doorlopende lijn langs de bodem; bagger-punten worden overgeslagen.
        $bodemPunten = array_values(array_filter($punten, fn ($p) => ! $isBagger($p)));
        $svg[] = $this->polyline($bodemPunten, 'meting', $px, $py, '#e60000');

        // Baggerhoogte (groen): doorlopende lijn langs de bagger-punten, aan beide zijden
        // verbonden met het dichtstbijzijnde baggervasteb-punt (rand van het baggervak).
        $baggerIdx = array_keys(array_filter($punten, $isBagger));
        if ($baggerIdx) {
            $eerste = $baggerIdx[0];
            $laatste = end($baggerIdx);

            // Randpunt vóór het eerste bagger-punt.
            $startAnchor = null;
            for ($j = $eerste - 1; $j >= 0; $j--) {
                if ($isBaggervast($punten[$j])) {
                    $startAnchor = $punten[$j];
                    break;
                }
            }
            // Randpunt ná het laatste bagger-punt.
            $eindAnchor = null;
            for ($j = $laatste + 1, $n = count($punten); $j < $n; $j++) {
                if ($isBaggervast($punten[$j])) {
                    $eindAnchor = $punten[$j];
                    break;
                }
            }

            $groenPunten = [];
            if ($startAnchor !== null) {
                $groenPunten[] = $startAnchor;
            }
            foreach ($baggerIdx as $k) {
                $groenPunten[] = $punten[$k];
            }
            if ($eindAnchor !== null) {
                $groenPunten[] = $eindAnchor;
            }

            if (count($groenPunten) > 1) {
                $svg[] = $this->polyline($groenPunten, 'meting', $px, $py, '#2e8b2e');
            }
        }

        // Puntmarkeringen: bagger groen, overige bodem rood.
        foreach ($punten as $p) {
            $kleur = $isBagger($p) ? '#2e8b2e' : '#e60000';
            $svg[] = sprintf(
                '<circle cx="%.1f" cy="%.1f" r="2.5" fill="%s"/>',
                $px((float) $p['afstand']),
                $py((float) $p['meting']),
                $kleur
            );
        }

        // Legenda onderaan.
        $legenda = [
            ['label' => 'Baggerhoogte', 'kleur' => '#2e8b2e'],
            ['label' => 'Bodemdiepte',  'kleur' => '#e60000'],
            ['label' => 'Polderpeil',   'kleur' => '#0000cc'],
            ['label' => 'Waterlijn',    'kleur' => '#00c0e0'],
            ['label' => 'Legger',       'kleur' => '#f0a020'],
        ];
        $lx = self::M_LEFT;
        $ly = self::H - 12;
        foreach ($legenda as $item) {
            $svg[] = sprintf(
                '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="3"/>',
                $lx,
                $ly - 3,
                $lx + 18,
                $ly - 3,
                $item['kleur']
            );
            $svg[] = sprintf(
                '<text x="%.1f" y="%.1f" font-size="9" fill="#333">%s</text>',
                $lx + 22,
                $ly,
                $item['label']
            );
            $lx += 110;
        }

        $svg[] = '</svg>';

        return implode('', $svg);
    }

    /**
     * Bouwt een SVG-polyline uit punten voor het gegeven y-veld.
     */
    private function polyline(array $punten, string $yVeld, callable $px, callable $py, string $kleur): string
    {
        $points = [];
        foreach ($punten as $p) {
            $points[] = sprintf('%.1f,%.1f', $px((float) $p['afstand']), $py((float) $p[$yVeld]));
        }

        return sprintf(
            '<polyline points="%s" fill="none" stroke="%s" stroke-width="2"/>',
            implode(' ', $points),
            $kleur
        );
    }
}
