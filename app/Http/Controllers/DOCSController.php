<?php

namespace App\Http\Controllers;

use App\Models\DocSubject;
use App\Models\DocSubjectContent;
use App\Support\DocHtml;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DOCSController extends Controller
{
    private const SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /**
     * The documentation page loads no inline scripts or styles and no third-party scripts, so a
     * strict policy can back up the HTML sanitizer: injected markup could not execute even if
     * it got through. Keep script-src at 'self'; a CDN host there would let any file on that
     * CDN run.
     */
    private const CONTENT_SECURITY_POLICY = "default-src 'self'; "
        ."script-src 'self'; "
        ."style-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.bunny.net; "
        ."font-src 'self' https://cdnjs.cloudflare.com https://fonts.bunny.net https://cdn.jsdelivr.net; "
        ."img-src 'self' data:; "
        ."object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

    // Documentation front page (/docs)
    public function index()
    {
        $subjects = DocSubject::with('contents')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->filter(fn (DocSubject $subject) => $subject->contents->isNotEmpty());

        return response()
            ->view('documentation.index', ['subjects' => $subjects])
            ->header('Content-Security-Policy', self::CONTENT_SECURITY_POLICY)
            ->header('X-Content-Type-Options', 'nosniff');
    }

    // CMS: overview of subjects and their content
    public function manage()
    {
        $subjects = DocSubject::with('contents')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return view('documentation.manage', ['subjects' => $subjects]);
    }

    public function createSubject()
    {
        return view('documentation.subject_create', [
            'nextOrder' => $this->nextOrder(DocSubject::max('sort_order')),
        ]);
    }

    public function storeSubject(Request $request)
    {
        $data = $request->validate($this->subjectRules());

        DocSubject::create([
            'name' => $data['name'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return redirect('/manage/documentation')->with('success', 'Onderwerp aangemaakt!');
    }

    public function editSubject($unique)
    {
        return view('documentation.subject_edit', ['subject' => $this->findSubject($unique)]);
    }

    public function updateSubject(Request $request, $unique)
    {
        $subject = $this->findSubject($unique);
        $data = $request->validate($this->subjectRules($subject));

        $subject->update([
            'name' => $data['name'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return redirect('/manage/documentation')->with('success', 'Onderwerp bijgewerkt!');
    }

    public function destroySubject($unique)
    {
        $subject = $this->findSubject($unique);

        DB::transaction(function () use ($subject) {
            $subject->contents()->delete();
            $subject->delete();
        });

        return redirect('/manage/documentation')->with('success', 'Onderwerp verwijderd!');
    }

    public function createContent($unique)
    {
        $subject = $this->findSubject($unique);

        return view('documentation.content_create', [
            'subject' => $subject,
            'sections' => $this->sectionLinks(),
            'nextOrder' => $this->nextOrder($subject->contents()->max('sort_order')),
        ]);
    }

    public function storeContent(Request $request, $unique)
    {
        $subject = $this->findSubject($unique);
        $data = $request->validate($this->contentRules());

        $subject->contents()->create([
            'title' => $data['title'],
            'slug' => $data['slug'] ?? $this->uniqueSlug($data['title']),
            'content' => $data['content'] ?? '',
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return redirect('/manage/documentation')->with('success', 'Onderdeel aangemaakt!');
    }

    public function editContent($unique)
    {
        $content = $this->findContent($unique);

        return view('documentation.content_edit', [
            'content' => $content,
            'subjects' => DocSubject::orderBy('sort_order')->orderBy('id')->get(),
            'sections' => $this->sectionLinks(),
        ]);
    }

    public function updateContent(Request $request, $unique)
    {
        $content = $this->findContent($unique);
        $data = $request->validate($this->contentRules($content) + [
            'subject' => 'required|uuid|exists:doc_subjects,uniqid',
        ]);

        $content->update([
            'doc_subject_id' => DocSubject::where('uniqid', $data['subject'])->value('id'),
            'title' => $data['title'],
            // Without a new anchor the existing one is kept, so links to this section stay valid.
            'slug' => $data['slug'] ?? $content->slug,
            'content' => $data['content'] ?? '',
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return back()->with('success', 'Onderdeel bijgewerkt!');
    }

    public function destroyContent($unique)
    {
        $this->findContent($unique)->delete();

        return redirect('/manage/documentation')->with('success', 'Onderdeel verwijderd!');
    }

    private function findSubject(string $unique): DocSubject
    {
        return DocSubject::where('uniqid', $unique)->firstOrFail();
    }

    private function findContent(string $unique): DocSubjectContent
    {
        return DocSubjectContent::with('subject')->where('uniqid', $unique)->firstOrFail();
    }

    private function subjectRules(?DocSubject $subject = null): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('doc_subjects', 'name')->ignore($subject?->id)],
            'sort_order' => 'nullable|integer|min:0|max:9999',
        ];
    }

    private function contentRules(?DocSubjectContent $content = null): array
    {
        return [
            'title' => 'required|string|max:150',
            'slug' => ['nullable', 'string', 'max:160', 'regex:'.self::SLUG_PATTERN, Rule::unique('doc_subjects_content', 'slug')->ignore($content?->id)],
            'content' => 'nullable|string|max:'.DocHtml::MAX_LENGTH,
            'sort_order' => 'nullable|integer|min:0|max:9999',
        ];
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::limit(Str::slug($title), 150, '') ?: 'onderdeel';
        $slug = $base;

        for ($i = 2; DocSubjectContent::where('slug', $slug)->exists(); $i++) {
            $slug = $base.'-'.$i;
        }

        return $slug;
    }

    /**
     * Default position for a new subject or content item: after the existing ones.
     */
    private function nextOrder(?int $highest): int
    {
        return $highest === null ? 10 : min($highest + 10, 9999);
    }

    /**
     * Sections the editor offers as link targets (title => #anchor).
     */
    private function sectionLinks(): array
    {
        return DocSubjectContent::orderBy('title')
            ->get(['title', 'slug'])
            ->map(fn (DocSubjectContent $item) => ['title' => $item->title, 'url' => '#'.$item->slug])
            ->all();
    }
}
