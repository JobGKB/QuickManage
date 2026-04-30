# Custom Apps

"Custom apps" are external-URL tiles — they do not render a template, they just link out. Used to embed third-party apps alongside FME-backed apps in the gallery.

- **Controller**: [app/Http/Controllers/CustomAppsController.php](../../app/Http/Controllers/CustomAppsController.php)
- **Model**: [app/Models/CustomApp.php](../../app/Models/CustomApp.php) — `belongsTo(AppCategorie)`
- **Views**: [resources/views/pages/custom_apps/](../../resources/views/pages/custom_apps/) (create + edit)
- **Client JS**: [public/js/custom_app/create.js](../../public/js/custom_app/create.js)

## Actions

| Method | Route | Purpose |
|---|---|---|
| `store(Request)` | `POST /manage/custom-apps/store` | validates `name|url|description|category|app_thumbnail`; UUID `uniqid`; returns JSON on XHR, otherwise redirects |
| `edit($uniqid)` | `GET /manage/custom-apps/edit/{unique}` | loads with `custom_app_category` + categories |
| `update(Request, $uniqid)` | `PATCH /manage/custom-apps/update/{unique}` | `name`, `url`, `description`, `category`, thumbnail |
| `updateCategoryCustomApps(Request, $uniqid)` | `POST /manage/app-gallery/category/update-custom-apps/{unique}` | bulk assign/unassign; JSON response |
| `destroy($uniqid)` | `DELETE /manage/custom-apps/delete/{unique}` | hard delete by `uniqid` |

No `index` / `create` routes on this controller — creation happens inline on a folder or gallery view, and the list surface reuses the gallery views.

## Client

[public/js/custom_app/create.js](../../public/js/custom_app/create.js) performs required-field validation, then submits via `FormData` + `fetch`. The server responds JSON `{ success, message }`. Keep thumbnails under Laravel's `post_max_size` — uploads are inline-encoded as base64 on save.
