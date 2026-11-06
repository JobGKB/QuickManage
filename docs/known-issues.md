# Known issues

Findings uncovered while documenting the codebase. Not a prescriptive fix list — flag-only.

## Security

### FME tokens in client JS (fixed — rotate the old tokens)
All FME calls from the browser now go through server-side proxies, and no `fmetoken` value remains in `public/js`:

- App create form → `GET /manage/fme/repositories…`, `/manage/fme/workspaces/…` ([FmeProxyController](../app/Http/Controllers/FmeProxyController.php), `FME_SERVER_TOKEN`)
- Ontvangstloket → `POST /Ontvangstloket-IW/api/upload|run|submit` ([Ontvangstloket_IWController](../app/Http/Controllers/Ontvangstloket_IWController.php), `FME_SERVER_TOKEN`)
- PBA indexaties → `GET|POST /PBA-FMUTA6-VerwerkWeekIndexatie/api/indexaties` ([PBA_IWController](../app/Http/Controllers/PBA_IWController.php), `FME_PBA_TOKEN`)
- PBA Excel export → `GET /PBA-FMUTA6-VerwerkWeekIndexatie/api/download` ([PBA_IWController](../app/Http/Controllers/PBA_IWController.php), `FME_PBA_DOWNLOAD_TOKEN`; previously hardcoded in the Blade view)

```powershell
# Verify (should return nothing)
Select-String -Path public/js/*.js,public/js/**/*.js -Pattern "fmetoken token=[0-9a-f]"
```

**Still to do**: the old token values are in git history. Revoke them in FME Flow / FME Cloud, create new ones, and update `FME_SERVER_TOKEN` / `FME_PBA_TOKEN` / `FME_PBA_DOWNLOAD_TOKEN` in `.env` on every environment.

### Uploads and unescaped HTML (fixed)
Image uploads (app/custom-app thumbnails, template images, profile image) validate `image|mimes:jpeg,png,gif,webp|max:2048` and store the file with the extension detected from its content (`$file->extension()`), never the client-supplied one. Descriptions are rendered with `App\Support\SafeHtml::basic()` instead of raw `{!! !!}`.

### TLS verification disabled
FME calls in [QuickDataViewerController](../app/Http/Controllers/QuickDataViewerController.php) use `Http::withoutVerifying()`, and ArcGIS calls in [AIController](../app/Http/Controllers/AIController.php) conditionally skip verification when `!app()->isProduction()`. Ensure production is correctly detected (`APP_ENV=production`), or leakage of `https://` content via MITM becomes possible on dev/staging.

### QuickDataViewer routes are public
`/manage/quickdataviewer` and the two `POST /api/quickdataviewer/convert-*` endpoints sit **outside** the `auth` middleware group in [routes/web.php](../routes/web.php). Anyone on the network can upload a 500 MB file and spend FME conversion credits.

**Recommendation**: move them into the `auth` group unless public access is intentional.

### `AppCategorie` → `Page` dead relation
[AppCategorie](../app/Models/AppCategorie.php) declares `belongsTo(Page::class, 'page_id')` but `App\Models\Page` does not exist. Calling `$category->app_categorie_pages()->first()` at runtime will throw `Class "App\Models\Page" not found`. Not currently reached by any controller, but a trap.

The same broken reference exists in the dormant [_WorkspaceParameter](../app/Models/_WorkspaceParameter.php).

## Schema / migrations

### Schema quirks
All tables used by the code now have migrations (see [data-model.md](data-model.md#migrations-status)). They mirror the existing database exactly, including these quirks that should be fixed in a follow-up migration:

- `custom_apps.updated_at` and `user_analytics.updated_at` are `VARCHAR(100)` instead of `TIMESTAMP`.
- `apps.hash_id` is `TEXT` without an index, although every app lookup filters on it.
- `analytic_reports` and `workspaces_apps` exist in the database but have no migration and are not used by any code.
- `workspaceparameters` (legacy `_WorkspaceParameter` model) does not exist in the database.

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
