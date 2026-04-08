// ===========================
// UI Helper Functions
// ===========================

// Initialize DOM references
export const initializeDOMReferences = () => {
  // Validate all required elements exist
  const required = [
    "error-box", "error-msg", "loading-overlay", "loading-msg",
    "fileSelectionViewer", "quickDataViewer"
  ];
  for (const id of required) {
    const selector = id.includes("Selection") || id.includes("DataViewer") ? `.${id}` : `#${id}`;
    if (!document.querySelector(selector)) {
      console.warn(`Warning: ${id} element not found`);
    }
  }
};

// Display error message to user
export const showError = (msg) => { 
  const errorBox = document.getElementById("error-box");
  const errorMsg = document.getElementById("error-msg");
  if (errorMsg && errorBox) {
    errorMsg.textContent = msg; 
    errorBox.classList.remove("hidden"); 
  }
};

// Hide error message
export const clearError = () => { 
  const errorBox = document.getElementById("error-box");
  const errorMsg = document.getElementById("error-msg");
  if (errorMsg && errorBox) {
    errorMsg.textContent = ""; 
    errorBox.classList.add("hidden"); 
  }
};

// Show/hide loading overlay with optional message
export const setLoading = (on, msg = "Bestand verwerken…") => { 
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingMsg = document.getElementById("loading-msg");
  const backZoneLoading = document.getElementById("back-zone-loading");
  const backZoneLoadingMsg = document.getElementById("back-zone-loading-msg");

  if (loadingOverlay && loadingMsg) {
    loadingMsg.textContent = msg; 
    loadingOverlay.classList.toggle("hidden", !on); 
  }

  if (backZoneLoading && backZoneLoadingMsg) {
    backZoneLoadingMsg.textContent = msg;
    backZoneLoading.classList.toggle("hidden", !on);
  }
};

// Switch from upload screen to map viewer screen with delayed back-zone initialization
export const switchToMapScreen = (initializeBackDropZone) => { 
  const screen1 = document.querySelector(".fileSelectionViewer");
  const screen2 = document.querySelector(".quickDataViewer");
  if (screen1 && screen2) {
    screen1.style.display = "none"; 
    screen2.style.display = "block"; 
    setTimeout(() => initializeBackDropZone(), 100); 
  }
};
