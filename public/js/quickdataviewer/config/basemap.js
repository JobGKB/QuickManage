// ===========================
// Basemap Configuration
// ===========================
// Two basemaps are available and can be toggled at runtime:
//   1. PDOK BRT Achtergrondkaart (default) — standard topographic map tiles
//   2. PDOK Luchtfoto orthoHR             — true-ortho aerial imagery
// Both use EPSG:28992 (RD New) tiles — no reprojection required.

const BRT_URL  = 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0';
const BRT_LAYER = 'standaard';

const LUCHTFOTO_URL   = 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0';
const LUCHTFOTO_LAYER = 'Actueel_orthoHR';

// Standard RD tile grid shared by both services
const RD_TILE_GRID = () => new ol.tilegrid.WMTS({
  origin: [-285401.92, 903401.92],
  resolutions: [3440.64, 1720.32, 860.16, 430.08, 215.04, 107.52, 53.76, 26.88, 13.44, 6.72, 3.36, 1.68, 0.84, 0.42, 0.21],
  matrixIds: ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14'],
});

const createBrtSource = () => new ol.source.WMTS({
  url: BRT_URL,
  layer: BRT_LAYER,
  matrixSet: 'EPSG:28992',
  format: 'image/png',
  style: 'default',
  projection: 'EPSG:28992',
  tileGrid: RD_TILE_GRID(),
  wrapX: false,
});

const createLuchtfotoSource = () => new ol.source.WMTS({
  url: LUCHTFOTO_URL,
  layer: LUCHTFOTO_LAYER,
  matrixSet: 'EPSG:28992',
  format: 'image/jpeg',
  style: 'default',
  projection: 'EPSG:28992',
  tileGrid: RD_TILE_GRID(),
  wrapX: false,
});

// Keep a reference to the active basemap layer so we can swap its source.
let _basemapLayer = null;
let _activeBasemap = 'brt'; // 'brt' | 'luchtfoto'

/**
 * Returns an ol.source.WMTS for the default (BRT) basemap.
 * Used during map initialisation via createBasemapLayer().
 */
export const createBasemapSource = () => createBrtSource();

/**
 * Creates and returns the basemap tile layer (default: BRT achtergrondkaart).
 * Stores an internal reference so toggleBasemap() can swap sources later.
 */
export const createBasemapLayer = () => {
  _basemapLayer = new ol.layer.Tile({ source: createBrtSource() });
  _activeBasemap = 'brt';
  return _basemapLayer;
};

// Thumbnail tiles (same location, different style — clearly shows the visual difference)
const BRT_THUMB       = '/storage/achtergrondkaart1.png';
const LUCHTFOTO_THUMB = '/storage/luchtfoto1.png';

/**
 * Toggle between BRT achtergrondkaart and luchtfoto ortho.
 * Swaps the thumbnail image and label so the button always previews
 * what the user would switch TO.
 *
 * @returns {'brt' | 'luchtfoto'} the newly active basemap name
 */
export const toggleBasemap = () => {
  if (!_basemapLayer) return _activeBasemap;

  if (_activeBasemap === 'brt') {
    _basemapLayer.setSource(createLuchtfotoSource());
    _activeBasemap = 'luchtfoto';
  } else {
    _basemapLayer.setSource(createBrtSource());
    _activeBasemap = 'brt';
  }

  const btn   = document.getElementById('basemap-toggle-btn');
  const img   = document.getElementById('basemap-toggle-img');
  const label = btn?.querySelector('.basemap-toggle-label');
  const isLuchtfoto = _activeBasemap === 'luchtfoto';

  if (btn) {
    btn.title = isLuchtfoto ? 'Schakel naar achtergrondkaart' : 'Schakel naar luchtfoto';
    btn.classList.toggle('basemap-toggle--active', isLuchtfoto);
  }
  if (img) {
    // Show the OTHER basemap as a preview thumbnail
    img.src = isLuchtfoto ? BRT_THUMB : LUCHTFOTO_THUMB;
    img.alt = isLuchtfoto ? 'Achtergrondkaart' : 'Luchtfoto';
  }
  if (label) {
    label.textContent = isLuchtfoto ? 'Kaart' : 'Luchtfoto';
  }

  return _activeBasemap;
};
