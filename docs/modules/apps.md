# Apps (FME-backed)

CRUD for FME-workspace-backed apps. Each `App` is a rendered HTML page tied to a `Template` and points at an FME repository/workspace/service.

- **Controller**: [app/Http/Controllers/AppsController.php](../../app/Http/Controllers/AppsController.php)
- **Model**: [app/Models/App.php](../../app/Models/App.php) — `belongsTo(Template)`, `belongsTo(Folder)`, `belongsTo(AppCategorie)`
- **Views**: [resources/views/pages/apps/](../../resources/views/pages/apps/)
- **Client JS**: [public/js/CreateHTMLPage_Form.js](../../public/js/CreateHTMLPage_Form.js), [public/js/displayHTMLpage.js](../../public/js/displayHTMLpage.js)
- **Public show layout**: [resources/views/layouts/GKB_Realisatie_Page.blade.php](../../resources/views/layouts/GKB_Realisatie_Page.blade.php) + [resources/views/html_templates/GKB_Realisatie_Style.blade.php](../../resources/views/html_templates/GKB_Realisatie_Style.blade.php)

## Actions

| Method | Route | Purpose |
|---|---|---|
| `index()` | — | list (view `pages.apps.index`) |
| `create()` | `GET /manage/apps/create` | form with `Template::get()` + `AppCategorie::get()` |
| `store(Request)` | `POST /manage/apps/store` | validates `repo|workspace|service`; assigns `hash_id = Str::uuid()`, `folder_id = session('folder_id')`, optional base64 `app_thumbnail` |
| `show($unique)` | `GET /apps/view/{unique}` (public) | resolves by `hash_id`, eager-loads `template`, renders `html_templates.GKB_Realisatie_Style` |
| `edit($uniqid)` | `GET /manage/apps/edit/{unique}` | form with relations + categories |
| `update(Request, $uniqid)` | `PATCH /manage/apps/update/{unique}` | `name`, `description`, `cat_id`, thumbnail |
| `updateCategoryApps(Request, $uniqid)` | `POST /manage/app-gallery/category/update-apps/{unique}` | bulk assign/unassign to category; JSON response |
| `destroy($uniqid)` | `DELETE /manage/apps/delete/{unique}` | hard delete by `hash_id` |

## Runtime rendering

The public `show` page renders [resources/views/html_templates/GKB_Realisatie_Style.blade.php](../../resources/views/html_templates/GKB_Realisatie_Style.blade.php), which includes [public/js/displayHTMLpage.js](../../public/js/displayHTMLpage.js). The JS:

1. Reads `window.templateChoice` ({ `repository`, `workspace`, `service`, `template.name` }).
2. Calls `GET https://fme-gkb.fmecloud.com/fmeapiv4/workspaces/{repo}/{workspace}` for the workspace's **published parameters**.
3. Dynamically builds HTML form inputs matching those parameters.
4. Submits to the FME `service` endpoint.

See [../known-issues.md#hard-coded-fme-bearer-token-in-client-js](../known-issues.md#hard-coded-fme-bearer-token-in-client-js) — this JS currently embeds the FME token in plaintext.

## Gotchas

- Creating an app requires an active folder in the session. Visit `/manage/folders/{unique}/view` first.
- `App` uses `hash_id` (not `uniqid`) as its public identifier — asymmetric with other models.
