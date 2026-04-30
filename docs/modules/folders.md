# Folders

Folders group apps and custom-apps. They also establish the session-scoped "current folder" used by app creation.

- **Controller**: [app/Http/Controllers/FoldersController.php](../../app/Http/Controllers/FoldersController.php)
- **Model**: [app/Models/Folder.php](../../app/Models/Folder.php) (no relationships declared)
- **Views**: [resources/views/pages/folder/](../../resources/views/pages/folder/) (create/index/show)

## Actions

| Method | Route | Purpose |
|---|---|---|
| `index()` | `GET /manage/folders` | list folders |
| `show($uniqid)` | `GET /manage/folders/{unique}/view` | **sets** `session(['folder_id', 'folder_name', 'folder_url'])`; loads contained `App`s, `CustomApp`s, and all categories |
| `create(Request)` | `GET /manage/folder/create` | form view |
| `store(Request)` | `POST /manage/folders/store` | validates `folder_name`; UUID `uniqid` |
| `delete($id)` | `DELETE /manage/folders/delete/{unique}` | hard delete by PK ⚠️ see note below |

## Session contract

After `show()` the session carries:

```php
session([
  'folder_id'   => $folder->id,
  'folder_name' => $folder->folder_name,
  'folder_url'  => url()->current(),
]);
```

[AppsController@store](../../app/Http/Controllers/AppsController.php) and [CustomAppsController@store](../../app/Http/Controllers/CustomAppsController.php) both do `$validated['folder_id'] = session('folder_id');`. **Implication**: you must `show()` a folder before creating an app. There is no validation for a missing session value.

## Gotcha: `delete($id)`

The route is `DELETE /manage/folders/delete/{unique}`, but the action's parameter is named `$id` and is passed straight to `Folder::find($id)->delete()`. In practice Laravel hands it the raw URL segment, so this only works if the UUID is (mis)treated as an integer PK — **the delete currently does nothing useful**. Pattern to follow:

```php
Folder::where('uniqid', $uniqid)->firstOrFail()->delete();
```
