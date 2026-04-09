// ===========================
// 0) Register projections & Setup
// ===========================
// Register EPSG:28992 (RD - Dutch coordinate system) projection using Proj4.js
proj4.defs("EPSG:28992", "+proj=sterea +lat_0=52.1561605555556 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.4171,50.3319,465.5524,1.9342,-1.6677,9.1019,4.0725 +units=m +no_defs");
ol.proj.proj4.register(proj4);

// Set map extent boundaries (Netherlands RD bounds in meters)
const RD_EXTENT = [-285401.92, 22598.08, 595401.92, 903401.92];
ol.proj.get("EPSG:28992").setExtent(RD_EXTENT);

// ===========================
// DOM references to all UI elements
// ===========================
const dropZone = document.getElementById("drop-zone"); // Drop zone for initial file upload
const fileInput = document.getElementById("file-input"); // Hidden file input for main upload
const errorBox = document.getElementById("error-box"); // Error message container
const errorMsg = document.getElementById("error-msg"); // Error message text element
const loadingOverlay = document.getElementById("loading-overlay"); // Loading spinner container
const loadingMsg = document.getElementById("loading-msg"); // Loading message text
const screen1 = document.querySelector(".fileSelectionViewer"); // Upload screen (initial view)
const screen2 = document.querySelector(".quickDataViewer"); // Map viewer screen

// ===========================
// UI helper functions for user feedback
// ===========================
// Display error message to user
const showError = (msg) => { errorMsg.textContent = msg; errorBox.classList.remove("hidden"); };
// Hide error message
const clearError = () => { errorMsg.textContent = ""; errorBox.classList.add("hidden"); };
// Show/hide loading overlay with optional message
const setLoading = (on, msg = "Bestand verwerken…") => { loadingMsg.textContent = msg; loadingOverlay.classList.toggle("hidden", !on); };
// Switch from upload screen to map viewer screen with delayed back-zone initialization
const switchToMapScreen = () => { screen1.style.display = "none"; screen2.style.display = "block"; setTimeout(() => initializeBackDropZone(), 100); };

// ===========================
// Basemap configuration - PDOK (Dutch government map service)
// ===========================
// WMTS (Web Map Tile Service) source for background map tiles in RD projection
const pdokWmtsSource = new ol.source.WMTS({
  url: "https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0", // PDOK service endpoint
  layer: "standaard", // Standard map variant (options: grijs, pastel, water)
  matrixSet: "EPSG:28992", // Use RD projection for tiles
  format: "image/png", // PNG format for tile images
  style: "default", // Default map styling
  projection: "EPSG:28992", // RD projection
  tileGrid: new ol.tilegrid.WMTS({
    origin: [-285401.92, 903401.92], // Top-left of RD extent
    // Resolution levels from largest (3440.64m) to smallest (0.21m)
    resolutions: [3440.64, 1720.32, 860.16, 430.08, 215.04, 107.52, 53.76, 26.88, 13.44, 6.72, 3.36, 1.68, 0.84, 0.42, 0.21],
    matrixIds: ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14"] // WMTS zoom level IDs
  }),
  wrapX: false // Don't wrap tiles horizontally (RD projection)
});

