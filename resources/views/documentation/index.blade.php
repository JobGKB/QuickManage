<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Only Bootstrap's CSS is used here. No third-party scripts on this page: the Content-Security-Policy set in DOCSController allows scripts from this site only. --}}
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
                            @foreach($subjects as $subject)
                                <li class="menu-group">
                                    <span class="menu-title">{{ $subject->name }}</span>
                                    <ul>
                                        @foreach($subject->contents as $item)
                                            <li><a href="#{{ $item->slug }}">{{ $item->title }}</a></li>
                                        @endforeach
                                    </ul>
                                </li>
                            @endforeach
                        </ul>
                        <p class="no-results" id="no_results">Geen resultaten gevonden.</p>
                    </div>
                </div>

                <div class="col-lg-9">

                    @foreach($subjects as $subject)
                        @foreach($subject->contents as $item)
                            <div class="doc-section" id="content-{{ $item->slug }}">
                                @unless($item->startsWithHeading())
                                    <h3>{{ $item->title }}</h3>
                                @endunless

                                {{-- safe_content is passed through the allowlist sanitizer (App\Support\DocHtml). Never print $item->content unescaped. --}}
                                {!! $item->safe_content !!}
                            </div>
                        @endforeach
                    @endforeach

                    @if($subjects->isEmpty())
                        <div class="doc-empty">
                            <h3>Documentatie</h3>
                            <p>Er is nog geen documentatie toegevoegd.</p>
                        </div>
                    @endif

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
