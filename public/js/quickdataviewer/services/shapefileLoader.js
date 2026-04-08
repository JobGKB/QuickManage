// ===========================
// Shapefile Loading Service
// ===========================
import { readZipAsRawGeoJSON } from './fileProcessor.js';
import { detectDataProjection } from './projectionDetector.js';
import { showLoadingLayers, markLayerLoaded } from './layerManager.js';
import { addDataLayer, clearAllDataLayers, zoomToData } from '../core/map.js';

// Load shapefile from ZIP and render on map with all features
export const loadShapefileZip = async (file, closePopupFn, setLoadingFn) => {
  setLoadingFn(true, "Shapefile inlezen…");
  const { layers, prj } = await readZipAsRawGeoJSON(file);
  if (!layers?.length) throw new Error("Geen features gevonden in shapefile.");

  let dataProjection = null;

  clearAllDataLayers();
  showLoadingLayers(layers.map(l => l.name));

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
      addDataLayer(layer.name, olFeatures);
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
};