// ===========================
// Vector feature styling - appearance of shapefile features on map
// ===========================
// Returns blue style for selected features, orange for visible, null for hidden ones
const getFeatureStyle = (feature) => {
  if (feature.get('_selected') === true) {
    // Blue style with higher opacity for selected features
    return new ol.style.Style({
      fill: new ol.style.Fill({ color: "rgba(0, 102, 204, 0.8)" }), // Bright blue fill
      stroke: new ol.style.Stroke({ color: "rgb(0, 51, 153)", width: 3 }), // Dark blue border, thicker
      image: new ol.style.Circle({ radius: 8, fill: new ol.style.Fill({ color: "rgba(0, 102, 204, 0.9)" }), stroke: new ol.style.Stroke({ color: "rgb(0, 51, 153)", width: 3 }) })
    });
  }
  // Orange style for normal visible features
  return feature.get('_visible') !== false ? new ol.style.Style({
    fill: new ol.style.Fill({ color: "rgba(231, 151, 3, 0.58)" }), // Orange fill for polygons
    stroke: new ol.style.Stroke({ color: "rgb(173, 81, 1)", width: 2 }), // Dark orange border
    image: new ol.style.Circle({ radius: 6, fill: new ol.style.Fill({ color: "rgba(255, 165, 0, 0.75)" }), stroke: new ol.style.Stroke({ color: "rgba(255, 120, 0, 1)", width: 2 }) })
  }) : null; // Return null to hide feature on map
};

// ===========================
// Vector layer setup for displaying shapefile features
// ===========================
const vectorSource = new ol.source.Vector(); // Data source for vector features
// Vector layer that renders features from source with dynamic styling
const vectorLayer = new ol.layer.Vector({ source: vectorSource, style: getFeatureStyle });
// ===========================
// Initialize OpenLayers map with basemap and vector layer
// ===========================
const map = new ol.Map({
  target: "map", // Attach to #map HTML element
  layers: [new ol.layer.Tile({ source: pdokWmtsSource }), vectorLayer], // Basemap + vector layer
  // View configuration with RD projection and Netherlands center point
  view: new ol.View({ projection: "EPSG:28992", center: [170000, 463000], zoom: 14, extent: RD_EXTENT })
});

// ===========================
// Application state management
// ===========================
// Store last known extent of loaded data for zoom-to-data functionality
let lastDataExtent = null;
// Track visibility state for each layer by name (layer name -> boolean)
const layerVisibility = {};
// Track currently selected feature for highlighting in blue
let selectedFeature = null;
// Update stored extent when features are added to the map
const updateLastExtent = () => { const e = vectorSource.getExtent(); lastDataExtent = (e && isFinite(e[0]) && isFinite(e[2])) ? e.slice() : null; };
vectorSource.on("addfeature", updateLastExtent); // Update extent on feature add
vectorSource.on("clear", () => (lastDataExtent = null)); // Clear extent when map is cleared

// ===========================
// Control panel setup - buttons for map interactions
// ===========================
// Creates the control panel with event listeners for zoom, clear, and export
const createControlPane = () => {
  const container = document.getElementById("controlpanel_dataviewer"); // Get control panel element
  let basemap = "standaard"; // Track current basemap variant
  
  // Event delegation: handle all button clicks on control panel
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]"); // Find clicked button
    if (!btn) return;
    
    const action = btn.getAttribute("data-action");
    if (action === "zoom") {
      if (lastDataExtent) {
        map.getView().fit(lastDataExtent, { padding: [40, 40, 40, 40], duration: 250, maxZoom: 14 });
      } else {
        showError("Geen layer geladen om naar te zoomen.");
      }
    } else if (action === "clear") {
      vectorSource.clear(true); // Remove all features from map
      closePopup?.(); // Close any open attribute popup
      lastDataExtent = null; // Reset stored extent
      selectedFeature = null; // Clear selection state
      // Reset all layer visibility states when clearing the map
      Object.keys(layerVisibility).forEach(key => delete layerVisibility[key]);
      document.getElementById("layerNames").style.display = "none"; // Hide layer panel
      // Reset back drop zone to upload prompt
      resetBackDropZoneDisplay();
    } else if (action === "export") {
      exportToExcel();
    }
  });

  return new ol.control.Control({ element: container });
};

map.addControl(createControlPane()); // Add control panel to map

