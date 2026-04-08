// ===========================
// Drop Zone Setup & Management
// ===========================

// Attaches click, keyboard, drag, and file input listeners to a drop zone
export const setupDropZone = (zone, input, handler) => {
  if (!zone || !input) {
    console.error("Drop zone or input element missing");
    return;
  }

  // Prevent duplicate listeners when a zone is initialized more than once.
  if (zone.dataset.dropZoneBound === "true") {
    return;
  }
  zone.dataset.dropZoneBound = "true";

  // Click handler: open file picker when clicking zone
  zone.addEventListener("click", () => {
    console.log("Drop zone clicked, opening file picker");
    input.click();
  });
  
  // Keyboard handler: open file picker on Enter or Space key
  zone.addEventListener("keydown", (e) => { 
    if (["Enter", " "].includes(e.key)) { 
      e.preventDefault();
      console.log("Drop zone keyboard activated, opening file picker");
      input.click(); 
    } 
  });
  
  // Drag over: add highlight when dragging files over zone
  zone.addEventListener("dragover", (e) => { 
    e.preventDefault(); 
    e.stopPropagation();
    console.log("Drag over event");
    zone.classList.add("drag-over");
  });
  
  // Drag leave: remove highlight when leaving zone
  zone.addEventListener("dragleave", () => {
    console.log("Drag leave event");
    zone.classList.remove("drag-over");
  });
  
  // Drop: process dropped file(s)
  zone.addEventListener("drop", (e) => { 
    e.preventDefault(); 
    e.stopPropagation();
    console.log("Drop event, files count:", e.dataTransfer.files.length);
    zone.classList.remove("drag-over"); 
    if (e.dataTransfer.files[0]) {
      console.log("Processing dropped file:", e.dataTransfer.files[0].name);
      handler(e.dataTransfer.files[0]); 
    }
  });
  
  // File input change: process selected file from picker
  input.addEventListener("change", () => { 
    if (input.files[0]) {
      console.log("Processing selected file:", input.files[0].name);
      handler(input.files[0]); 
      input.value = ""; 
    } 
  });

  console.log("Drop zone setup complete");
};

// ===========================
// Back Button Drop Zone Display Management
// ===========================

// Update back drop zone to show loaded filename instead of upload prompt
export const updateBackDropZoneDisplay = (fileName) => {
  const uploadPrompt = document.getElementById("back-zone-upload-prompt");
  const fileDisplay = document.getElementById("back-zone-file-display");
  const fileNameEl = document.getElementById("back-zone-file-name");
  
  // Hide upload prompt and show file display
  if (uploadPrompt) uploadPrompt.style.display = "none";
  if (fileDisplay) fileDisplay.style.display = "block";
  if (fileNameEl) fileNameEl.textContent = fileName; // Show the filename
};

// Reset back drop zone to show upload prompt when clearing data
export const resetBackDropZoneDisplay = () => {
  const uploadPrompt = document.getElementById("back-zone-upload-prompt");
  const fileDisplay = document.getElementById("back-zone-file-display");
  
  // Show upload prompt and hide file display
  if (uploadPrompt) uploadPrompt.style.display = "block";
  if (fileDisplay) fileDisplay.style.display = "none";
};

// Enables file replacement directly from map screen using back button
export const initializeBackDropZone = (handleFile) => {
  const zone = document.getElementById("back-drop-zone");
  const input = document.getElementById("back-file-input");
  
  console.log("Initializing back drop zone...");
  
  // Validate elements exist before setting up event listeners
  if (!zone || !input) { 
    console.error("Back drop zone elements not found!");
    console.log("back-drop-zone exists:", !!zone);
    console.log("back-file-input exists:", !!input);
    return; 
  }
  
  // Reuse drop zone setup for back button functionality.
  // setupDropZone is idempotent and will ignore repeated initialization.
  setupDropZone(zone, input, handleFile);
  console.log("Back drop zone initialized");
};
