# Artifact apps (Claude artifacts)

Self-contained HTML apps that were built as Claude artifacts, hosted inside QuickManage behind `auth`. **They do not use MySQL**: every app has its own local JSON file as database.

| App | URL | Source | Original artifact |
|---|---|---|---|
| Eisenhower (projectenplanning per ploeg) | `/eisenhower` | [resources/apps/eisenhower/](../../resources/apps/eisenhower/) | https://claude.ai/artifact/AGZqLMpeZHTJK2DoYpnGfc |
| Leeghwater (faseringsplanning per project) | `/leeghwater` | [resources/apps/leeghwater/](../../resources/apps/leeghwater/) | https://claude.ai/artifact/5surMKU4fr4rUCPMVjDqZk |

## Pieces

- **Config**: [config/artifact_apps.php](../../config/artifact_apps.php): one entry per app (title, source folder, layout, capabilities). Routes are generated from it.
- **Controller**: [ArtifactAppController](../../app/Http/Controllers/ArtifactAppController.php): page, JSON API, asset upload/download.
- **Page assembly**: [ArtifactPageBuilder](../../app/Services/ArtifactApps/ArtifactPageBuilder.php) does the same as the app's own `build.py`, on every request. Edit `resources/apps/<slug>/src/*` and reload; there is no build step.
- **Storage**: [JsonDocumentStore](../../app/Services/ArtifactApps/JsonDocumentStore.php): one JSON file, with file locking and an atomic replace on every write.
- **Runtime shim**: [public/js/artifact-apps/claude-runtime.js](../../public/js/artifact-apps/claude-runtime.js) implements `window.claude.use(...)` against the API.
- **View**: [resources/views/artifact-apps/show.blade.php](../../resources/views/artifact-apps/show.blade.php).

## Where the data lives

```
storage/app/private/artifact-apps/<slug>/database.json   <- the "database"
storage/app/private/artifact-apps/<slug>/assets/<id>.<ext>  <- uploaded drawings/PDFs (Leeghwater)
```

The location can be changed with `ARTIFACT_APPS_STORAGE` in `.env`. The folder is git-ignored (it contains project and personal data).

`database.json` format (readable, pretty-printed):

```json
{
    "app": "leeghwater",
    "version": 12,
    "updatedAt": "2026-10-28T08:30:00Z",
    "documents": {
        "projects/heymansstraat": { "name": "Heymansstraat", "...": "..." },
        "plans/heymansstraat": { "json": "...", "rev": "...", "updatedAt": "...", "updatedBy": "qm-<uniqid>" }
    }
}
```

- Every change the user makes in the app is written to this file immediately. `version` goes up by one per write.
- **Backup** = copy the file (and `assets/`). **Restore / move to another PC** = put the file back.
- Editing the file by hand is fine while nobody is using the app. Keep it valid JSON. Open pages pick up the change within 15 s.

Initial contents (28-10-2026):
- **Eisenhower**: the data that was in Claude on 13-10-2026, plus the changes made locally on 27-10-2026.
- **Leeghwater**: `broncode/tests/seed.json` plus `Projecten/*/database/backups.json`, as of 13-10-2026. The drawings were copied from `Projecten/Heymansstraat/Tekening/` and `Projecten/Persleiding en verbreding Boezemweg/bronstukken/` under their original asset ids, so existing projects show their drawing.

## How `window.claude` is replaced

| Artifact call | Local implementation |
|---|---|
| `db.collection(c).onSnapshot` / `db.doc(p).onSnapshot` | Polls `GET /<slug>/api/snapshot` for the subscribed collections/documents only: every 15 s, right after a local write, and when the tab becomes visible. `?since=<version>` returns `{unchanged:true}` when nothing changed. Listeners fire only when their data changed. |
| `db.doc(p).get()` | `GET /<slug>/api/snapshot?d[]=<path>` |
| `db.collection(c).get()`, `.where(f, '==', v).get()` | `GET /<slug>/api/query?collection=c&where=[[f,"==",v]]` (`==` and `!=` only) |
| `doc.set` / `doc.update` / `doc.delete` | `POST /<slug>/api/write` `{op, path, data}`. `update` merges top-level keys and fails with `not_found` if the document is missing. |
| `assets.upload(blob, {type})` | `POST /<slug>/api/assets` (jpg/png/webp/gif/pdf, max `max_asset_kb`); served at `GET /<slug>/_blob/<id>`. The page's hard-coded `'/_blob/'` is rewritten to `'/<slug>/_blob/'` when served. |
| `downloads.save({filename, data})` | Normal browser download |
| `user.me()` / `user.profiles(ids)` | Logged-in QuickManage user, id `qm-<uniqid>`. Names are looked up read-only in `users`; Claude-era ids (`u_…`) have no name. |
| `user.can()` / `user.canEdit()` | Always `true`: every logged-in user can view and edit. |
| `sample` (Claude AI) | Not available outside Claude: `use('sample')` returns `null`, and the apps hide "Analyse laten maken" / "Claude laten meekijken". Existing analyses are still shown. |

The writer is single-user friendly. Several users editing the same document at the same moment get last-write-wins, the same as in Claude.

## Running locally

```powershell
php artisan serve
```

Log in and open http://127.0.0.1:8000/eisenhower or http://127.0.0.1:8000/leeghwater (also in the side menu). No migrations or imports are needed. If `database.json` doesn't exist yet, the app starts empty and the file is created on the first change.

## Adding another artifact app

1. Copy the artifact's `broncode` (at least `src/`) to `resources/apps/<slug>/`.
2. Add an entry to `config/artifact_apps.php`. Pick the `layout` that matches its `build.py`, or add one to `ArtifactPageBuilder`. Then list the capabilities it uses.
3. Optional: add a menu entry in [resources/views/includes/menu.blade.php](../../resources/views/includes/menu.blade.php).
4. Optional: put a starting `database.json` (and `assets/`) in `storage/app/private/artifact-apps/<slug>/`.

## Republishing to Claude

Still possible: run `py resources/apps/<slug>/build.py` to produce `dist/page.html` (git-ignored), then follow that app's `README.md`. The data is not synchronised between Claude and QuickManage.
