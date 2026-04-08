// ===========================
// Control Panel Setup
// ===========================
import { map, clearAllDataLayers, getAllFeatures } from '../core/map.js';
import { lastDataExtent, resetAllState } from '../core/state.js';
import { showError } from './helpers.js';
import { resetBackDropZoneDisplay } from './dropzone.js';
import { exportToExcel } from '../services/exporter.js';

// Creates the control panel with event listeners for zoom, clear, and export
export const createControlPane = (closePopupFn) => {
  const container = document.getElementById("controlpanel_dataviewer");
  
  if (!container) {
    console.error("Control panel container not found");
    return new ol.control.Control({ element: document.createElement("div") });
  }
  
  // Event delegation: handle all button clicks on control panel
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    
    const action = btn.getAttribute("data-action");
    if (action === "zoom") {
      if (lastDataExtent) {
        map.getView().fit(lastDataExtent, { padding: [40, 40, 40, 40], duration: 250, maxZoom: 14 });
      } else {
        showError("Geen layer geladen om naar te zoomen.");
      }
    } else if (action === "clear") {
      clearAllDataLayers();
      closePopupFn?.();
      resetAllState();
      const layerNames = document.getElementById("layerNames");
      if (layerNames) layerNames.style.display = "none";
      resetBackDropZoneDisplay();
    } else if (action === "export") {
      exportToExcel();
    }
  });

  return new ol.control.Control({ element: container });
};
