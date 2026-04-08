// ===========================
// Export Functionality
// ===========================
import { showError } from '../ui/helpers.js';
import { getAllFeatures } from '../core/map.js';

// Sanitize sheet name: remove invalid Excel characters and truncate to 31 chars
const sanitizeSheetName = (name) => name.replace(/[\[\]:*?/\\]/g, '_').substring(0, 31);

// Export visible features to Excel workbook with one sheet per layer
export const exportToExcel = () => {
  // Check XLSX library is loaded
  if (typeof XLSX === 'undefined') { showError("Excel library is nog niet geladen."); return; }
  const features = getAllFeatures();
  if (!features.length) { showError("Geen data om te exporteren."); return; }

  const layerData = {};
  // Collect features grouped by layer, extracting only attribute properties
  features.forEach(f => {
    const layer = f.get('_layerName') || 'Default';
    if (!layerData[layer]) layerData[layer] = [];
    const props = { ...f.getProperties() };
    delete props.geometry;
    delete props._layerName;
    delete props.selected;
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
