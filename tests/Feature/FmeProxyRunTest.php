<?php

namespace Tests\Feature;

use App\Models\App;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FmeProxyRunTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Only the apps table is needed: the full migration set contains MySQL-only statements.
        Artisan::call('migrate', ['--path' => [
            'database/migrations/2025_01_01_000005_create_apps_table.php',
        ]]);

        config(['services.fme.base_url' => 'https://fme.test']);
        $this->withoutMiddleware();

        $app = new App();
        $app->forceFill([
            'name'       => 'Streaming app',
            'repository' => 'Repo',
            'workspace'  => 'report',
            'service'    => 'fmedatastreaming',
            'hash_id'    => 'abc123',
            'wsp_token'  => Crypt::encryptString('secret-token'),
        ])->save();
    }

    public function test_streamed_html_is_passed_through_as_html(): void
    {
        Http::fake(['fme.test/*' => Http::response('<h1>Rapport</h1>', 200, ['Content-Type' => 'text/html'])]);

        $response = $this->post('/apps/abc123/fme/run', ['parameters' => ['A' => '1']]);

        $response->assertOk();
        $this->assertStringStartsWith('text/html', $response->headers->get('Content-Type'));
        $this->assertSame('<h1>Rapport</h1>', $response->streamedContent());
    }

    public function test_fme_error_is_returned_as_json_message(): void
    {
        Http::fake(['fme.test/*' => Http::response('<html><body>Translation failed</body></html>', 500, ['Content-Type' => 'text/html'])]);

        $this->post('/apps/abc123/fme/run')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'FME gaf een fout (status 500): Translation failed']);
    }

    public function test_single_file_upload_is_sent_as_multipart(): void
    {
        Http::fake(['fme.test/*' => Http::response('{}', 200, ['Content-Type' => 'application/json'])]);

        $this->post('/apps/abc123/fme/upload', [
            'files' => UploadedFile::fake()->create('data.xlsx', 10),
        ])->assertOk();

        Http::assertSent(fn (Request $request) => $request->isMultipart()
            && $request[0]['name'] === 'files'
            && $request[0]['filename'] === 'data.xlsx');
    }

    public function test_too_large_upload_returns_413_with_message(): void
    {
        $this->withMiddleware();

        $this->call('POST', '/apps/abc123/fme/upload', [], [], [], [
            'CONTENT_LENGTH' => PHP_INT_MAX,
            'HTTP_ACCEPT'    => 'application/json',
        ])
            ->assertStatus(413)
            ->assertExactJson(['message' => 'Het bestand is te groot om te uploaden (maximaal '.ini_get('post_max_size').').']);
    }

    public function test_timeout_returns_504_with_message(): void
    {
        Http::fake(['fme.test/*' => Http::failedConnection('cURL error 28: Operation timed out')]);

        $this->post('/apps/abc123/fme/run')
            ->assertStatus(504)
            ->assertJsonFragment(['message' => 'FME gaf geen antwoord binnen 180 seconden of is niet bereikbaar. Probeer het later opnieuw.']);
    }
}
