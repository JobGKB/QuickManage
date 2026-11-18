@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid doc-manage">
        @include('documentation._messages')

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="breadcrumbs">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item active" aria-current="page">Documentatie</li>
                        </ol>
                    </nav>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Documentatie</h2>
                    <a href="/docs" target="_blank" class="btn_view"><i class="fa-solid fa-eye eye"></i> Open documentatie</a>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="create-item">
                        <a href="/manage/documentation/subject/create"><i class="fa-solid fa-plus"></i> Onderwerp aanmaken</a>

                        <div class="header-wrapper">
                            <input type="text" class="searchbar" id="doc_search" placeholder="Zoeken...">
                        </div>
                        
                    </div>
                   

                    @forelse($subjects as $subject)
                        <div class="doc-subject">
                            <div class="doc-subject-header">
                                <p class="m-0">
                                    <strong>{{ $subject->name }}</strong>
                                    <span class="doc-subject-count">{{ $subject->contents->count() }} {{ $subject->contents->count() === 1 ? 'onderdeel' : 'onderdelen' }}</span>
                                </p>

                                <div class="doc-subject-actions">
                                    <a href="/manage/documentation/content/create/{{ $subject->uniqid }}"><i class="fa-solid fa-plus"></i> Onderdeel</a>
                                    <a href="/manage/documentation/subject/edit/{{ $subject->uniqid }}" title="Onderwerp bewerken"><i class="fa-solid fa-pencil"></i></a>

                                    <form action="/manage/documentation/subject/delete/{{ $subject->uniqid }}" method="POST"
                                          data-confirm="Onderwerp '{{ $subject->name }}' verwijderen? Alle onderdelen van dit onderwerp worden ook verwijderd.">
                                        @csrf @method('DELETE')
                                        <button type="submit" class="doc-delete" title="Onderwerp verwijderen"><i class="fa-solid fa-trash"></i></button>
                                    </form>
                                </div>
                            </div>

                            @if($subject->contents->isNotEmpty())
                                <div class="table-wrapper">
                                    <header>
                                        <div class="wr-col-th"><strong>Titel</strong></div>
                                        <div class="wr-col-th"><strong>Anker</strong></div>
                                        <div class="wr-col-th"><strong>Volgorde</strong></div>
                                        <div class="wr-col-th"><strong>Laatst gewijzigd</strong></div>
                                        <div class="wr-col-th"><strong>Acties</strong></div>
                                    </header>

                                    @foreach($subject->contents as $item)
                                        <div class="wr-row">
                                            <div class="wr-col">{{ $item->title }}</div>
                                            <div class="wr-col">#{{ $item->slug }}</div>
                                            <div class="wr-col">{{ $item->sort_order }}</div>
                                            <div class="wr-col">{{ $item->updated_at }}</div>
                                            <div class="wr-col">
                                                <div class="wr-col-act">

                                                    <a target="_blank" href="/docs#{{ $item->slug }}">
                                                        <i class="fa-solid fa-eye eye"></i>
                                                    </a>

                                                    <a href="/manage/documentation/content/edit/{{ $item->uniqid }}">
                                                        <i class="fa-solid fa-pencil pencil"></i>
                                                    </a>

                                                    <form action="/manage/documentation/content/delete/{{ $item->uniqid }}" method="POST"
                                                          data-confirm="Onderdeel '{{ $item->title }}' verwijderen?">
                                                        @csrf @method('DELETE')
                                                        <button type="submit" class="btn_delete">
                                                            <i class="fa-solid fa-trash trash"></i>
                                                        </button>
                                                    </form>

                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            @else
                                <p class="doc-subject-empty">Dit onderwerp heeft nog geen onderdelen en is daarom niet zichtbaar in de documentatie.</p>
                            @endif
                        </div>
                    @empty
                        <p class="doc-subject-empty">Er zijn nog geen onderwerpen. Maak eerst een onderwerp aan en voeg daar onderdelen aan toe.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/documentation/admin.js') }}"></script>
@endsection
