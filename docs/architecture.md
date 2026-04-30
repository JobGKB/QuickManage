# Architecture

Classic Laravel MVC with a few app-specific conventions worth knowing before you touch the code.

## Layering

```
Browser ──► routes/web.php ──► Middleware ──► Controller ──► Eloquent Model (DB)
                                                   │
                                                   └──► Blade View
```

- **Routing**: single [routes/web.php](../routes/web.php). No `routes/api.php` in active use — all JSON endpoints live on the web stack (CSRF-protected).
- **Controllers**: thin. Validation + Eloquent + view or JSON response. No service/repository layer.
- **Models**: almost no `$fillable` or `$casts` (see [docs/data-model.md](data-model.md)); attributes are assigned one by one in controllers.
- **Views**: Blade, organised by feature under [resources/views/pages/](../resources/views/pages/). Shared navigation in [resources/views/includes/menu.blade.php](../resources/views/includes/menu.blade.php).
- **Frontend**: static JS/CSS in [public/js/](../public/js/) and [public/css/](../public/css/), built by Laravel Mix from [resources/sass/](../resources/sass/) and [resources/js/](../resources/js/). See [docs/frontend.md](frontend.md).

## Request lifecycle

1. [bootstrap/app.php](../bootstrap/app.php) creates the application, registers the middleware alias `arcgis.required` → [RequireArcgisLogin](../app/Http/Middleware/RequireArcgisLogin.php), and installs the global exception handler (see below).
2. [routes/web.php](../routes/web.php) dispatches to a controller action.
3. Middleware groups currently in use:
   - **public** (no middleware) — `/`, `/ping`, `/app-gallery/*`, `/apps/view/{unique}`, `/manage/quickdataviewer` *(see [known-issues](known-issues.md))*, ArcGIS OAuth routes.
   - **`auth`** — the entire `/manage/*` admin CRUD surface and `/dashboard`.
   - **`auth` + `arcgis.required`** — `/testAI`, `/logoutAGOL`.
   - **`auth` + `throttle:10,1`** — `/ai/nl2where`, `/ai/nl2where-stream` (10 req/min).

## Authentication & session state

- Laravel UI scaffold (`Auth::routes(['verify' => true])`).
- Email verification is enabled; password reset sends a custom [PasswordResetMail](../app/Mail/PasswordResetMail.php) via [User::sendPasswordResetNotification](../app/Models/User.php).
- **ArcGIS OAuth tokens live in the PHP session** (keys: `arcgis.access_token`, `arcgis.expires_in`, `arcgis.expires_at`, `arcgis.username`), not in the database. [RequireArcgisLogin](../app/Http/Middleware/RequireArcgisLogin.php) redirects to the login URL when the token is missing or expired. See [docs/modules/ai.md](modules/ai.md).
- **Folder context lives in the session**. [FoldersController@show](../app/Http/Controllers/FoldersController.php) writes `folder_id`/`folder_name`/`folder_url` into the session; [AppsController@store](../app/Http/Controllers/AppsController.php) and [CustomAppsController@store](../app/Http/Controllers/CustomAppsController.php) read `session('folder_id')` to scope new records. Creating an app without first opening a folder is a silent no-op — watch for this.

## Identifiers

Two competing public-identifier fields exist (do not unify blindly):

| Table | Public ID column |
|---|---|
| `apps` | `hash_id` (UUID) |
| `custom_apps` | `uniqid` (UUID) |
| `app_categories` | `uniqid` (random 12 chars) |
| `folders` | `uniqid` (UUID) |
| `templates` | primary key `id` (no public UUID) |
| `users` | `uniqid` (UUID; not in any committed migration — see [data-model.md](data-model.md)) |

Routes consistently bind `{unique}` to these columns, not to the primary key.

## Asset storage

Images (user avatars, app/category thumbnails, template logos/backgrounds) are stored as **base64 strings directly in DB columns** — not on disk, not in `storage/app/public`. Every image-accepting controller reads the uploaded file with `file_get_contents` → `base64_encode` before save. See [docs/conventions.md](conventions.md#images-as-base64).

## Exception handling

Registered globally in [bootstrap/app.php](../bootstrap/app.php) (Laravel 11/12 style, no `app/Exceptions/Handler.php`):

- `QueryException` / `PDOException` with SQLSTATE `2002` or "Connection refused" → renders [resources/views/errors/db-connection.blade.php](../resources/views/errors/db-connection.blade.php) with HTTP 503.
- Standard error pages 401/403/404/419/429/500/503 live under [resources/views/errors/](../resources/views/errors/) extending `errors-layout`.

## Rate limits

| Limiter | Where |
|---|---|
| `throttle:10,1` | `/ai/nl2where`, `/ai/nl2where-stream` ([routes/web.php](../routes/web.php)) |
| `throttle:6,1` | Email verification routes (stock `Auth::routes`) |
| `api` limiter (60/min) | Default from [RouteServiceProvider](../app/Providers/RouteServiceProvider.php) — not currently hit because `routes/api.php` is unused |

## Authorisation model

There are **no Gates or Policies**. Ownership checks are inline — e.g. [ProfileController](../app/Http/Controllers/ProfileController.php) compares `Auth::user()->uniqid` to the route param and `abort(403)` manually. Admin surfaces rely solely on `auth` middleware (any logged-in user can hit them).
