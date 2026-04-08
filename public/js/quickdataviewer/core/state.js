// ===========================
// Application State Management
// ===========================

// Store last known extent of loaded data for zoom-to-data functionality
export let lastDataExtent = null;

// Track visibility state for each layer by name (layer name -> boolean)
export const layerVisibility = {};

// Track currently selected feature for highlighting in blue
export let selectedFeature = null;

// Track OL layer objects by name (layer name -> ol.layer instance)
export const dataLayers = {};

// Update state properties
export const updateLastExtent = (extent) => {
  lastDataExtent = extent;
};

export const setSelectedFeature = (feature) => {
  selectedFeature = feature;
};

export const clearSelection = () => {
  selectedFeature = null;
};

export const resetAllState = () => {
  lastDataExtent = null;
  selectedFeature = null;
  Object.keys(layerVisibility).forEach(key => delete layerVisibility[key]);
  Object.keys(dataLayers).forEach(key => delete dataLayers[key]);
};
