// ===========================
// Feature Search — field/column dropdown builder
// ===========================
import { dataLayers } from '../../core/state.js';

// Internal feature-property keys that should never be searchable.
const EXCLUDE_KEYS = new Set(['geometry', 'selected', '_layerName', 'features']);

/**
 * Get the list of searchable field names for a layer.
 * Mirrors the logic used by ui/attributeTable.js so the same
 * non-internal columns are exposed.
 *
 * @param {string} layerName
 * @returns {string[]}
 */
export const getLayerFieldNames = (layerName) => {
  const layer = dataLayers[layerName];
  if (!layer) return [];
  const src = layer.get('_featureSource');
  const features = src?.getFeatures() || [];
  if (!features.length) return [];
  return Object.keys(features[0].getProperties()).filter(k => !EXCLUDE_KEYS.has(k));
};

/**
 * Build a <select> element pre-populated with the searchable fields
 * of the given layer. Returns the select element plus the list of fields.
 *
 * @param {string} layerName
 * @returns {{ select: HTMLSelectElement, fields: string[] }}
 */
export const buildFieldSelect = (layerName) => {
  const fields = getLayerFieldNames(layerName);
  const select = document.createElement('select');
  select.className = 'feature-search-field';

  if (!fields.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Geen velden beschikbaar';
    opt.disabled = true;
    opt.selected = true;
    select.appendChild(opt);
    select.disabled = true;
    return { select, fields };
  }

  fields.forEach((name, idx) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (idx === 0) opt.selected = true;
    select.appendChild(opt);
  });

  return { select, fields };
};
