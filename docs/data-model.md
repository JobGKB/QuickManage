# Data model

Models under [app/Models/](../app/Models/). Only `User` declares `$fillable`/`$casts`; other models rely on per-field assignment in controllers.

## Models & relationships

### [User](../app/Models/User.php)
Authenticatable.
- `$fillable`: `name`, `email`, `password`, `uniqid`
- `$hidden`: `password`, `remember_token`
- `casts()`: `email_verified_at: datetime`, `password: hashed`
- Overrides `sendPasswordResetNotification($token)` → dispatches [PasswordResetMail](../app/Mail/PasswordResetMail.php) with the signed reset URL.

### [App](../app/Models/App.php) — table `apps`
FME-backed app (repository / workspace / service + template).
- `belongsTo(Template::class, 'template_id')` → `template()`
- `belongsTo(Folder::class, 'folder_id')` → `folder()`
- `belongsTo(AppCategorie::class, 'cat_id')` → `app_category()`

### [CustomApp](../app/Models/CustomApp.php) — table `custom_apps`
External-URL app tile.
- `belongsTo(AppCategorie::class, 'cat_id')` → `custom_app_category()`

### [AppCategorie](../app/Models/AppCategorie.php) — table `app_categories`
- `belongsTo(AppGallery::class, 'app_gallery_id')` → `app_categorie_app_galleries()`
- `belongsTo(Page::class, 'page_id')` → `app_categorie_pages()` ⚠️ **`App\Models\Page` does not exist** — dead relation.

### [AppGallery](../app/Models/AppGallery.php) — table `app_galleries`
Empty body; used as a parent/lookup container. Only `first()` is ever read.

### [Folder](../app/Models/Folder.php) — table `folders`
No relationships declared; looked up by `uniqid`.

### [Template](../app/Models/Template.php) — table `templates`
Empty body. Columns used by controllers/views: `name`, `background_color`, `dummy_image`, `header_logo`, `footer_image` (images base64).

### [_WorkspaceParameter](../app/Models/_WorkspaceParameter.php) — table `workspaceparameters`
⚠️ Dormant / legacy. Class is `WorkspaceParameter`, filename prefixed with `_`. References the missing `Page` model. Not used by any active controller.

## Column cheat sheet

Inferred from controllers / views (migrations for these tables are **not** in the repo — see below).

| Table | Key columns |
|---|---|
| `apps` | `name`, `description`, `template_id`, `repository`, `workspace`, `service`, `folder_id`, `cat_id`, `hash_id` (UUID), `app_thumbnail` (base64), timestamps |
| `custom_apps` | `name`, `description`, `custom_app_url`, `folder_id`, `cat_id`, `uniqid` (UUID), `custom_app_thumbnail` (base64), timestamps |
| `app_categories` | `category_name`, `description`, `app_gallery_id`, `page_id?`, `uniqid` (12 chars), timestamps |
| `app_galleries` | unknown (only read via `first()`) |
| `folders` | `folder_name`, `uniqid` (UUID), timestamps |
| `templates` | `name` (unique), `background_color` (hex), `dummy_image`, `header_logo`, `footer_image` (all base64), timestamps |
| `users` | Laravel default + `uniqid`, `image` (base64) |
| `workspaceparameters` | legacy, unused |

## Migrations status

Present in [database/migrations/](../database/migrations/):
- `0001_01_01_000000_create_users_table.php` — `users`, `password_reset_tokens`, `sessions` (stock Laravel)
- `0001_01_01_000001_create_cache_table.php` — `cache`, `cache_locks`
- `0001_01_01_000002_create_jobs_table.php` — `jobs`, `job_batches`, `failed_jobs`

**Missing migrations** (tables used by code but not created by any committed migration):

- `apps`
- `custom_apps`
- `app_categories`
- `app_galleries`
- `folders`
- `templates`
- `workspaceparameters` (legacy)
- Extra columns on `users`: `uniqid`, `image` — neither is in the committed `create_users_table` migration, though both are written to at registration/profile edit.

A clean clone + `php artisan migrate` **will not** produce a working schema for these features. See [known-issues.md](known-issues.md).

## Seeders & factories

- [database/seeders/DatabaseSeeder.php](../database/seeders/DatabaseSeeder.php) — Laravel default.
- [database/factories/UserFactory.php](../database/factories/UserFactory.php) — Laravel default.
