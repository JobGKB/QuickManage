// ===========================
// Layer Management & Display
// ===========================
import { layerVisibility } from '../core/state.js';
import { dataLayers } from '../core/state.js';
import { zoomToData } from '../core/map.js';

// Toggle all layers on/off and sync checkboxes + button label
const toggleAllLayers = () => {
  const btn = document.getElementById('layerToggleBtn');
  const visible = btn?.textContent === 'Alles aan';
  Object.keys(dataLayers).forEach(name => {
    layerVisibility[name] = visible;
    dataLayers[name].setVisible(visible);
    const cb = document.getElementById(`layer-${name}`);
    if (cb) cb.checked = visible;
  });
  if (btn) btn.textContent = visible ? 'Alles uit' : 'Alles aan';
};

/**
 * Show or hide a small rendering spinner next to a layer's label.
 * @param {string} name - Layer name
 * @param {boolean} rendering - true = show spinner, false = hide
 */
export const setLayerRendering = (name, rendering) => {
  const row = document.getElementById(`layer-row-${name}`);
  if (!row) return;
  let indicator = row.querySelector('.layer-render-indicator');
  if (rendering) {
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'layer-spinner layer-render-indicator';
      indicator.style.width = '10px';
      indicator.style.height = '10px';
      indicator.style.marginLeft = '4px';
      row.appendChild(indicator);
    }
  } else {
    indicator?.remove();
  }
};

/**
 * Show the layer panel with spinner placeholders for layers that are loading.
 * @param {string[]} names - Layer names to show as "loading"
 */
export const showLoadingLayers = (names) => {
  const div = document.getElementById("layerNames");
  if (!names?.length) { div.style.display = "none"; return; }

  div.innerHTML = "<strong>Lagen laden:</strong>" + names.map(name => {
    const rowId = `layer-row-${name}`;
    return `<div id="${rowId}" class="layer-row"><span class="layer-spinner"></span><label class="layer-label" style="opacity:0.6;">⏳ <strong>${name}</strong> laden…</label></div>`;
  }).join("");
  div.style.display = "block";

  // Hide toggler while loading
  const togglerContainer = document.getElementById('layerTogglerContainer');
  if (togglerContainer) {
    togglerContainer.innerHTML = '';
    togglerContainer.style.display = 'none';
  }
};

/**
 * Replace a loading spinner with a working checkbox for one layer.
 * @param {string} name - Layer name
 * @param {number} featureCount - Number of features loaded
 */
export const markLayerLoaded = (name, featureCount) => {
  const row = document.getElementById(`layer-row-${name}`);
  if (!row) return;
  const id = `layer-${name}`;
  row.innerHTML = `<input type="checkbox" id="${id}" data-layer="${name}" ${layerVisibility[name] !== false ? 'checked' : ''} style="cursor: pointer; flex-shrink: 0; margin-top: 2px;" /><label for="${id}" class="layer-label"> <strong>${name}</strong> (${featureCount})</label>`;

  // Update header once at least one layer is loaded
  const div = document.getElementById("layerNames");
  const strong = div?.querySelector(':scope > strong');
  if (strong) strong.textContent = 'Lagen geladen:';

  // Ensure the toggle button is present outside layerNames
  const togglerContainer = document.getElementById('layerTogglerContainer');
  if (togglerContainer && !togglerContainer.querySelector('#layerToggleBtn')) {
    togglerContainer.innerHTML = '<button id="layerToggleBtn">Alles uit</button><button class="btn zoomTodata" id="layerZoomBtn"><i class="fa-solid fa-house"></i></button>';
    togglerContainer.querySelector('#layerToggleBtn').addEventListener('click', toggleAllLayers);
    togglerContainer.querySelector('#layerZoomBtn').addEventListener('click', () => zoomToData());
  }
  if (togglerContainer) togglerContainer.style.display = 'flex';

  // Attach visibility toggle
  const cb = row.querySelector('input[type="checkbox"]');
  cb?.addEventListener('change', (e) => {
    layerVisibility[name] = e.target.checked;
    const layer = dataLayers[name];
    if (layer) layer.setVisible(e.target.checked);
  });
};

// Legacy: Display all layers at once (used if no progressive loading needed)
export const displayLayerInfo = (layers) => {
  const div = document.getElementById("layerNames");
  if (!layers?.length) { div.style.display = "none"; return; }
  
  div.innerHTML = '<strong>Lagen geladen:</strong>' + layers.map(l => {
    const id = `layer-${l.name}`;
    return `<div id="layer-row-${l.name}" class="layer-row"><input type="checkbox" id="${id}" data-layer="${l.name}" ${layerVisibility[l.name] !== false ? 'checked' : ''} style="cursor: pointer; flex-shrink: 0; margin-top: 2px;" /><label for="${id}" class="layer-label"> <strong>${l.name}</strong> (${l.featureCount})</label></div>`;
  }).join("");
  div.style.display = "block";

  const togglerContainer = document.getElementById('layerTogglerContainer');
  if (togglerContainer) {
    togglerContainer.innerHTML = '<button id="layerToggleBtn">Alles uit</button><button class="btn zoomTodata" id="layerZoomBtn"><i class="fa-solid fa-house"></i></button>';
    togglerContainer.style.display = 'flex';
    togglerContainer.querySelector('#layerToggleBtn')?.addEventListener('click', toggleAllLayers);
    togglerContainer.querySelector('#layerZoomBtn')?.addEventListener('click', () => zoomToData());
  }

  div.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', (e) => {
    const name = e.target.dataset.layer;
    layerVisibility[name] = e.target.checked;
    const layer = dataLayers[name];
    if (layer) layer.setVisible(e.target.checked);
  }));
};
