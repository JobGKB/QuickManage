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

Inferred from controllers / views. The exact column definitions are in the migrations listed below.

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
- `2025_01_01_000000_add_uniqid_and_image_to_users_table.php` — `users.uniqid`, `users.image`
- `2025_01_01_000001` … `000007` — `app_galleries`, `app_categories`, `folders`, `templates`, `apps`, `custom_apps`, `user_analytics`
- `2026_06_10_000000_add_indexes_to_user_analytics_table.php` — unique `visitor_id`, index `last_seen_at`, widens `page_url`

The `2025_01_01_*` migrations were reverse-engineered from the existing database (signed `INT` ids and the original
foreign-key names) and verified to produce an identical schema. Each is guarded with `Schema::hasTable` /
`Schema::hasColumn`, so on databases created before these migrations existed, `php artisan migrate` only records them.

A clean clone + `php artisan migrate` on an empty MySQL database produces the full schema (without data).
Remaining schema quirks are listed in [known-issues.md](known-issues.md#schema-quirks).

## Seeders & factories

- [database/seeders/DatabaseSeeder.php](../database/seeders/DatabaseSeeder.php) — Laravel default.
- [database/factories/UserFactory.php](../database/factories/UserFactory.php) — Laravel default.
