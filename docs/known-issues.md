# Known issues

Findings uncovered while documenting the codebase. Not a prescriptive fix list — flag-only.

## Security

### Hard-coded FME bearer token in client JS
[public/js/displayHTMLpage.js](../public/js/displayHTMLpage.js) and [public/js/testAI.js](../public/js/testAI.js) (non-QDV paths) embed an `fmetoken token=…` literal in browser-shipped JavaScript. Anyone loading those pages can extract it and call FME Flow directly.

```powershell
# Verify
Select-String -Path public/js/*.js,public/js/**/*.js -Pattern "fmetoken token="
```

**Recommendation**: proxy these FME calls through a new server-side Laravel endpoint (like [QuickDataViewerController](../app/Http/Controllers/QuickDataViewerController.php) already does) and remove the literal from public JS.

### TLS verification disabled
FME calls in [QuickDataViewerController](../app/Http/Controllers/QuickDataViewerController.php) use `Http::withoutVerifying()`, and ArcGIS calls in [AIController](../app/Http/Controllers/AIController.php) conditionally skip verification when `!app()->isProduction()`. Ensure production is correctly detected (`APP_ENV=production`), or leakage of `https://` content via MITM becomes possible on dev/staging.

### QuickDataViewer routes are public
`/manage/quickdataviewer` and the two `POST /api/quickdataviewer/convert-*` endpoints sit **outside** the `auth` middleware group in [routes/web.php](../routes/web.php). Anyone on the network can upload a 500 MB file and spend FME conversion credits.

**Recommendation**: move them into the `auth` group unless public access is intentional.

### `AppCategorie` → `Page` dead relation
[AppCategorie](../app/Models/AppCategorie.php) declares `belongsTo(Page::class, 'page_id')` but `App\Models\Page` does not exist. Calling `$category->app_categorie_pages()->first()` at runtime will throw `Class "App\Models\Page" not found`. Not currently reached by any controller, but a trap.

The same broken reference exists in the dormant [_WorkspaceParameter](../app/Models/_WorkspaceParameter.php).

## Schema / migrations

### Missing migrations
These tables are written to by controllers but have **no migration** in [database/migrations/](../database/migrations/):

- `apps`
- `custom_apps`
- `app_categories`
- `app_galleries`
- `folders`
- `templates`
- `workspaceparameters` (legacy)

Additionally, `users.uniqid` and `users.image` columns are written by registration and `ProfileController@update` but are not part of `0001_01_01_000000_create_users_table.php`.

**Recommendation**: generate migrations from the current DB with `php artisan schema:dump` or reverse-engineer from the production schema and commit them.

## Dead / legacy code

- [app/Models/_WorkspaceParameter.php](../app/Models/_WorkspaceParameter.php) — prefixed filename, unused by any controller, references missing `Page` model.
- [app/Http/Controllers/HomeController.php](../app/Http/Controllers/HomeController.php) — not registered in [routes/web.php](../routes/web.php); duplicates `DashboardController@index`.
- [vite.config.js](../vite.config.js) — present but not referenced by any `npm` script; build uses Laravel Mix.
- `tailwindcss` + `@tailwindcss/vite` dependencies in [package.json](../package.json) — installed, not wired.
- [public/js/quickdataviewer/_app_quickdataviewer.js](../public/js/quickdataviewer/_app_quickdataviewer.js) — underscore-prefixed monolith superseded by the modular viewer in the same folder.
- `use Hashids\Hashids;` import in [AppsController](../app/Http/Controllers/AppsController.php) — unused; IDs come from `Str::uuid()`.

## Minor

- [FoldersController::delete](../app/Http/Controllers/FoldersController.php) takes `$id` but the route declares `{unique}`. Currently works because Laravel just passes the URL segment through, but the semantic mismatch is confusing — either rename the param or look up by `uniqid`.
- No `destroy` method on [TemplatesController](../app/Http/Controllers/TemplatesController.php) — templates cannot be deleted via the app.
- No Policies / Gates anywhere; any authenticated user can mutate any resource. Fine if this is an internal tool, risky otherwise.