// ===========================
// Feature popup overlay showing attributes on click
// ===========================
// Creates interactive popup displayed when clicking on features
const createPopup = () => {
  const popupEl = document.createElement("div");
  Object.assign(popupEl.style, { position: "absolute", minWidth: "400px", maxWidth: "450px", background: "white", border: "1px solid rgba(0,0,0,0.25)", borderRadius: "10px", boxShadow: "0 6px 18px rgba(0,0,0,0.18)", padding: "10px 12px", fontSize: "13px", lineHeight: "1.35", pointerEvents: "auto" });
  
  const closer = document.createElement("div");
  closer.textContent = "×";
  Object.assign(closer.style, { position: "absolute", top: "6px", right: "10px", cursor: "pointer", fontSize: "18px", opacity: "0.6" });
  closer.onmouseenter = () => (closer.style.opacity = "1");
  closer.onmouseleave = () => (closer.style.opacity = "0.6");
  popupEl.appendChild(closer);

  const title = document.createElement("div");
  title.style.cssText = "font-weight: 600; margin-right: 18px;";
  title.textContent = "Attributes";
  popupEl.appendChild(title);

  const content = document.createElement("div");
  content.style.cssText = "margin-top: 8px; max-height: 400px; overflow: auto;";
  popupEl.appendChild(content);

  document.body.appendChild(popupEl);

  const overlay = new ol.Overlay({ element: popupEl, autoPan: true, autoPanAnimation: { duration: 200 }, offset: [0, -10] });
  map.addOverlay(overlay);

  const closePopup = () => {
    // Clear selection when popup closes
    if (selectedFeature) {
      selectedFeature.set('_selected', false);
      selectedFeature = null;
      vectorLayer.changed(); // Trigger redraw to remove blue highlight
    }
    overlay.setPosition(undefined);
  };
  closer.addEventListener("click", closePopup);

  map.on("pointermove", (evt) => (map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel) ? "pointer" : ""));
  map.on("singleclick", (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (!feature) { closePopup(); return; }
    
    // Clear previous selection
    if (selectedFeature) {
      selectedFeature.set('_selected', false);
    }
    // Set new feature as selected and highlight in blue
    selectedFeature = feature;
    feature.set('_selected', true);
    vectorLayer.changed(); // Trigger redraw to show blue highlight
    
    const props = { ...feature.getProperties() };
    delete props.geometry;
    delete props._visible;
    delete props._selected;
    const keys = Object.keys(props);

    title.textContent = keys.length ? "Attributes" : "No attributes";
    content.innerHTML = "";

    if (keys.length) {
      const table = document.createElement("table");
      table.style.cssText = "width: 100%; border-collapse: collapse;";
      // Create table rows for each feature property (key-value pairs)
      keys.forEach(k => {
        const tr = document.createElement("tr");
        const tdK = document.createElement("td");
        tdK.textContent = k;
        tdK.style.cssText = "font-weight: 600; padding: 4px 6px; border-bottom: 1px solid rgba(0,0,0,0.08); vertical-align: top; width: 45%;";
        const tdV = document.createElement("td");
        tdV.textContent = props[k] ?? "";
        tdV.style.cssText = "padding: 4px 6px; border-bottom: 1px solid rgba(0,0,0,0.08); vertical-align: top;";
        tr.appendChild(tdK);
        tr.appendChild(tdV);
        table.appendChild(tr);
      });
      content.appendChild(table);
    } else {
      content.textContent = "No attributes found on this feature.";
    }

    overlay.setPosition(evt.coordinate);
  });

  return closePopup;
};

const closePopup = createPopup();

// ===========================
// Map zoom functions for fitting data
// ===========================
// Zoom to loaded data extent with padding and max zoom constraint
const zoomToData = () => { 
  const e = vectorSource.getExtent(); 
  if (e && isFinite(e[0]) && isFinite(e[1]) && isFinite(e[2]) && isFinite(e[3])) { 
    map.getView().fit(e, { padding: [40, 40, 40, 40], duration: 250, maxZoom: 10 }); 
  } 
  updateLastExtent();
};

