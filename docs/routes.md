# Routes

All routes live in [routes/web.php](../routes/web.php). There is no active `routes/api.php`.

## URL conventions

Admin CRUD uses the pattern:

```
GET    /manage/<resource>                  list
GET    /manage/<resource>/create            form
POST   /manage/<resource>/store             create
GET    /manage/<resource>/edit/{unique}     form
PATCH  /manage/<resource>/update/{unique}   update
DELETE /manage/<resource>/delete/{unique}   destroy
```

`{unique}` resolves against the model's UUID column (`hash_id` on `apps`, `uniqid` elsewhere), **not** the primary key.

## Public routes (no middleware)

| Method | Path | Action |
|---|---|---|
| GET | `/ping` | closure → `"pong"` |
| GET | `/` | `view('auth.login')` |
| GET | `/app-gallery/overzicht` | [AppGalleryController@GKB_AppGallery_Container](../app/Http/Controllers/AppGalleryController.php) |
| GET | `/app-gallery/{cat_uniqid}` | [AppGalleryController@GKB_AppGallery_CatContainer](../app/Http/Controllers/AppGalleryController.php) |
| GET | `/apps/view/{unique}` | [AppsController@show](../app/Http/Controllers/AppsController.php) |
| GET | `/manage/quickdataviewer` | [QuickDataViewerController@index](../app/Http/Controllers/QuickDataViewerController.php) ⚠️ |
| POST | `/api/quickdataviewer/convert-gdb` | [QuickDataViewerController@convertGdb](../app/Http/Controllers/QuickDataViewerController.php) ⚠️ |
| POST | `/api/quickdataviewer/convert-dwg` | [QuickDataViewerController@convertDwg](../app/Http/Controllers/QuickDataViewerController.php) ⚠️ |
| GET | `/arcgis/loginAGOL` (`arcgis.loginAGOL`) | closure → ArcGIS `/sharing/oauth2/authorize` |
| GET | `/oauth-callback` | [AIController@callback](../app/Http/Controllers/AIController.php) |

⚠️ `/manage/quickdataviewer` and the two conversion endpoints are **outside** the `auth` group — see [known-issues.md](known-issues.md).

## `auth` group

Plus `Auth::routes(['verify' => true])` (login/register/logout/password-reset/email-verify).

### Dashboard
`GET /dashboard` → [DashboardController@index](../app/Http/Controllers/DashboardController.php)

### Apps (FME-backed)
```
GET    /manage/apps/create
POST   /manage/apps/store
GET    /manage/apps/edit/{unique}
PATCH  /manage/apps/update/{unique}
DELETE /manage/apps/delete/{unique}
```
Bulk-assign to a gallery category: `POST /manage/app-gallery/category/update-apps/{unique}` → [AppsController@updateCategoryApps](../app/Http/Controllers/AppsController.php).

### Custom Apps
```
POST   /manage/custom-apps/store
GET    /manage/custom-apps/edit/{unique}
PATCH  /manage/custom-apps/update/{unique}
DELETE /manage/custom-apps/delete/{unique}
POST   /manage/app-gallery/category/update-custom-apps/{unique}
```

### App Gallery (admin)
```
GET    /manage/app-gallery
GET    /manage/app-gallery/category/create
POST   /manage/app-gallery/category/store
GET    /manage/app-gallery/category/{unique}
GET    /manage/app-gallery/category/edit/{unique}
PATCH  /manage/app-gallery/category/update/{unique}
DELETE /manage/app-gallery/category/delete/{unique}
```

### Folders
```
GET    /manage/folders
GET    /manage/folder/create
POST   /manage/folders/store
GET    /manage/folders/{unique}/view
DELETE /manage/folders/delete/{unique}
```

### Profile
```
GET    /manage/profile/{unique}/edit
PATCH  /manage/profile/{unique}
```

### Templates
```
GET    /manage/templates
GET    /manage/template/create
GET    /manage/template/edit/{unique}
PATCH  /manage/template/update/{unique}
POST   /manage/template/store
```
(No delete route by design.)

### Misc
```
GET /manage/accounts   → AccountController@index
GET /manage/settings   → SettingsController@index
```

## `auth` + `arcgis.required` group

| Method | Path | Name | Action |
|---|---|---|---|
| GET | `/testAI` | `testAI` | [AIController@index](../app/Http/Controllers/AIController.php) |
| POST | `/logoutAGOL` | `logoutAGOL` | [LogoutAGOLController@logout](../app/Http/Controllers/Auth/LogoutAGOLController.php) |

## `auth` + `throttle:10,1` group

| Method | Path | Name | Action |
|---|---|---|---|
| POST | `/ai/nl2where` | `ai.nl2where` | [AIController@nl2where](../app/Http/Controllers/AIController.php) |
| GET | `/ai/nl2where-stream` | — | [AIController@nl2whereStream](../app/Http/Controllers/AIController.php) (SSE) |

## Spot-checking

```powershell
php artisan route:list
```
