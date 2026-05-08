// ===========================
// Feature Search — zoom + highlight
// ===========================
import { map } from '../../core/map.js';
import { dataLayers } from '../../core/state.js';

let highlightedFeature = null;
let highlightedLayerName = null;

/**
 * Trigger a redraw of a layer after we mutate a feature property
 * that affects styling. WebGLVector reacts on feature change events;
 * VectorImage needs an explicit changed() call.
 */
const refreshLayer = (layerName) => {
  const layer = dataLayers[layerName];
  if (!layer) return;
  const src = layer.get('_featureSource');
  src?.changed();
  layer.changed();
};

/**
 * Clear the currently highlighted feature (if any).
 */
export const clearHighlight = () => {
  if (highlightedFeature) {
    highlightedFeature.set('selected', 0);
    if (highlightedLayerName) refreshLayer(highlightedLayerName);
  }
  highlightedFeature = null;
  highlightedLayerName = null;
};

/**
 * Highlight a feature and zoom the map view to its geometry.
 * Only one feature is highlighted at a time — any previous one is cleared.
 *
 * @param {string} layerName
 * @param {ol.Feature} feature
 */
export const zoomAndHighlight = (layerName, feature) => {
  if (!feature) return;
  clearHighlight();

  feature.set('selected', 1);
  highlightedFeature = feature;
  highlightedLayerName = layerName;
  refreshLayer(layerName);

  const geom = feature.getGeometry();
  if (!geom) return;

  const view = map.getView();
  const type = geom.getType();
  if (type === 'Point') {
    view.animate({ center: geom.getCoordinates(), zoom: 18, duration: 400 });
  } else {
    const extent = geom.getExtent();
    view.fit(extent, {
      padding: [60, 60, 60, 60],
      maxZoom: 19,
      duration: 400,
    });
  }
};
