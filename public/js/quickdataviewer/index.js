// ===========================
// QuickDataViewer Main Entry Point
// ===========================
// This file orchestrates all modules and initializes the application

import { initializeProjections } from './config/projections.js';
import { initializeDOMReferences, clearError, setLoading, switchToMapScreen, showError } from './ui/helpers.js';
import { initializeMap, map } from './core/map.js';
import { createControlPane } from './ui/controls.js';
import { createPopup } from './ui/popup.js';
import { setupDropZone, initializeBackDropZone, updateBackDropZoneDisplay } from './ui/dropzone.js';
import { loadShapefileZip } from './services/shapefileLoader.js';
import { convertGdbToGpkg } from './services/fmeConverter.js';
import { convertDwgToGpkg } from './services/dwgConverter.js';
import { loadGpkgBuffer } from './services/gpkgLoader.js';
import { initAddressSearch } from './search/addressSearch.js';
import { initAttributeTable, refreshAttributeTable } from './ui/attributeTable.js';
import { toggleBasemap } from './config/basemap.js';
import { setUploadedFileName, addUploadedFileName, uploadedFileNames } from './core/state.js';

// Inspect ZIP contents to determine if it contains a File Geodatabase (.gdb folder)
async function detectGdbZip(file) {
  const zipBuf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(zipBuf);
  const paths = Object.keys(zip.files);
  return paths.some(p => /\.gdb\//i.test(p) || /\.gdb$/i.test(p));
}

// Initialize application
async function initializeApp() {
  try {
    console.log("🚀 Initializing QuickDataViewer...");
    
    // STEP 1: Initialize projections FIRST
    initializeProjections();
    console.log("✓ Projections initialized");

    // STEP 2: Initialize map AFTER projections
    initializeMap();
    console.log("✓ Map initialized");

    // STEP 3: Initialize DOM references
    initializeDOMReferences();
    console.log("✓ DOM references checked");

    // STEP 4: Create and attach popup overlay
    const closePopup = createPopup(map);
    console.log("✓ Popup created");

    // STEP 5: Create and attach control panel
    map.addControl(createControlPane(closePopup));
    console.log("✓ Control panel created");

    // STEP 5b: Initialize address search
    initAddressSearch();
    console.log("✓ Address search initialized");

    // STEP 5c: Initialize attribute table
    initAttributeTable(map);
    console.log("✓ Attribute table initialized");

    // STEP 5d: Wire basemap toggle button
    const basemapToggleBtn = document.getElementById('basemap-toggle-btn');
    if (basemapToggleBtn) {
      basemapToggleBtn.addEventListener('click', () => toggleBasemap());
    }
    console.log("✓ Basemap toggle initialized");

    // STEP 6: Setup main drop zone
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");

    if (!dropZone) {
      throw new Error("Drop zone element (#drop-zone) not found in DOM");
    }
    if (!fileInput) {
      throw new Error("File input element (#file-input) not found in DOM");
    }

    console.log("✓ Drop zone elements found");

    // Load one file onto the map. Returns true when it was stacked on existing shapefile layers.
    // With shapefileOnly (multi-file upload) only shapefile ZIPs are accepted.
    const loadFile = async (file, { shapefileOnly = false } = {}) => {
      const name = file.name.toLowerCase();

      if (shapefileOnly && !name.endsWith(".zip")) {
        throw new Error("alleen shapefiles (.zip) kunnen meerdere tegelijk worden geladen.");
      }
      // Validate file is a ZIP, DWG or GPKG file
      if (!name.endsWith(".zip") && !name.endsWith(".dwg") && !name.endsWith(".gpkg")) { 
        throw new Error("Upload een .zip bestand (shapefile of geodatabase), een .dwg bestand of een .gpkg bestand."); 
      }

      let appended = false;
      if (name.endsWith(".gpkg")) {
        // GeoPackage flow: parse locally in browser → render on map
        const gpkgBuffer = await file.arrayBuffer();
        await loadGpkgBuffer(gpkgBuffer, closePopup, setLoading);
      } else if (name.endsWith(".dwg")) {
        // DWG flow: upload to FME Server → receive GPKG → render on map
        const gpkgBuffer = await convertDwgToGpkg(file, setLoading);
        await loadGpkgBuffer(gpkgBuffer, closePopup, setLoading);
      } else {
        // Detect file type: check if ZIP contains a .gdb folder
        const isGdb = await detectGdbZip(file);

        if (isGdb) {
          if (shapefileOnly) {
            throw new Error("een geodatabase (.zip) kan niet samen met andere bestanden worden geladen.");
          }
          // GDB flow: upload to FME Server → receive GPKG → render on map
          const gpkgBuffer = await convertGdbToGpkg(file, setLoading);
          await loadGpkgBuffer(gpkgBuffer, closePopup, setLoading);
        } else {
          // Shapefile flow: parse locally in browser (stacks on top of previously loaded shapefiles)
          ({ appended } = await loadShapefileZip(file, closePopup, setLoading));
        }
      }

      // Update loaded filename(s) in header and back button display
      if (appended) addUploadedFileName(file.name);
      else setUploadedFileName(file.name);
      const fileLabel = uploadedFileNames.join(', ');
      updateBackDropZoneDisplay(fileLabel);
      const fileNameEl = document.getElementById('fileName');
      if (fileNameEl) fileNameEl.textContent = "Bestand: " + fileLabel;
      return appended;
    };

    // Handle one or more uploaded files; multiple shapefile ZIPs are loaded one after another
    const handleFiles = async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      clearError();

      const multiple = files.length > 1;
      const errors = [];
      let loadedAny = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          setLoading(true, multiple ? `Bestand ${i + 1} van ${files.length} laden: ${file.name}…` : undefined);
          await loadFile(file, { shapefileOnly: multiple });
          loadedAny = true;
        } catch (err) {
          console.error(`❌ File processing error (${file.name}):`, err);
          const msg = err?.message || String(err);
          errors.push(multiple ? `${file.name}: ${msg}` : msg);
        }
      }

      setLoading(false);
      if (loadedAny) {
        switchToMapScreen(() => initializeBackDropZone(handleFiles));
        // If the attribute table is open, refresh it to reflect the newly loaded layers
        refreshAttributeTable();
      }
      if (errors.length) showError(errors.join(" • "));
    };

    setupDropZone(dropZone, fileInput, handleFiles);
    console.log("✓ Main drop zone initialized");
    console.log("🎉 QuickDataViewer ready!");
    
  } catch (err) {
    console.error("❌ Initialization error:", err);
    console.error("Stack:", err.stack);
    showError("Setup error: " + err.message);
  }
}

// Start application immediately
initializeApp();
