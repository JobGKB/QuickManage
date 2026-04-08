// ===========================
// Map Initialization & Core Setup
// ===========================
import { RD_EXTENT } from '../config/projections.js';
import { createBasemapSource } from '../config/basemap.js';
import { getFeatureStyle } from './styles.js';
import { updateLastExtent } from './state.js';
import { dataLayers } from './state.js';

export let map = null;

// Keep a reference to the basemap layer so data layers go on top
let basemapLayer = null;

// Initialize map - MUST be called after projections are registered
export const initializeMap = () => {
  console.log("🗺️ Initializing map...");

  basemapLayer = new ol.layer.Tile({ source: createBasemapSource() });

  map = new ol.Map({
    target: "map",
    layers: [basemapLayer],
    view: new ol.View({ 
      projection: "EPSG:28992", 
      center: [170000, 463000], 
      zoom: 14, 
      extent: RD_EXTENT 
    })
  });

  console.log("✓ Map initialized successfully");
  return map;
};

// WebGL flat style for point layers – matches the existing orange/blue scheme
const webglPointStyle = {
  'circle-radius': ['match', ['get', 'selected'], 1, 8, 6],
  'circle-fill-color': ['match', ['get', 'selected'], 1, 'rgba(0, 102, 204, 0.9)', 'rgba(255, 165, 0, 0.75)'],
  'circle-stroke-color': ['match', ['get', 'selected'], 1, 'rgb(0, 51, 153)', 'rgba(255, 120, 0, 1)'],
  'circle-stroke-width': ['match', ['get', 'selected'], 1, 3, 2],
};

// Check if all features in a set are Point or MultiPoint geometries
function isPointOnlyLayer(features) {
  if (!features.length) return false;
  for (let i = 0; i < features.length; i++) {
    const geom = features[i].getGeometry();
    if (!geom) continue;
    const type = geom.getType();
    if (type !== 'Point' && type !== 'MultiPoint') return false;
  }
  return true;
}

/**
 * Add a named data layer to the map.
 * Point-only layers use WebGL for GPU-accelerated rendering.
 * Other layers use VectorImage.
 * @param {string} name - Layer name
 * @param {ol.Feature[]} features - OpenLayers features
 * @returns {{ layer: ol.layer.Base, source: ol.source.Vector }}
 */
export const addDataLayer = (name, features) => {
  const source = new ol.source.Vector();
  source.addFeatures(features);

  let layer;

  // Use WebGL for point-only layers (ol.layer.WebGLVector in OL 10+)
  if (isPointOnlyLayer(features) && ol.layer.WebGLVector) {
    try {
      layer = new ol.layer.WebGLVector({
        source: source,
        style: webglPointStyle,
      });
      console.log(`⚡ Layer "${name}": WebGL points (${features.length} features)`);
    } catch (e) {
      console.warn(`⚠️ WebGL layer failed for "${name}", using VectorImage:`, e);
      layer = null;
    }
  }

  // Fallback: VectorImage for non-point layers or if WebGL unavailable
  if (!layer) {
    layer = new ol.layer.VectorImage({
      source: source,
      style: getFeatureStyle,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
    });
  }

  layer.set('_layerName', name);
  layer.set('_featureSource', source);
  dataLayers[name] = layer;
  map.addLayer(layer);

  return { layer, source };
};

/**
 * Remove all data layers from the map and clear state.
 */
export const clearAllDataLayers = () => {
  Object.values(dataLayers).forEach(layer => {
    map.removeLayer(layer);
  });
  Object.keys(dataLayers).forEach(key => delete dataLayers[key]);
  updateLastExtent(null);
};

/**
 * Get all raw features across all data layers (for export etc.)
 */
export const getAllFeatures = () => {
  const all = [];
  Object.values(dataLayers).forEach(layer => {
    const src = layer.get('_featureSource');
    if (src) all.push(...src.getFeatures());
  });
  return all;
};

/**
 * Get the combined extent of all data layers.
 */
export const getDataExtent = () => {
  const extent = ol.extent.createEmpty();
  Object.values(dataLayers).forEach(layer => {
    const src = layer.get('_featureSource');
    if (src && src.getFeatures().length) {
      ol.extent.extend(extent, src.getExtent());
    }
  });
  return ol.extent.isEmpty(extent) ? null : extent;
};

// Zoom to loaded data extent with padding and max zoom constraint
export const zoomToData = () => { 
  if (!map) {
    console.error("Map not initialized");
    return;
  }
  const e = getDataExtent();
  if (e) {
    updateLastExtent(e.slice());
    map.getView().fit(e, { padding: [40, 40, 40, 40], duration: 250, maxZoom: 10 }); 
  } 
};
