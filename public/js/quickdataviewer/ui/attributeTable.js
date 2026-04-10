// ===========================
// Attribute Table Panel
// ===========================
import { dataLayers } from '../core/state.js';
import { exportToExcel } from '../services/exporter.js';

let map = null;
let panelEl = null;
let tabsEl = null;
let bodyEl = null;
let toggleBtn = null;
let sidebarEl = null;
let activeLayer = null;
let checkedFeatures = new Map(); // layerName -> Set<ol.Feature>
let batchObserver = null;
const BATCH_SIZE = 200;
const MIN_PANEL_HEIGHT = 150;
const MAX_PANEL_HEIGHT_RATIO = 0.85;

export const initAttributeTable = (olMap) => {
  map = olMap;
  panelEl = document.getElementById('attribute-table-panel');
  tabsEl = document.getElementById('attr-table-tabs');
  bodyEl = document.getElementById('attr-table-body');
  toggleBtn = document.getElementById('attr-table-toggle');
  sidebarEl = document.getElementById('attr-table-sidebar');

  if (!panelEl || !tabsEl || !bodyEl || !toggleBtn) {
    console.warn('Attribute table DOM elements not found');
    return;
  }

  toggleBtn.addEventListener('click', togglePanel);

  // Resize handle drag logic
  const resizeHandle = document.getElementById('attr-table-resize-handle');
  if (resizeHandle) {
    let startY = 0;
    let startHeight = 0;

    const onPointerMove = (e) => {
      const delta = startY - e.clientY;
      const maxH = window.innerHeight * MAX_PANEL_HEIGHT_RATIO;
      const newHeight = Math.min(Math.max(startHeight + delta, MIN_PANEL_HEIGHT), maxH);
      panelEl.style.height = newHeight + 'px';
      updateFloatingButtonPositions(newHeight);
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setTimeout(() => map.updateSize(), 50);
    };

    resizeHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startY = e.clientY;
      startHeight = panelEl.getBoundingClientRect().height;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  }

  // Zoom-to-selected button in sidebar
  const zoomBtn = document.getElementById('attr-table-zoom-btn');
  if (zoomBtn) {
    zoomBtn.addEventListener('click', zoomToChecked);
  }

  // Close button in panel header
  const closeBtn = document.getElementById('attr-table-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (panelEl.style.display !== 'none') togglePanel();
    });
  }

  // Excel export button in sidebar
  const exportBtn = document.getElementById('attr-table-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportToExcel());
  }

  console.log('✓ Attribute table initialized');
};

function updateFloatingButtonPositions(panelHeight) {
  const offset = panelHeight + 10;
  if (toggleBtn) toggleBtn.style.bottom = offset + 'px';
  const zoomDataBtn = document.getElementById('layerZoomBtn');
  if (zoomDataBtn && zoomDataBtn.style.display !== 'none') {
    zoomDataBtn.style.bottom = (offset + 54) + 'px';
  }
}

function togglePanel() {
  const isOpen = panelEl.style.display !== 'none';
  const zoomDataBtn = document.getElementById('layerZoomBtn');

  if (isOpen) {
    panelEl.style.display = 'none';
    toggleBtn.classList.remove('attr-table-toggle--open');
    toggleBtn.style.bottom = '';
    if (zoomDataBtn) {
      zoomDataBtn.classList.remove('zoom-data-toggle--open');
      zoomDataBtn.style.bottom = '';
    }
    document.getElementById('map').classList.remove('attr-table-open');
  } else {
    panelEl.style.display = 'flex';
    const panelHeight = panelEl.getBoundingClientRect().height;
    toggleBtn.classList.add('attr-table-toggle--open');
    if (zoomDataBtn) zoomDataBtn.classList.add('zoom-data-toggle--open');
    updateFloatingButtonPositions(panelHeight);
    document.getElementById('map').classList.add('attr-table-open');
    buildTabs();
  }

  // Let the DOM reflow, then tell OL to recalculate map size
  setTimeout(() => map.updateSize(), 50);
}

function buildTabs() {
  tabsEl.innerHTML = '';
  const layerNames = Object.keys(dataLayers);

  if (!layerNames.length) {
    tabsEl.innerHTML = '<span class="attr-tab-empty">Geen layers geladen</span>';
    bodyEl.innerHTML = '';
    activeLayer = null;
    return;
  }

  layerNames.forEach((name, idx) => {
    const layer = dataLayers[name];
    const src = layer.get('_featureSource');
    const count = src ? src.getFeatures().length : 0;

    const tab = document.createElement('button');
    tab.className = 'attr-tab' + (idx === 0 ? ' attr-tab--active' : '');
    tab.textContent = `${name} (${count})`;
    tab.dataset.layer = name;
    tab.addEventListener('click', () => {
      tabsEl.querySelectorAll('.attr-tab').forEach(t => t.classList.remove('attr-tab--active'));
      tab.classList.add('attr-tab--active');
      renderLayerTable(name);
    });
    tabsEl.appendChild(tab);
  });

  // Render first layer by default
  activeLayer = layerNames[0];
  renderLayerTable(activeLayer);
}

