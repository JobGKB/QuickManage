<?php

/*
|--------------------------------------------------------------------------
| Claude artifact apps
|--------------------------------------------------------------------------
|
| Self-contained HTML apps originally built as Claude artifacts. Each app is
| served at "/<slug>" (behind `auth`) by ArtifactAppController. The Claude
| runtime (window.claude) is replaced by public/js/artifact-apps/claude-runtime.js;
| data lives in a local JSON file, NOT in MySQL:
|
|   <storage_path>/<slug>/database.json   all documents ("<collection>/<id>" => {...})
|   <storage_path>/<slug>/assets/         uploaded files (served at /<slug>/_blob/<id>)
|
| Per app:
|   title         Shown in the menu.
|   source        Folder with the page fragments (the artifact's broncode/src).
|   layout        How the fragments are assembled (must match the app's build.py):
|                   'volgorde-json'            src/volgorde.json, joined with "\n"
|                   'kop-stijl-pagina-scripts' 00-kop.html + <style>10-stijl.css</style>
|                                              + 20-pagina.html + <script>[3-9]?-*.js</script>
|   capabilities  Which window.claude.use(...) capabilities the page gets locally.
|                 Supported: db, user, downloads, assets. ('sample' = Claude AI is not
|                 available outside Claude; the apps hide those buttons.)
|
*/

return [

    'storage_path' => env('ARTIFACT_APPS_STORAGE', storage_path('app/private/artifact-apps')),

    'poll_interval_ms' => 15000,

    'max_asset_kb' => 51200,

    'apps' => [

        'eisenhower' => [
            'title' => 'Eisenhower',
            'source' => resource_path('apps/eisenhower/src'),
            'layout' => 'volgorde-json',
            'capabilities' => ['db', 'user', 'downloads'],
        ],

        'leeghwater' => [
            'title' => 'Leeghwater',
            'source' => resource_path('apps/leeghwater/src'),
            'layout' => 'kop-stijl-pagina-scripts',
            'capabilities' => ['db', 'user', 'downloads', 'assets'],
        ],
 
    ],

];
