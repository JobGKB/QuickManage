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
import { loadGpkgBuffer } from './services/gpkgLoader.js';

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

    const handleFile = async (file) => {
      clearError();
      const name = file.name.toLowerCase();
      
      // Validate file is a ZIP file
      if (!name.endsWith(".zip")) { 
        showError("Upload een .zip bestand (shapefile of geodatabase)."); 
        return; 
      }
      
      try {
        setLoading(true);

        // Detect file type: check if ZIP contains a .gdb folder
        const isGdb = await detectGdbZip(file);

        if (isGdb) {
          // GDB flow: upload to FME Server → receive GPKG → render on map
          const gpkgBuffer = await convertGdbToGpkg(file, setLoading);
          await loadGpkgBuffer(gpkgBuffer, closePopup, setLoading);
        } else {
          // Shapefile flow: parse locally in browser
          await loadShapefileZip(file, closePopup, setLoading);
        }

        setLoading(false);
        // Update back button display with loaded filename
        updateBackDropZoneDisplay(file.name);
        switchToMapScreen(() => initializeBackDropZone(handleFile));
      } catch (err) {
        console.error("❌ File processing error:", err);
        setLoading(false);
        showError(err?.message || String(err));
      }
    };

    setupDropZone(dropZone, fileInput, handleFile);
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