// ===========================
// File processing - Extract and parse shapefile ZIP
// ===========================
// Extract all shapefiles from ZIP archive and return as GeoJSON with layer info
const readZipAsRawGeoJSON = async (file) => {
  // Convert file to array buffer and load as ZIP archive
  const zipBuf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(zipBuf);
  
  // Find all .shp files in ZIP (can be multiple layers)
  const shpNames = Object.keys(zip.files).filter(n => n.toLowerCase().endsWith(".shp"));
  if (shpNames.length === 0) throw new Error("Zip mist .shp of .dbf.");
  
  // Extract projection file if available (helps detect coordinate system)
  const prjFile = Object.keys(zip.files).find(n => n.toLowerCase().endsWith(".prj"));
  const prjTxt = prjFile ? await zip.files[prjFile].async("string") : "";
  const layers = [];

  for (const shpName of shpNames) {
    const baseName = shpName.split(/[\\/]/).pop().replace(/\.shp$/i, "");
    const dbfName = Object.keys(zip.files).find(n => n.toLowerCase().endsWith(".dbf") && n.split(/[\\/]/).pop().replace(/\.dbf$/i, "").toLowerCase() === baseName.toLowerCase());
    if (!dbfName) continue;

    const shpBuf = await zip.files[shpName].async("arraybuffer");
    const dbfBuf = await zip.files[dbfName].async("arraybuffer");
    const geojson = window.shp.combine([window.shp.parseShp(shpBuf), window.shp.parseDbf(dbfBuf)]);

    layers.push({ name: baseName, geojson, featureCount: geojson?.features?.length || 0 });
  }

  return { layers, prj: prjTxt };
};;

// Helper: Extract first [x, y] coordinate pair from GeoJSON features
// Used for coordinate system detection based on coordinate ranges
const findFirstCoordPair = (fc) => {
  // Recursively search nested coordinate arrays for a [x, y] pair
  const findPair = (coords) => {
    if (!Array.isArray(coords)) return null;
    // Check if this is a [x, y] pair (two numbers)
    if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") return coords;
    // Recursively search nested arrays
    for (const c of coords) { const p = findPair(c); if (p) return p; }
    return null;
  };
  // Get first feature and extract coordinates from geometry
  return findPair(fc.features?.[0]?.geometry?.coordinates);
};

// ===========================
// Projection detection - determine if data is in RD or lat/lon
// ===========================
// Detects coordinate system by checking PRJ file keywords and coordinate ranges
const detectDataProjection = (fc, prjText) => {
  const first = findFirstCoordPair(fc); // Get first coordinate from data
  // Check if PRJ file mentions Dutch coordinate system keywords
  const prjSaysRD = (prjText || "").toLowerCase().match(/rd_new|amersfoort|double_stereographic|bessel_1841|sterea/);
  
  if (first) {
    const [x, y] = first;
    // RD: x: 0-300000, y: 250000-700000 (Dutch bounds)
    if ((x > 0 && x < 300000 && y > 250000 && y < 700000) || prjSaysRD) return "EPSG:28992";
    // WGS84: x: -180 to 180, y: -90 to 90 (lat/lon)
    if (x >= -180 && x <= 180 && y >= -90 && y <= 90) return "EPSG:4326";
  }
  return prjSaysRD ? "EPSG:28992" : "EPSG:4326";
};

