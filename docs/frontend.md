# Frontend

## Build pipeline

**Active tool: Laravel Mix (webpack).** [vite.config.js](../vite.config.js) exists but no npm script references it — it is dead config.

[package.json](../package.json) scripts (all `mix`-based):

| Script | Command |
|---|---|
| `npm run dev` | `mix` |
| `npm run watch` | `mix watch` (with BrowserSync proxy of `http://127.0.0.1:8000`) |
| `npm run hot` | `mix watch --hot` |
| `npm run prod` | `mix --production` |

Key deps: `bootstrap 5.2.3`, `@popperjs/core`, `axios`, `laravel-mix 6`, `sass`, `webpack 5`, `browser-sync`. `tailwindcss 4` and `@tailwindcss/vite` are installed but **not wired** into `webpack.mix.js`.

## SCSS → CSS mapping

Defined in [webpack.mix.js](../webpack.mix.js):

| Source | Output |
|---|---|
| [resources/sass/style.scss](../resources/sass/style.scss) | [public/css/style.css](../public/css/style.css) |
| [resources/sass/app_gallery.scss](../resources/sass/app_gallery.scss) | [public/css/app_gallery.css](../public/css/app_gallery.css) |
| [resources/sass/GKB_Realisatie_Style.scss](../resources/sass/GKB_Realisatie_Style.scss) | [public/css/GKB_Realisatie_Style.css](../public/css/GKB_Realisatie_Style.css) |
| [resources/sass/testAI.scss](../resources/sass/testAI.scss) | [public/css/testAI.css](../public/css/testAI.css) |
| [resources/sass/errors_style.scss](../resources/sass/errors_style.scss) | [public/css/errors_style.css](../public/css/errors_style.css) |
| [resources/sass/dataviewer.scss](../resources/sass/dataviewer.scss) | [public/css/dataviewer.css](../public/css/dataviewer.css) |

Partial: [_variables.scss](../resources/sass/_variables.scss).

## JS entry

- [resources/js/app.js](../resources/js/app.js) → `import './bootstrap';`
- [resources/js/bootstrap.js](../resources/js/bootstrap.js) → imports `bootstrap` + `axios`, sets `X-Requested-With` header. Echo/Pusher block is commented out. Essentially stock Laravel scaffold.
- Compiled to [public/js/app.js](../public/js/app.js).

## Static (non-Mix) client modules

Under [public/js/](../public/js/) — loaded directly by Blade views, not imported by the Mix bundle:

| File/folder | Purpose |
|---|---|
| [menu.js](../public/js/menu.js) | Hamburger menu toggle for [includes/menu.blade.php](../resources/views/includes/menu.blade.php) |
| [CreateHTMLPage_Form.js](../public/js/CreateHTMLPage_Form.js) | Template builder form (image preview, copy-URL) |
| [displayHTMLpage.js](../public/js/displayHTMLpage.js) | Runtime renderer for saved template pages; fetches FME published parameters |
| [testAI.js](../public/js/testAI.js) | SSE client for `/ai/nl2where-stream` |
| [app_gallery/](../public/js/app_gallery/) | Gallery page logic + inline category editing |
| [custom_app/](../public/js/custom_app/) | Custom-app create form (AJAX + FormData) |
| [quickdataviewer/](../public/js/quickdataviewer/) | Modular OpenLayers viewer — see [modules/quickdataviewer.md](modules/quickdataviewer.md) |

## Views

Organised by feature under [resources/views/](../resources/views/):

| Folder | Content |
|---|---|
| [layouts/](../resources/views/layouts/) | `app.blade.php` (master), `aiTest.blade.php`, `GKB_AppGallery_layout.blade.php`, `GKB_Realisatie_Page.blade.php` |
| [includes/](../resources/views/includes/) | `menu.blade.php` — shared navigation |
| [auth/](../resources/views/auth/) | Laravel UI login/register/verify + `passwords/*` (reset) + `passwords/mail-templates/reset-password-mail.blade.php` |
| [errors/](../resources/views/errors/) | 401/403/404/419/429/500/503/`db-connection` + `errors-layout` |
| [pages/](../resources/views/pages/) | CRUD sets for `accounts`, `apps`, `app_gallery/` (+ nested `app_category/`), `custom_apps`, `folder`, `profile`, `settings`, `templates` |
| [html_templates/](../resources/views/html_templates/) | `GKB_Realisatie_Style.blade.php` — template body used by the HTML page builder |
| [quickdataviewer/](../resources/views/quickdataviewer/) | `index.blade.php` — OL map + drop zone shell |
| [AI/](../resources/views/AI/) | `index.blade.php` — AI test UI |
| [dashboard.blade.php](../resources/views/dashboard.blade.php) | Authenticated landing page |

## Master layout

[layouts/app.blade.php](../resources/views/layouts/app.blade.php) loads, via CDN: jQuery, Bootstrap 5.2.3 (CSS + Bundle JS), Font Awesome 6.4, ArcGIS 4.28 CSS, Bunny fonts, CSRF meta. Per-page CSS/JS is added via `@push('styles')` / `@push('scripts')`.
