# QuickDataViewer

Browser-based geospatial file viewer backed by OpenLayers (EPSG:28992 / Dutch RD). Accepts Shapefile ZIPs, GeoPackage, DWG and File Geodatabase; conversion of GDB and DWG is proxied through Laravel to FME Flow.

- **Server controller**: [app/Http/Controllers/QuickDataViewerController.php](../../app/Http/Controllers/QuickDataViewerController.php)
- **View**: [resources/views/quickdataviewer/index.blade.php](../../resources/views/quickdataviewer/index.blade.php)
- **Client modules**: [public/js/quickdataviewer/](../../public/js/quickdataviewer/) (ES modules, loaded statically)
- **Styles**: [resources/sass/dataviewer.scss](../../resources/sass/dataviewer.scss) → [public/css/dataviewer.css](../../public/css/dataviewer.css)

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/manage/quickdataviewer` | renders viewer shell |
| POST | `/api/quickdataviewer/convert-gdb` | zip-of-.gdb → `.gpkg` via FME |
| POST | `/api/quickdataviewer/convert-dwg` | `.dwg` → `.gpkg` via FME |

⚠️ These are **not** behind `auth`. See [../known-issues.md#quickdataviewer-routes-are-public](../known-issues.md#quickdataviewer-routes-are-public).

## Client architecture

Entry: [public/js/quickdataviewer/index.js](../../public/js/quickdataviewer/index.js). Orchestrates init of projections → map → DOM → controls → popup → drop zone → services → search → attribute table.

| Folder | Responsibility | Key files |
|---|---|---|
| `config/` | Projection + basemap setup | [projections.js](../../public/js/quickdataviewer/config/projections.js) (registers EPSG:28992 via proj4 + RD extent `[-285401.92, 22598.08, 595401.92, 903401.92]`), [basemap.js](../../public/js/quickdataviewer/config/basemap.js) |
| `core/` | Map + state + styles | [map.js](../../public/js/quickdataviewer/core/map.js), [state.js](../../public/js/quickdataviewer/core/state.js), [styles.js](../../public/js/quickdataviewer/core/styles.js) |
| `search/` | Address lookup | [addressSearch.js](../../public/js/quickdataviewer/search/addressSearch.js) (PDOK geocoder) |
| `services/` | File format handlers | [shapefileLoader.js](../../public/js/quickdataviewer/services/shapefileLoader.js), [gpkgLoader.js](../../public/js/quickdataviewer/services/gpkgLoader.js), [fmeConverter.js](../../public/js/quickdataviewer/services/fmeConverter.js) (GDB→GPKG), [dwgConverter.js](../../public/js/quickdataviewer/services/dwgConverter.js), [fileProcessor.js](../../public/js/quickdataviewer/services/fileProcessor.js), [projectionDetector.js](../../public/js/quickdataviewer/services/projectionDetector.js), [layerManager.js](../../public/js/quickdataviewer/services/layerManager.js), [exporter.js](../../public/js/quickdataviewer/services/exporter.js) |
| `ui/` | DOM interaction | [controls.js](../../public/js/quickdataviewer/ui/controls.js), [popup.js](../../public/js/quickdataviewer/ui/popup.js), [dropzone.js](../../public/js/quickdataviewer/ui/dropzone.js), [attributeTable.js](../../public/js/quickdataviewer/ui/attributeTable.js), [helpers.js](../../public/js/quickdataviewer/ui/helpers.js) |
| `utils/` | Coordinate helpers | [coordinates.js](../../public/js/quickdataviewer/utils/coordinates.js) |

Legacy: [_app_quickdataviewer.js](../../public/js/quickdataviewer/_app_quickdataviewer.js) — underscore-prefixed predecessor of the modular viewer; not loaded.

## Projection

Map view is EPSG:28992. OpenLayers reprojects EPSG:3857 OSM tiles client-side. For RD-native basemaps, use WMTS sources with an EPSG:28992 TileGrid to avoid reprojection cost.

## Conversion flow (GDB)

See the sequence diagram in [../integrations.md#gdb-conversion-sequence](../integrations.md#gdb-conversion-sequence). Constraints:

- Input: `.zip` up to 500 MB, containing a `.gdb` directory.
- FME token via `FME_SERVER_TOKEN`; workspace URL via `FME_SERVER_URL`.
- HTTP timeout 300 s; TLS verification disabled (`withoutVerifying()`).
- Response streamed back as `application/octet-stream; filename="converted.gpkg"`.

The same pattern applies to `.dwg` with `FME_DWG_SERVER_URL`.

## Loading overlay pattern

A single loading overlay lives in the parent view ([resources/views/quickdataviewer/index.blade.php](../../resources/views/quickdataviewer/index.blade.php)) so it stays visible after `fileSelectionViewer` is hidden. Upload/parse flows call `waitForUiPaint()` after `setLoading(...)` so the spinner paints before heavy work starts.