// ===========================
// Display layer list with checkboxes for visibility toggle
// ===========================
// Creates HTML checkboxes for each loaded layer showing name and feature count
const displayLayerInfo = (layers) => {
  const div = document.getElementById("layerNames");
  if (!layers?.length) { div.style.display = "none"; return; }
  
  // Build HTML for layer list with checkboxes
  div.innerHTML = '<strong>Lagen geladen:</strong><div class="layerToggler">Alle lagen: <button id="layersOn">Aan</button><button id="layersOff">Uit</button></div><br/>' + layers.map(l => {
    const id = `layer-${l.name}`;
    return `<div style="padding: 6px 0; font-size: 12px; display: flex; align-items: flex-start; gap: 6px; min-width: 0;"><input type="checkbox" id="${id}" data-layer="${l.name}" ${layerVisibility[l.name] !== false ? 'checked' : ''} style="cursor: pointer; flex-shrink: 0; margin-top: 2px;" /><label for="${id}" class="layer-label">📍 <strong>${l.name}</strong> (${l.featureCount})</label></div>`;
  }).join("");
  div.style.display = "block";

  div.querySelector('#layersOn')?.addEventListener('click', () => {
    Object.keys(layerVisibility).forEach(name => { layerVisibility[name] = true; });
    div.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; cb.dispatchEvent(new Event('change')); });
  });
  div.querySelector('#layersOff')?.addEventListener('click', () => {
    Object.keys(layerVisibility).forEach(name => { layerVisibility[name] = false; });
    div.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; cb.dispatchEvent(new Event('change')); });
  });

  // Attach change event listeners to all layer visibility checkboxes
  div.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', (e) => {
    layerVisibility[e.target.dataset.layer] = e.target.checked;
    vectorSource.getFeatures().forEach(f => {
      if (f.get('_layerName') === e.target.dataset.layer) f.set('_visible', e.target.checked);
    });
    vectorLayer.changed();
  }));
};

// ===========================
// Load shapefile from ZIP and render on map with all features
// ===========================
// Extracts layers, detects projection, tags features with metadata, and displays
const loadShapefileZip = async (file) => {
  setLoading(true, "Shapefile inlezen…");
  const { layers, prj } = await readZipAsRawGeoJSON(file);
  if (!layers?.length) throw new Error("Geen features gevonden in shapefile.");

  const allFeatures = [];
  let dataProjection = null;

  for (const layer of layers) {
    if (!layer.geojson?.features?.length) continue;
    if (!dataProjection) dataProjection = detectDataProjection(layer.geojson, prj);

    // Tag each feature with its layer name and set visibility, then add to collection
    new ol.format.GeoJSON().readFeatures(layer.geojson, { dataProjection, featureProjection: "EPSG:28992" }).forEach(f => {
      f.set('_layerName', layer.name);
      f.set('_visible', true);
      allFeatures.push(f);
    });
  }

  if (!allFeatures.length) throw new Error("Geen features gevonden in shapefile.");
  vectorSource.clear(true);
  vectorSource.addFeatures(allFeatures);
  displayLayerInfo(layers);
  closePopup();
  zoomToData();
};

// ===========================
// Main file upload handler - validates and processes shapefile ZIP
// ===========================
// Entry point for file uploads from drop zones or file picker controls
const handleFile = async (file) => {
  clearError();
  
  // Validate file is a ZIP file
  if (!file.name.toLowerCase().endsWith(".zip")) { 
    showError("Upload een .zip shapefile."); 
    return; 
  }
  
  try {
    setLoading(true);
    vectorSource.clear(true);
    await loadShapefileZip(file);
    setLoading(false);
    // Update back button display with loaded filename
    updateBackDropZoneDisplay(file.name);
    switchToMapScreen();
  } catch (err) {
    console.error(err);
    setLoading(false);
    showError(err?.message || String(err));
  }
};

