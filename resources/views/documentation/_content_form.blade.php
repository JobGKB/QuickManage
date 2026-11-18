{{--
    Shared fields of the content create/edit forms.
    Expects: $content (DocSubjectContent or null), $sections (link targets for the editor),
    for creating $nextOrder (default position), and for editing $subjects (to move the
    content to another subject).
--}}
<label for="title" class="c-bold">Titel:</label>
<input type="text" id="title" name="title" value="{{ old('title', $content->title ?? '') }}" maxlength="150" placeholder="Bijvoorbeeld: Genereren" required>
<p class="doc-hint">Wordt getoond in het menu van de documentatie, en als kop boven de inhoud tenzij de inhoud zelf met een kop begint.</p>

@isset($subjects)
    <label for="subject" class="c-bold pt-3">Onderwerp:</label>
    <select id="subject" name="subject" required>
        @foreach($subjects as $option)
            <option value="{{ $option->uniqid }}" @selected(old('subject', $content->subject->uniqid) === $option->uniqid)>{{ $option->name }}</option>
        @endforeach
    </select>
@endisset

<div class="row">
    <div class="col-lg-8">
        <label for="slug" class="c-bold pt-3">Anker:</label>
        <input type="text" id="slug" name="slug" value="{{ old('slug', $content->slug ?? '') }}" maxlength="160" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="Leeg laten om automatisch van de titel te maken">
        <p class="doc-hint">Het adres van dit onderdeel (/docs#anker). Alleen kleine letters, cijfers en streepjes. Links naar dit onderdeel gebruiken dit anker.</p>
    </div>
    <div class="col-lg-4">
        <label for="sort_order" class="c-bold pt-3">Volgorde:</label>
        <input type="number" id="sort_order" name="sort_order" value="{{ old('sort_order', $content->sort_order ?? $nextOrder) }}" min="0" max="9999">
        <p class="doc-hint">Lager getal staat hoger binnen het onderwerp.</p>
    </div>
</div>

<label for="doc_content" class="c-bold pt-3">Inhoud:</label>
<textarea id="doc_content" name="content" data-sections="{{ json_encode($sections) }}">{{ old('content', $content->content ?? '') }}</textarea>
<p class="doc-hint">Opmaak die de documentatie niet ondersteunt (zoals afbeeldingen, kleuren en scripts) wordt bij het opslaan verwijderd.</p>
