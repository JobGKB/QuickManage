# Documentation module

In-app documentation about QuickManage features and APIs. Admins write it in the CMS; it is shown on `/docs`.
Content is organised as **subjects** (e.g. *Profielplaatjes*) that each hold **content items** (e.g. *Genereren*, *Downloaden*, *Foutmeldingen*).

- **Controller**: [app/Http/Controllers/DOCSController.php](../../app/Http/Controllers/DOCSController.php)
- **Models**: [DocSubject](../../app/Models/DocSubject.php), [DocSubjectContent](../../app/Models/DocSubjectContent.php)
- **Sanitizer**: [app/Support/DocHtml.php](../../app/Support/DocHtml.php)
- **Views**: [resources/views/documentation/](../../resources/views/documentation/): `index` (front page), `manage`, `subject_create`, `subject_edit`, `content_create`, `content_edit` and the `_`-prefixed partials
- **Client JS**: [public/js/documentation/main.js](../../public/js/documentation/main.js) (front page), [public/js/documentation/admin.js](../../public/js/documentation/admin.js) (CMS editor)
- **Styles**: [resources/sass/docs.scss](../../resources/sass/docs.scss) (front page), `.doc-manage` block in [resources/sass/style.scss](../../resources/sass/style.scss) (CMS)

## Access

All routes are inside the `auth` group in [routes/web.php](../../routes/web.php): only QuickManage accounts get in.
Microsoft SSO sessions (`azure.required`) and guests are redirected to the login page. Do not move `/docs` out of that group.

## Tables

| Table | Columns |
|---|---|
| `doc_subjects` | `id`, `uniqid` (UUID, used in routes), `name` (unique), `sort_order`, timestamps |
| `doc_subjects_content` | `id`, `doc_subject_id` (FK → `doc_subjects.id`, cascade on delete), `uniqid` (UUID), `title`, `slug` (unique, the `/docs#slug` anchor), `content` (sanitized HTML), `sort_order`, timestamps |

Migration `2026_11_18_000002_import_existing_documentation` fills the tables once with the documentation that used to be
hardcoded in the view ([database/seeders/documentation/](../../database/seeders/documentation/)). It does nothing when a subject already exists.

## Actions

| Method | Route | Purpose |
|---|---|---|
| `index()` | `GET /docs` | front page; subjects without content are hidden |
| `manage()` | `GET /manage/documentation` | CMS overview |
| `createSubject()` / `storeSubject()` | `GET /manage/documentation/subject/create`, `POST …/subject/store` | new subject |
| `editSubject()` / `updateSubject()` | `GET …/subject/edit/{unique}`, `PATCH …/subject/update/{unique}` | rename / reorder |
| `destroySubject()` | `DELETE …/subject/delete/{unique}` | deletes the subject **and its content** |
| `createContent()` / `storeContent()` | `GET …/content/create/{unique}`, `POST …/content/store/{unique}` | `{unique}` is the subject |
| `editContent()` / `updateContent()` | `GET …/content/edit/{unique}`, `PATCH …/content/update/{unique}` | edit; can move to another subject |
| `destroyContent()` | `DELETE …/content/delete/{unique}` | delete one item |

The anchor (`slug`) is generated from the title when left empty and is kept on update, so links to a section stay valid.

## Security

Content is HTML written by admins and printed unescaped, so it is treated as untrusted:

1. **Allowlist sanitizer** — `DocHtml::sanitize()` (built on `symfony/html-sanitizer`) keeps only the elements and attributes it lists:
   headings, paragraphs, lists, links (`http`, `https`, `mailto`, relative and `#anchor`), tables, `pre`/`code`, `details`/`summary`
   and a fixed set of classes (`endpoint`, `method`, `method-get|post|put|patch|delete`, `language-*`).
   Scripts, event handlers, inline styles, ids, images, iframes and forms are removed.
2. **Applied twice** — when content is saved (model mutator) and again when it is rendered (`$item->safe_content`).
   Views must print `safe_content`, never `content`, with `{!! !!}`.
3. **Content-Security-Policy** — the `/docs` response allows scripts from this site only (`script-src 'self'`), so injected markup
   could not run even if it passed the sanitizer. The front page therefore must not use inline scripts, inline styles or CDN scripts.
4. The WYSIWYG editor runs in the browser and is **not** a security boundary; anything it produces passes through step 1.

To allow a new element or class, add it to `DocHtml` (and to the editor toolbar in `admin.js` if authors should be able to create it), then style it in `docs.scss`.

## Editor

The CMS uses [Jodit](https://xdsoft.net/jodit/) (MIT), loaded from jsDelivr with a pinned version and SRI hashes in
[_editor_assets.blade.php](../../resources/views/documentation/_editor_assets.blade.php). When upgrading, change the version and
recompute both `sha384` hashes.

- `layouts/app` loads the ArcGIS SDK, whose AMD loader defines a global `define`. Jodit would register as an AMD module instead of
  creating `window.Jodit`, so `define` is hidden while the Jodit script loads.
- Custom toolbar buttons in `admin.js`: *Code* (inline code), *Verwijzing* (link to another section), *Koprij* (table header row),
  *Endpoint* (HTTP method badge + URL) and *Inklapbaar* (`<details>` block).
- Images are not supported: there is no upload endpoint and `<img>` is not on the allowlist.

The front page adds the copy buttons itself (`main.js`): around every `<pre>` and after every `<p class="endpoint">`.

## Tests

[tests/Feature/DocumentationTest.php](../../tests/Feature/DocumentationTest.php) covers access, CRUD, anchors and sanitizing. It runs on
in-memory SQLite (needs the `pdo_sqlite` extension) and migrates only the tables it needs, because the full migration set contains
MySQL-only statements.

```powershell
php artisan test --filter=DocumentationTest
```