// ===========================
// Export functionality - Convert map data to Excel workbook
// ===========================
// Sanitize sheet name: remove invalid Excel characters and truncate to 31 chars
const sanitizeSheetName = (name) => name.replace(/[\[\]:*?/\\]/g, '_').substring(0, 31);
// Export visible features to Excel workbook with one sheet per layer
const exportToExcel = () => {
  // Check XLSX library is loaded
  if (typeof XLSX === 'undefined') { showError("Excel library is nog niet geladen."); return; }
  const features = vectorSource.getFeatures();
  if (!features.length) { showError("Geen data om te exporteren."); return; }

  const layerData = {};
  // Collect visible features grouped by layer, extracting only attribute properties
  features.forEach(f => {
    const visible = f.get('_visible') !== false;
    if (!visible) return;
    const layer = f.get('_layerName') || 'Default';
    if (!layerData[layer]) layerData[layer] = [];
    const props = { ...f.getProperties() };
    delete props.geometry;
    delete props._layerName;
    delete props._visible;
    layerData[layer].push(props);
  });

  try {
    const workbook = XLSX.utils.book_new();
    const usedNames = new Set();
    // Create Excel worksheet for each layer, handling duplicate sheet names
    Object.entries(layerData).forEach(([name, data]) => {
      if (!data.length) return;
      let finalName = sanitizeSheetName(name);
      let counter = 1;
      while (usedNames.has(finalName)) finalName = sanitizeSheetName(name.slice(0, 28) + '_' + counter++);
      usedNames.add(finalName);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), finalName);
    });
    XLSX.writeFile(workbook, `quickdataviewer_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    console.error(err);
    showError("Er is een fout opgetreden bij het exporteren naar Excel.");
  }
};

// ===========================
// Drop zone event setup - reusable for multiple feedback zones
// ===========================
// Attaches click, keyboard, drag, and file input listeners to a drop zone
const setupDropZone = (zone, input, handler) => {
  // Click handler: open file picker when clicking zone
  zone.addEventListener("click", () => input.click());
  
  // Keyboard handler: open file picker on Enter or Space key
  zone.addEventListener("keydown", (e) => { 
    if (["Enter", " "].includes(e.key)) { 
      e.preventDefault(); 
      input.click(); 
    } 
  });
  
  // Drag over: add highlight when dragging files over zone
  zone.addEventListener("dragover", (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    zone.classList.add("drag-over");
  });
  
  // Drag leave: remove highlight when leaving zone
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  
  // Drop: process dropped file(s)
  zone.addEventListener("drop", (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    zone.classList.remove("drag-over"); 
    if (e.dataTransfer.files[0]) handler(e.dataTransfer.files[0]); 
  });
  
  // File input change: process selected file from picker
  input.addEventListener("change", () => { 
    if (input.files[0]) { 
      handler(input.files[0]); 
      input.value = ""; 
    } 
  });
};

setupDropZone(dropZone, fileInput, handleFile); // Initialize main upload drop zone

// ===========================
// Back button drop zone display management
// ===========================
// Update back drop zone to show loaded filename instead of upload prompt
const updateBackDropZoneDisplay = (fileName) => {
  const uploadPrompt = document.getElementById("back-zone-upload-prompt");
  const fileDisplay = document.getElementById("back-zone-file-display");
  const fileNameEl = document.getElementById("back-zone-file-name");
  
  // Hide upload prompt and show file display
  if (uploadPrompt) uploadPrompt.style.display = "none";
  if (fileDisplay) fileDisplay.style.display = "block";
  if (fileNameEl) fileNameEl.textContent = fileName; // Show the filename
};

// Reset back drop zone to show upload prompt when clearing data
const resetBackDropZoneDisplay = () => {
  const uploadPrompt = document.getElementById("back-zone-upload-prompt");
  const fileDisplay = document.getElementById("back-zone-file-display");
  
  // Show upload prompt and hide file display
  if (uploadPrompt) uploadPrompt.style.display = "block";
  if (fileDisplay) fileDisplay.style.display = "none";
};

// ===========================
// Back button drop zone initialization
// ===========================
// Enables file replacement directly from map screen using back button
const initializeBackDropZone = () => {
  const zone = document.getElementById("back-drop-zone");
  const input = document.getElementById("back-file-input");
  
  // Validate elements exist before setting up event listeners
  if (!zone || !input) { 
    console.error("Back drop zone elements not found!"); 
    return; 
  }
  
  // Reuse drop zone setup for back button functionality
  setupDropZone(zone, input, handleFile);
};