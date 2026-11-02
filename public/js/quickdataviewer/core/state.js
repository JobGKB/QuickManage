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

// Track the name of the currently uploaded file
export let uploadedFileName = '';

// All files whose layers are currently on the map (multiple when shapefile ZIPs are stacked)
export let uploadedFileNames = [];

// Source type of the data currently on the map ('shapefile' or null).
// Only shapefile ZIPs are stacked on top of each other; other formats replace everything.
export let loadedSourceType = null;

export const setLoadedSourceType = (type) => { loadedSourceType = type; };

export const setUploadedFileName = (name) => {
  uploadedFileName = name;
  uploadedFileNames = [name];
};

// Register an additional file; uploadedFileName (used for the export filename) combines all of them
export const addUploadedFileName = (name) => {
  uploadedFileNames.push(name);
  const combined = uploadedFileNames.map(n => n.replace(/\.[^.]+$/, '')).join('_').slice(0, 100);
  uploadedFileName = `${combined}.zip`;
};

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
  uploadedFileName = '';
  uploadedFileNames = [];
  loadedSourceType = null;
  Object.keys(layerVisibility).forEach(key => delete layerVisibility[key]);
  Object.keys(dataLayers).forEach(key => delete dataLayers[key]);
};
