// ===========================
// Layer Management & Display
// ===========================
import { layerVisibility } from '../core/state.js';
import { dataLayers } from '../core/state.js';
import { zoomToData } from '../core/map.js';
import { openFeatureSearch, closeFeatureSearch } from '../search/featureSearch/featureSearch.js';

// Escape a string for safe insertion into HTML markup (text or attribute values).
// Layer names come from user-uploaded files and may contain HTML-special chars.
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Ensure a list of layer names is unique by suffixing duplicates with _2, _3, …
// Prevents collisions in the dataLayers registry and in generated DOM element IDs.
export const dedupeLayerNames = (names) => {
  const used = new Set();
  return names.map((orig) => {
    let candidate = orig == null ? '' : String(orig);
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${orig}_${n++}`;
    }
    used.add(candidate);
    return candidate;
  });
};

// Attach a single delegated click listener on #layerNames so kebab clicks
// are handled regardless of how/when each row was rendered.
const ensureLayerMenuDelegation = () => {
  const div = document.getElementById('layerNames');
  if (!div || div.dataset.menuBound === 'true') return;
  div.addEventListener('click', (e) => {
    const btn = e.target.closest('.layer-menu-btn');
    if (!btn || !div.contains(btn)) return;
    e.preventDefault();
    e.stopPropagation();
    const layerName = btn.dataset.layer;
    if (layerName) openFeatureSearch(layerName, btn);
  });
  div.dataset.menuBound = 'true';
};

// Toggle all layers on/off and sync checkboxes + button label
const toggleAllLayers = () => {
  const btn = document.getElementById('layerToggleBtn');
  const visible = btn?.innerHTML === '<i class="fa-solid fa-eye"></i>';
  Object.keys(dataLayers).forEach(name => {
    layerVisibility[name] = visible;
    dataLayers[name].setVisible(visible);
    const cb = document.getElementById(`layer-${name}`);
    if (cb) cb.checked = visible;
  });
  if (btn) btn.innerHTML = visible ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
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
  // Any popover opened against previous rows references stale layers/anchors.
  closeFeatureSearch();
  const div = document.getElementById("layerNames");
  const titleDiv = document.getElementById("layerNamesTitle");
  if (!names?.length) { div.style.display = "none"; if (titleDiv) titleDiv.style.display = "none"; return; }

  // Show title above the container
  if (titleDiv) {
    const strong = titleDiv.querySelector('strong');
    if (strong) strong.textContent = 'Lagen laden:';
    titleDiv.style.display = "flex";
  }

  // Hide toggler while loading
  const togglerContainer = document.getElementById('layerTogglerContainer');
  if (togglerContainer) {
    togglerContainer.innerHTML = '';
    togglerContainer.style.display = 'none';
  }
  const rows = names.map(name => {
    const safe = escapeHtml(name);
    return `<div id="layer-row-${safe}" class="layer-row"><span class="layer-spinner"></span><label class="layer-label" style="opacity:0.6;">⏳ <strong>${safe}</strong> laden…</label></div>`;
  }).join("");
  div.innerHTML = rows;
  div.style.display = "block";

  // Hide zoom button while loading
  const zoomBtn = document.getElementById('layerZoomBtn');
  if (zoomBtn) zoomBtn.style.display = 'none';
};

/**
 * Replace a loading spinner with a working checkbox for one layer.
 * @param {string} name - Layer name
 * @param {number} featureCount - Number of features loaded
 */
export const markLayerLoaded = (name, featureCount) => {
  const row = document.getElementById(`layer-row-${name}`);
  if (!row) return;
  const safe = escapeHtml(name);
  const id = `layer-${safe}`;
  row.innerHTML = `<input type="checkbox" id="${id}" data-layer="${safe}" ${layerVisibility[name] !== false ? 'checked' : ''} style="cursor: pointer; flex-shrink: 0; margin-top: 2px;" /><label for="${id}" class="layer-label"> <strong>${safe}</strong> (${featureCount})</label><button type="button" class="layer-menu-btn" data-layer="${safe}" aria-label="Zoek in laag" title="Zoek in laag">⋮</button>`;
  ensureLayerMenuDelegation();

  // Update title above the container
  const titleDiv = document.getElementById("layerNamesTitle");
  if (titleDiv) {
    const strong = titleDiv.querySelector('strong');
    if (strong) strong.textContent = 'Lagen geladen:';
  }

  // Ensure the toggle button is present inside layerNames
  const togglerContainer = document.getElementById('layerTogglerContainer');
  if (togglerContainer && !togglerContainer.querySelector('#layerToggleBtn')) {
    togglerContainer.innerHTML = '<button id="layerToggleBtn"><i class="fa-solid fa-eye-slash"></i></button>';
    togglerContainer.querySelector('#layerToggleBtn').addEventListener('click', toggleAllLayers);
  }
  if (togglerContainer) togglerContainer.style.display = 'flex';

  // Show the floating zoom button
  const zoomBtn = document.getElementById('layerZoomBtn');
  if (zoomBtn) {
    zoomBtn.style.display = 'flex';
    if (!zoomBtn.dataset.bound) {
      zoomBtn.addEventListener('click', () => zoomToData());
      zoomBtn.dataset.bound = 'true';
    }
  }

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
  const titleDiv = document.getElementById("layerNamesTitle");
  if (!layers?.length) { div.style.display = "none"; if (titleDiv) titleDiv.style.display = "none"; return; }

  // Show title above the container
  if (titleDiv) {
    const strong = titleDiv.querySelector('strong');
    if (strong) strong.textContent = 'Lagen geladen:';
    titleDiv.style.display = 'block';
  }

  // Build layer rows
  const rows = layers.map(l => {
    const safe = escapeHtml(l.name);
    const id = `layer-${safe}`;
    return `<div id="layer-row-${safe}" class="layer-row">
      <input type="checkbox" id="${id}" data-layer="${safe}" ${layerVisibility[l.name] !== false ? 'checked' : ''} style="cursor: pointer; flex-shrink: 0; margin-top: 2px;" />
      <label for="${id}" class="layer-label"> <strong>${safe}</strong> (${l.featureCount})</label>
      <button type="button" class="layer-menu-btn" data-layer="${safe}" aria-label="Zoek in laag" title="Zoek in laag">⋮</button>
    </div>`;
  }).join("");

  div.innerHTML = rows;
  div.style.display = "block";
  ensureLayerMenuDelegation();

  // Show toggler in title
  const togglerContainer = document.getElementById('layerTogglerContainer');
  if (togglerContainer) {
    if (!togglerContainer.querySelector('#layerToggleBtn')) {
      togglerContainer.innerHTML = '<button id="layerToggleBtn"><i class="fa-solid fa-eye-slash"></i></button>';
      togglerContainer.querySelector('#layerToggleBtn')?.addEventListener('click', toggleAllLayers);
    }
    togglerContainer.style.display = 'flex';
  }

  // Show the floating zoom button
  const zoomBtn = document.getElementById('layerZoomBtn');
  if (zoomBtn) {
    zoomBtn.style.display = 'flex';
    if (!zoomBtn.dataset.bound) {
      zoomBtn.addEventListener('click', () => zoomToData());
      zoomBtn.dataset.bound = 'true';
    }
  }

  div.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', (e) => {
    const name = e.target.dataset.layer;
    layerVisibility[name] = e.target.checked;
    const layer = dataLayers[name];
    if (layer) layer.setVisible(e.target.checked);
  }));
};
