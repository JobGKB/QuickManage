# Templates (HTML page builder)

A `Template` is the visual skeleton of a rendered public app page. Holds brand colours and a set of base64-encoded images.

- **Controller**: [app/Http/Controllers/TemplatesController.php](../../app/Http/Controllers/TemplatesController.php)
- **Model**: [app/Models/Template.php](../../app/Models/Template.php) (empty body)
- **Views**: [resources/views/pages/templates/](../../resources/views/pages/templates/) (index/create/edit/show)
- **Rendered layout**: [resources/views/html_templates/GKB_Realisatie_Style.blade.php](../../resources/views/html_templates/GKB_Realisatie_Style.blade.php)
- **Client JS**: [public/js/CreateHTMLPage_Form.js](../../public/js/CreateHTMLPage_Form.js) (image preview + copy-URL helper)

## Columns

| Column | Kind |
|---|---|
| `name` | unique string |
| `background_color` | hex colour (`#RRGGBB`) |
| `dummy_image` | base64 |
| `header_logo` | base64 |
| `footer_image` | base64 |
| timestamps | — |

## Actions

| Method | Route | Purpose |
|---|---|---|
| `index()` | `GET /manage/templates` | list |
| `create(Request)` | `GET /manage/template/create` | form |
| `store(Request)` | `POST /manage/template/store` | validates unique `name` + optional image mimetypes; stores `dummy_image` as base64 |
| `edit(Request, $unique)` | `GET /manage/template/edit/{unique}` | loads by PK |
| `update(Request, $unique)` | `PATCH /manage/template/update/{unique}` | updates any of name/colors/images (hex regex on colours, mime validation on images) |

**No `destroy`** — templates cannot be deleted from the UI. If you need deletion, add both a route and an action, and decide what happens to `App.template_id` references first.
