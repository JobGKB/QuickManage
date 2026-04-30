# App Gallery

Both the **public** gallery landing pages and the **admin** category management live in one controller.

- **Controller**: [app/Http/Controllers/AppGalleryController.php](../../app/Http/Controllers/AppGalleryController.php)
- **Models**: [AppGallery](../../app/Models/AppGallery.php), [AppCategorie](../../app/Models/AppCategorie.php)
- **Views**: [resources/views/pages/app_gallery/](../../resources/views/pages/app_gallery/) (admin + public container), `pages/app_gallery/app_category/` (category CRUD)
- **Public layout**: [resources/views/layouts/GKB_AppGallery_layout.blade.php](../../resources/views/layouts/GKB_AppGallery_layout.blade.php)
- **Client JS**: [public/js/app_gallery/](../../public/js/app_gallery/)

## Actions

### Public

| Method | Route | Purpose |
|---|---|---|
| `GKB_AppGallery_Container()` | `GET /app-gallery/overzicht` | lists first `AppGallery` + all categories |
| `GKB_AppGallery_CatContainer($uniqid)` | `GET /app-gallery/{cat_uniqid}` | category detail with `App`s and `CustomApp`s |

### Admin (`auth`)

| Method | Route | Purpose |
|---|---|---|
| `index()` | `GET /manage/app-gallery` | list all categories |
| `createCat()` | `GET /manage/app-gallery/category/create` | form |
| `storeCat(Request)` | `POST /manage/app-gallery/category/store` | creates `AppCategorie` with `uniqid = Str::random(12)` |
| `showCat($uniqid)` | `GET /manage/app-gallery/category/{unique}` | shows assigned + unassigned apps/custom-apps |
| `editCat($uniqid)` | `GET /manage/app-gallery/category/edit/{unique}` | form |
| `updateCat(Request, $uniqid)` | `PATCH /manage/app-gallery/category/update/{unique}` | updates name/description (JSON response) |
| `destroyCat($uniqid)` | `DELETE /manage/app-gallery/category/delete/{unique}` | nulls `cat_id` on related `App`/`CustomApp`, deletes category |

Bulk-assign endpoints live on the other controllers:
- [AppsController@updateCategoryApps](../../app/Http/Controllers/AppsController.php)
- [CustomAppsController@updateCategoryCustomApps](../../app/Http/Controllers/CustomAppsController.php)

## Client

[public/js/app_gallery/category.js](../../public/js/app_gallery/category.js) implements inline rename/description editing via AJAX `PATCH /manage/app-gallery/category/update/{id}` and multi-select app linking. [public/js/app_gallery/GKB_AppGallery_Page.js](../../public/js/app_gallery/GKB_AppGallery_Page.js) holds (mostly commented-out) screen-switch scaffolding for gallery tabs.

## `AppCategorie`'s `uniqid`

Note this one is **not** a UUID — it is `Str::random(12)`. The shorter identifier keeps gallery URLs (e.g. `/app-gallery/{uniqid}`) legible.
