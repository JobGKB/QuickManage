<?php

namespace Tests\Feature;

use App\Models\DocSubject;
use App\Models\DocSubjectContent;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DocumentationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The in-memory database starts empty for every test. Only the tables this feature
        // needs are migrated: the full migration set contains MySQL-only statements.
        Artisan::call('migrate', ['--path' => [
            'database/migrations/0001_01_01_000000_create_users_table.php',
            'database/migrations/2025_01_01_000000_add_uniqid_and_image_to_users_table.php',
            'database/migrations/2026_11_18_000000_create_doc_subjects_table.php',
            'database/migrations/2026_11_18_000001_create_doc_subjects_content_table.php',
            'database/migrations/2026_11_18_000002_import_existing_documentation.php',
        ]]);
    }

    public function test_documentation_is_only_available_to_quickmanage_accounts(): void
    {
        $subject = DocSubject::create(['name' => 'Afgeschermd']);

        $this->get('/docs')->assertRedirect('/login');
        $this->get('/manage/documentation')->assertRedirect('/login');
        $this->post('/manage/documentation/subject/store', ['name' => 'Gast'])->assertRedirect('/login');
        $this->delete('/manage/documentation/subject/delete/'.$subject->uniqid)->assertRedirect('/login');

        // A Microsoft SSO session is enough for the app gallery, but not for the documentation.
        $this->withSession(['azure.user' => ['email' => 'iemand@gkbgroep.nl', 'name' => 'Iemand']])
            ->get('/docs')
            ->assertRedirect('/login');

        $this->assertDatabaseMissing('doc_subjects', ['name' => 'Gast']);
        $this->assertDatabaseHas('doc_subjects', ['name' => 'Afgeschermd']);
    }

    public function test_imported_documentation_is_shown_with_a_content_security_policy(): void
    {
        $response = $this->actingAs(User::factory()->create())->get('/docs');

        $response->assertOk()
            ->assertSee('Profielplaatjes')
            ->assertSee('<a href="#profielplaatjes-download">Downloaden</a>', false)
            ->assertSee('<span class="method method-post">POST</span>', false)
            ->assertSee('id="content-foutmeldingen"', false);

        $this->assertSame("script-src 'self'", collect(explode('; ', $response->headers->get('Content-Security-Policy')))->first(fn ($directive) => str_starts_with($directive, 'script-src')));
    }

    public function test_admin_manages_subjects_and_content(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/manage/documentation/subject/store', ['name' => 'Koppelingen', 'sort_order' => 30])
            ->assertRedirect('/manage/documentation');
        $subject = DocSubject::where('name', 'Koppelingen')->firstOrFail();

        // The same title twice: anchors stay unique.
        foreach ([1, 2] as $attempt) {
            $this->post('/manage/documentation/content/store/'.$subject->uniqid, ['title' => 'FME Flow', 'content' => '<p>Tekst</p>'])
                ->assertRedirect('/manage/documentation');
        }
        $this->assertSame(['fme-flow', 'fme-flow-2'], $subject->contents()->pluck('slug')->all());

        $content = $subject->contents()->firstOrFail();
        $other = DocSubject::create(['name' => 'Overig']);

        // Leaving the anchor empty keeps the existing one; the content can move to another subject.
        $this->patch('/manage/documentation/content/update/'.$content->uniqid, [
            'title' => 'FME Flow koppeling',
            'subject' => $other->uniqid,
            'slug' => '',
            'content' => '<h4>Nieuw</h4>',
        ])->assertSessionHasNoErrors();

        $content->refresh();
        $this->assertSame(['FME Flow koppeling', 'fme-flow', $other->id], [$content->title, $content->slug, $content->doc_subject_id]);

        $this->patch('/manage/documentation/content/update/'.$content->uniqid, [
            'title' => 'FME Flow koppeling',
            'subject' => $other->uniqid,
            'slug' => 'fme-flow-2',
        ])->assertSessionHasErrors('slug');

        $this->get('/manage/documentation')->assertOk()->assertSee('FME Flow koppeling');
        $this->get('/manage/documentation/content/edit/'.$content->uniqid)->assertOk()->assertSee('&lt;h4&gt;Nieuw&lt;/h4&gt;', false);

        $this->delete('/manage/documentation/subject/delete/'.$other->uniqid)->assertRedirect('/manage/documentation');
        $this->assertDatabaseMissing('doc_subjects', ['id' => $other->id]);
        $this->assertDatabaseMissing('doc_subjects_content', ['id' => $content->id]);

        $remaining = $subject->contents()->firstOrFail();
        $this->delete('/manage/documentation/content/delete/'.$remaining->uniqid)->assertRedirect('/manage/documentation');
        $this->assertDatabaseMissing('doc_subjects_content', ['id' => $remaining->id]);
    }

    public function test_content_is_sanitized_when_saved_and_again_when_shown(): void
    {
        $this->actingAs(User::factory()->create());
        $subject = DocSubject::create(['name' => 'Veiligheid']);

        $this->post('/manage/documentation/content/store/'.$subject->uniqid, [
            'title' => 'Aanval',
            'content' => '<p onclick="steal()" style="position:fixed" class="endpoint fixed-top">Zichtbaar</p>'
                .'<script>alert(1)</script><img src="x" onerror="alert(1)"><iframe src="https://evil.example"></iframe>'
                .'<a href="javascript:alert(1)">klik</a> <a href="#introductie">intern</a><p><br></p>',
        ])->assertRedirect('/manage/documentation');

        $content = DocSubjectContent::where('slug', 'aanval')->firstOrFail();

        $this->assertSame(
            '<p class="endpoint">Zichtbaar</p><a rel="noopener noreferrer">klik</a> <a href="#introductie" rel="noopener noreferrer">intern</a>',
            $content->content
        );

        // A row changed outside the application is still cleaned before it reaches the page.
        DB::table('doc_subjects_content')->where('id', $content->id)->update([
            'content' => '<p>Rechtstreeks</p><script>alert("db")</script><p onmouseover="x()">Tweede</p>',
        ]);

        $this->get('/docs')
            ->assertOk()
            ->assertSee('<p>Rechtstreeks</p><p>Tweede</p>', false)
            ->assertDontSee('alert(', false)
            ->assertDontSee('onmouseover', false);
    }

    public function test_invalid_input_is_rejected(): void
    {
        $this->actingAs(User::factory()->create());
        $subject = DocSubject::create(['name' => 'Bestaand']);

        $this->post('/manage/documentation/subject/store', ['name' => 'Bestaand'])->assertSessionHasErrors('name');
        $this->post('/manage/documentation/content/store/'.$subject->uniqid, ['title' => 'Ok', 'slug' => 'Geen Geldig Anker!'])
            ->assertSessionHasErrors('slug');
        $this->post('/manage/documentation/content/store/'.$subject->uniqid, ['title' => ''])->assertSessionHasErrors('title');
        $this->get('/manage/documentation/content/edit/geen-uuid')->assertNotFound();
    }
}
