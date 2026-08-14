<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GIS Assistent — chat endpoint for the crow assistant in the GIS Portaal.
 *
 * Uses Claude (Anthropic) with the native remote MCP connector. Claude may
 * ONLY answer by calling the tools exposed by the FME MCP server; if no tool
 * fits the question it must say so. All secrets stay server-side.
 */
class GISAssistentController extends Controller
{
    public function chat(Request $request)
    {
        $question = trim((string) $request->input('message', ''));
        abort_unless($question !== '', 422, 'Bericht ontbreekt.');

        $apiKey = config('services.claude.key');
        abort_unless(is_string($apiKey) && $apiKey !== '', 500, 'Claude API key ontbreekt.');

        $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'anthropic-beta'    => 'mcp-client-2025-04-04',
            ])
            ->withOptions(['verify' => app()->isProduction()]) // skip SSL verify in local dev only
            ->timeout(120) // FME workspaces can take a few seconds to run
            ->post('https://api.anthropic.com/v1/messages', [
                'model'      => config('services.claude.model'),
                'max_tokens' => 1024,
                'system'     => $this->systemPrompt(),
                'messages'   => [
                    ['role' => 'user', 'content' => $question],
                ],
                'mcp_servers' => [
                    [
                        'type' => 'url',
                        'url'  => config('services.fme_mcp.url'),
                        'name' => 'OpenDataInfo',
                    ],
                ],
            ]);

        if (!$response->ok()) {
            Log::error('GIS Assistent: Claude API error', ['body' => $response->body()]);
            abort(502, 'De AI-service is momenteel niet bereikbaar.');
        }

        // The final answer is the concatenation of Claude's text blocks.
        $reply = collect($response->json('content', []))
            ->where('type', 'text')
            ->pluck('text')
            ->implode('');

        $reply = trim($reply);

        if ($reply === '') {
            $reply = 'Ik kon deze vraag niet beantwoorden.';
        }

        return response()->json(['reply' => $reply]);
    }

    private function systemPrompt(): string
    {
        return <<<SYS
        Je bent de GIS Assistent. Spreek de gebruiker in het Nederlands aan.

        REGELS (STRICT):
        - Je mag vragen UITSLUITEND beantwoorden met behulp van de aangeboden MCP-tools.
        - Kies zelf welke tool past bij de vraag en roep die aan.
        - Gebruik GEEN kennis buiten de tools om en verzin geen antwoorden.
        - Kan geen enkele tool de vraag beantwoorden? Antwoord dan letterlijk:
          "Sorry, ik kan deze vraag niet beantwoorden, omdat ik hiervoor geen geschikte tool heb."

        ANTWOORDOPMAAK (Markdown):
        De weergave ondersteunt: koppen (#), vet (**...**), cursief (*...*),
        inline code (`...`) en opsommingen met streepjes (-) of nummers (1.).
        Gebruik GEEN tabellen, GEEN geneste opsommingen en GEEN links.

        Structureer je antwoord altijd zo:
        1. Eén korte introzin die zegt waar het antwoord over gaat (noem plaats/onderwerp).
        2. Een kopregel met '#', bijvoorbeeld: # Weer in Tholen
        3. Een opsomming met streepjes (-), waarbij je het label van elk punt vet zet
           gevolgd door een dubbele punt, bijvoorbeeld: - **Temperatuur:** 21 °C.
        4. Optioneel één korte slotzin met een tip of samenvatting.

        STIJL:
        - Houd het kort, feitelijk en overzichtelijk; geen herhaling.
        - Zet elk onderdeel op een eigen regel.
        - Vermeld eenheden (bijv. °C, %, m/s, km).
        - Gebruik hooguit één emoji per regel en alleen als het iets toevoegt.
        - Neem alleen gegevens over die daadwerkelijk uit de tool komen.
        SYS;
    }
}
