<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfielplaatjeController extends Controller
{
    public function index()
    {
        // Voorbeeldprofielen op basis van de aangeleverde rapportage.
        // Deze structuur kan later gevuld worden vanuit FME / database.
        $profielen = [
            [
                'nummer'           => '0003',
                'datum'            => '03-04-2025',
                'project'          => 'WSHD23012 - Baggeren',
                'opdrachtgever'    => 'WSHD',
                'baggervak'        => '132',
                'watergang'        => 'T33097',
                'uitpeildatum'     => '',
                'legger'           => -2.03,
                'polderpeil'       => -1.9,
                'waterpeil'        => -1.85,
                'punten'           => [
                    ['puntnr' => 1, 'afstand' => 0.00, 'puntsoort' => 'insteek',               'meting' => -1.12],
                    ['puntnr' => 2, 'afstand' => 1.67, 'puntsoort' => 'bagger_en_vastebodem',  'meting' => -2.35],
                    ['puntnr' => 3, 'afstand' => 2.88, 'puntsoort' => 'vaste bodem',           'meting' => -2.74],
                    ['puntnr' => 4, 'afstand' => 3.84, 'puntsoort' => 'vaste bodem',           'meting' => -2.38],
                    ['puntnr' => 5, 'afstand' => 4.06, 'puntsoort' => 'bagger_en_vastebodem',  'meting' => -2.02],
                    ['puntnr' => 6, 'afstand' => 4.57, 'puntsoort' => 'insteek',               'meting' => -1.29],
                ],
            ],
            [
                'nummer'           => '0007',
                'datum'            => '03-04-2025',
                'project'          => 'WSHD23012 - Baggeren',
                'opdrachtgever'    => 'WSHD',
                'baggervak'        => '132',
                'watergang'        => 'T33098',
                'uitpeildatum'     => '',
                'legger'           => -2.15,
                'polderpeil'       => -1.95,
                'waterpeil'        => -1.88,
                'punten'           => [
                    ['puntnr' => 1, 'afstand' => 0.00, 'puntsoort' => 'insteek',               'meting' => -1.05],
                    ['puntnr' => 2, 'afstand' => 1.20, 'puntsoort' => 'bagger_en_vastebodem',  'meting' => -2.10],
                    ['puntnr' => 3, 'afstand' => 2.35, 'puntsoort' => 'vaste bodem',           'meting' => -2.62],
                    ['puntnr' => 4, 'afstand' => 3.10, 'puntsoort' => 'vaste bodem',           'meting' => -2.88],
                    ['puntnr' => 5, 'afstand' => 4.15, 'puntsoort' => 'bagger_en_vastebodem',  'meting' => -2.25],
                    ['puntnr' => 6, 'afstand' => 5.02, 'puntsoort' => 'insteek',               'meting' => -1.18],
                ],
            ],
            [
                'nummer'           => '0012',
                'datum'            => '04-04-2025',
                'project'          => 'WSHD23012 - Baggeren',
                'opdrachtgever'    => 'WSHD',
                'baggervak'        => '133',
                'watergang'        => 'T33101',
                'uitpeildatum'     => '',
                'legger'           => -1.90,
                'polderpeil'       => -1.75,
                'waterpeil'        => -1.70,
                'punten'           => [
                    ['puntnr' => 1, 'afstand' => 0.00, 'puntsoort' => 'insteek',               'meting' => -0.95],
                    ['puntnr' => 2, 'afstand' => 0.85, 'puntsoort' => 'bagger_en_vastebodem',  'meting' => -1.80],
                    ['puntnr' => 3, 'afstand' => 1.95, 'puntsoort' => 'vaste bodem',           'meting' => -2.20],
                    ['puntnr' => 4, 'afstand' => 2.60, 'puntsoort' => 'vaste bodem',           'meting' => -2.05],
                    ['puntnr' => 5, 'afstand' => 3.30, 'puntsoort' => 'bagger_en_vastebodem',  'meting' => -1.72],
                    ['puntnr' => 6, 'afstand' => 3.95, 'puntsoort' => 'insteek',               'meting' => -1.02],
                ],
            ],
        ];

        return view('profielplaatje.index', [
            'profielen' => $profielen,
        ]);
    }
}