function renderLayerTable(layerName) {
  activeLayer = layerName;
  bodyEl.innerHTML = '';

  // Disconnect any previous batch observer
  if (batchObserver) { batchObserver.disconnect(); batchObserver = null; }

  const layer = dataLayers[layerName];
  if (!layer) return;

  const src = layer.get('_featureSource');
  if (!src) return;

  const features = src.getFeatures();
  if (!features.length) {
    bodyEl.innerHTML = '<p class="attr-table-empty">Geen features in deze layer.</p>';
    return;
  }

  // Get property keys from first feature (exclude internal props)
  const excludeKeys = new Set(['geometry', 'selected', '_layerName', 'features']);
  const allKeys = Object.keys(features[0].getProperties()).filter(k => !excludeKeys.has(k));

  if (!allKeys.length) {
    bodyEl.innerHTML = '<p class="attr-table-empty">Geen attributen beschikbaar.</p>';
    return;
  }

  // Ensure tracked set exists for this layer
  if (!checkedFeatures.has(layerName)) {
    checkedFeatures.set(layerName, new Set());
  }
  const checked = checkedFeatures.get(layerName);

  // Build table shell
  const table = document.createElement('table');
  table.className = 'attr-data-table';

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const thCheck = document.createElement('th');
  thCheck.className = 'attr-col-check';
  const selectAll = document.createElement('input');
  selectAll.type = 'checkbox';
  selectAll.title = 'Alles selecteren';
  selectAll.checked = checked.size === features.length && features.length > 0;
  thCheck.appendChild(selectAll);
  headerRow.appendChild(thCheck);

  allKeys.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  bodyEl.appendChild(table);

  // Sentinel for infinite scroll
  const sentinel = document.createElement('div');
  sentinel.className = 'attr-table-sentinel';
  sentinel.innerHTML = '<span class="attr-table-sentinel-spinner"></span> Meer laden\u2026';
  bodyEl.appendChild(sentinel);

  let rendered = 0;

  function appendBatch() {
    const end = Math.min(rendered + BATCH_SIZE, features.length);
    for (let i = rendered; i < end; i++) {
      const feature = features[i];
      const tr = document.createElement('tr');
      if (checked.has(feature)) tr.classList.add('attr-row--checked');

      // Checkbox cell
      const tdCheck = document.createElement('td');
      tdCheck.className = 'attr-col-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = checked.has(feature);
      cb.addEventListener('change', () => {
        if (cb.checked) {
          checked.add(feature); feature.set('selected', 1);
          tr.classList.add('attr-row--checked');
        } else {
          checked.delete(feature); feature.set('selected', 0);
          tr.classList.remove('attr-row--checked');
        }
        selectAll.checked = checked.size === features.length;
      });
      tdCheck.appendChild(cb);
      tr.appendChild(tdCheck);

      // Data cells
      allKeys.forEach(key => {
        const td = document.createElement('td');
        const val = feature.get(key);
        td.textContent = val != null ? val : '';
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }
    rendered = end;

    // Remove sentinel when all rows are loaded
    if (rendered >= features.length) {
      sentinel.remove();
      if (batchObserver) { batchObserver.disconnect(); batchObserver = null; }
    }
  }

  // Render initial batch
  appendBatch();

  // Observe sentinel to load next batches on scroll
  if (rendered < features.length) {
    batchObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) appendBatch();
    }, { root: bodyEl, rootMargin: '200px' });
    batchObserver.observe(sentinel);
  }

  // Select-all handler (affects all features, including not-yet-rendered)
  selectAll.addEventListener('change', () => {
    // Update all rendered rows
    tbody.querySelectorAll('tr').forEach((row, i) => {
      const cb = row.querySelector('input[type="checkbox"]');
      if (!cb) return;
      cb.checked = selectAll.checked;
      if (selectAll.checked) {
        checked.add(features[i]); features[i].set('selected', 1);
        row.classList.add('attr-row--checked');
      } else {
        checked.delete(features[i]); features[i].set('selected', 0);
        row.classList.remove('attr-row--checked');
      }
    });
    // Also update features not yet rendered
    for (let i = rendered; i < features.length; i++) {
      if (selectAll.checked) {
        checked.add(features[i]); features[i].set('selected', 1);
      } else {
        checked.delete(features[i]); features[i].set('selected', 0);
      }
    }
  });
}

function zoomToChecked() {
  if (!activeLayer) return;

  const checked = checkedFeatures.get(activeLayer);
  if (!checked || !checked.size) return;

  const extent = ol.extent.createEmpty();
  checked.forEach(feature => {
    const geom = feature.getGeometry();
    if (geom) ol.extent.extend(extent, geom.getExtent());
  });

  if (!ol.extent.isEmpty(extent)) {
    map.getView().fit(extent, { padding: [80, 80, 80, 80], duration: 300, maxZoom: 16 });
  }
}
