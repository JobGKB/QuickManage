// ===========================
// Shapefile Loading Service
// ===========================
import { readZipAsRawGeoJSON } from './fileProcessor.js';
import { detectDataProjection } from './projectionDetector.js';
import { showLoadingLayers, markLayerLoaded, renameLayer, getLayerRowNames } from './layerManager.js';
import { addDataLayer, clearAllDataLayers, zoomToData } from '../core/map.js';
import { dataLayers, loadedSourceType, setLoadedSourceType } from '../core/state.js';

/**
 * Assign unique layer names for a new shapefile ZIP, taking already loaded layers into account.
 * When a name occurs more than once, every copy gets a numeric suffix (_0, _1, _2, …),
 * including the already loaded layer, which is renamed from e.g. "wegen" to "wegen_0".
 * @param {string[]} baseNames - Original layer names from the new ZIP
 * @returns {{ names: {name: string, index: number|null}[], renames: {from: string, to: string, index: number}[] }}
 */
const assignLayerNames = (baseNames) => {
  const taken = new Set([...Object.keys(dataLayers), ...getLayerRowNames()]);

  const existingByBase = new Map();
  for (const [name, layer] of Object.entries(dataLayers)) {
    const base = layer.get('_baseName') ?? name;
    if (!existingByBase.has(base)) existingByBase.set(base, []);
    existingByBase.get(base).push({ name, layer });
  }

  const newCount = new Map();
  baseNames.forEach(b => newCount.set(b, (newCount.get(b) || 0) + 1));

  const nextIndex = new Map();
  const claimIndex = (base) => {
    let i = nextIndex.get(base) ?? 0;
    while (taken.has(`${base}_${i}`)) i++;
    nextIndex.set(base, i + 1);
    taken.add(`${base}_${i}`);
    return { name: `${base}_${i}`, index: i };
  };

  const renames = [];
  for (const [base, count] of newCount) {
    const existing = existingByBase.get(base) || [];
    const maxIdx = existing.reduce((m, e) => Math.max(m, e.layer.get('_dupIndex') ?? -1), -1);
    nextIndex.set(base, maxIdx + 1);

    // Already loaded layer without suffix becomes "<base>_<n>" now that a duplicate arrives
    if (existing.length + count > 1) {
      for (const e of existing) {
        if (e.layer.get('_dupIndex') != null) continue;
        const { name, index } = claimIndex(base);
        taken.delete(e.name);
        renames.push({ from: e.name, to: name, index });
      }
    }
  }

  const names = baseNames.map((base) => {
    const total = (existingByBase.get(base)?.length || 0) + newCount.get(base);
    if (total === 1 && !taken.has(base)) {
      taken.add(base);
      return { name: base, index: null };
    }
    return claimIndex(base);
  });

  return { names, renames };
};

// Load shapefile from ZIP and render on map with all features.
// If the map already shows shapefile data, the new layers are added on top of it.
export const loadShapefileZip = async (file, closePopupFn, setLoadingFn) => {
  setLoadingFn(true, "Shapefile inlezen…");
  const { layers, prj } = await readZipAsRawGeoJSON(file);
  if (!layers?.length) throw new Error("Geen features gevonden in shapefile.");

  let dataProjection = null;

  const append = loadedSourceType === 'shapefile' && Object.keys(dataLayers).length > 0;
  if (!append) clearAllDataLayers();
  setLoadedSourceType('shapefile');

  const baseNames = layers.map(l => (l.name == null ? '' : String(l.name)));
  const { names, renames } = assignLayerNames(baseNames);
  for (const { from, to, index } of renames) {
    renameLayer(from, to);
    dataLayers[to]?.set('_dupIndex', index);
  }
  layers.forEach((l, i) => {
    l.baseName = baseNames[i];
    l.dupIndex = names[i].index;
    l.name = names[i].name;
  });

  showLoadingLayers(layers.map(l => l.name), { append });

  for (const layer of layers) {
    try {
      if (!layer.geojson?.features?.length) {
        console.warn(`⚠️ Layer "${layer.name}": 0 features, skipping`);
        markLayerLoaded(layer.name, 0);
        continue;
      }
      if (!dataProjection) dataProjection = detectDataProjection(layer.geojson, prj);

      console.log(`📐 Layer "${layer.name}": projection=${dataProjection}, features=${layer.geojson.features.length}`);

      const olFeatures = new ol.format.GeoJSON().readFeatures(layer.geojson, {
        dataProjection,
        featureProjection: "EPSG:28992"
      });
      for (const f of olFeatures) {
        f.set('_layerName', layer.name);
      }

      if (!olFeatures.length) {
        console.warn(`⚠️ Layer "${layer.name}": readFeatures returned 0 OL features`);
        markLayerLoaded(layer.name, 0);
        continue;
      }
      const { layer: olLayer } = addDataLayer(layer.name, olFeatures);
      olLayer.set('_baseName', layer.baseName);
      olLayer.set('_dupIndex', layer.dupIndex);
      markLayerLoaded(layer.name, layer.geojson.features.length);
      console.log(`✅ Layer "${layer.name}": ${olFeatures.length} OL features added`);
    } catch (err) {
      console.error(`❌ Error loading layer "${layer.name}":`, err);
      markLayerLoaded(layer.name, 0);
    }

    // Yield to browser so spinner updates render
    await new Promise(r => setTimeout(r, 0));
  }

  closePopupFn();
  zoomToData();
  return { appended: append };
};
