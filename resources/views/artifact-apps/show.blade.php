<!doctype html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('storage/fav-cm.png') }}">
    {{-- Must load before the page script: it provides window.claude (db, user, downloads, assets). --}}
    <script>window.ARTIFACT_RUNTIME = @json($runtimeConfig);</script>
    <script src="{{ asset('js/artifact-apps/claude-runtime.js') }}"></script>
</head>
<body>
{{-- Assembled from resources/apps/<app>/src (see ArtifactPageBuilder). --}}
{!! $page !!}
</body>
</html>
