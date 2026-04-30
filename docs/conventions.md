# Conventions

Patterns in use across QuickManage. Follow these when extending the codebase; if you want to break one, note it in [known-issues.md](known-issues.md) or change everywhere.

## Public identifiers (UUID / uniqid)

Routes never bind by primary key — they bind to a UUID column. Two column names exist, historically:

| Model | Column | How it's generated |
|---|---|---|
| `App` | `hash_id` | `Str::uuid()` in [AppsController@store](../app/Http/Controllers/AppsController.php) |
| `CustomApp`, `Folder`, `User` | `uniqid` | `Str::uuid()` |
| `AppCategorie` | `uniqid` | `Str::random(12)` (not UUID) |

When adding a new resource: prefer `uniqid` (UUID) and route param `{unique}`.

## Images as base64

All image fields (`app_thumbnail`, `custom_app_thumbnail`, `dummy_image`, `header_logo`, `footer_image`, `users.image`) are stored as **base64 strings in the DB column**, not on disk. Pattern in controllers:

```php
if ($request->hasFile('image')) {
    $validated['image'] = base64_encode(file_get_contents($request->file('image')->getRealPath()));
}
```

Views render them with `<img src="data:image/...;base64,{{ $model->image }}">`. Pros: portable, survives `storage/app/public` symlink issues. Cons: row size, no CDN caching, no image processing.

## Session-scoped folder context

[FoldersController@show](../app/Http/Controllers/FoldersController.php) writes `folder_id`, `folder_name`, `folder_url` into the session. [AppsController@store](../app/Http/Controllers/AppsController.php) and [CustomAppsController@store](../app/Http/Controllers/CustomAppsController.php) read `session('folder_id')` to set the new record's `folder_id`. **Implication**: opening a folder is a prerequisite for creating an app. There is no fallback or validation if the session is empty.

## XHR JSON response convention

Admin CRUD endpoints that are also called via fetch/AJAX check `$request->wantsJson()` or `$request->ajax()` and return a shaped JSON payload:

```php
return response()->json(['success' => true, 'message' => '...', 'data' => $model]);
```

Non-XHR submissions `redirect()->back()->with('success', '...')`. Keep the dual-path convention when adding new actions that JS already hits.

## Authorisation

No Gates / Policies. Ownership checks are inline:

```php
if (Auth::user()->uniqid !== $uniqid) { abort(403); }
```

Any logged-in user can reach any `/manage/*` admin route. If that is not desired for a new resource, add the check yourself.

## Middleware aliasing

Custom middleware is aliased in [bootstrap/app.php](../bootstrap/app.php) (Laravel 11/12 style, no `app/Http/Kernel.php`):

```php
$middleware->alias([
    'arcgis.required' => \App\Http\Middleware\RequireArcgisLogin::class,
]);
```

## Frontend

- **New page JS**: put static (non-bundled) scripts under `public/js/<feature>/`. Include them in the Blade view via `@push('scripts')`.
- **New page CSS**: add SCSS under `resources/sass/`, register it in [webpack.mix.js](../webpack.mix.js), run `npm run dev`.
- The Mix `app.js` bundle should stay scaffold-thin; feature code goes in static modules.
