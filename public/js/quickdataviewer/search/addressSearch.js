// ===========================
// Address Search (PDOK Locatieserver)
// ===========================
import { map } from '../core/map.js';

const PDOK_SUGGEST_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest';
const PDOK_LOOKUP_URL  = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup';

let debounceTimer = null;
let markerLayer = null;

const getMarkerLayer = () => {
  if (!markerLayer) {
    markerLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({ color: 'rgba(205, 123, 0, 0.85)' }),
          stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    });
    markerLayer.set('_internal', true);
    map.addLayer(markerLayer);
  }
  return markerLayer;
};

const clearMarker = () => {
  getMarkerLayer().getSource().clear();
};

const placeMarker = (coords) => {
  clearMarker();
  const feature = new ol.Feature(new ol.geom.Point(coords));
  getMarkerLayer().getSource().addFeature(feature);
};

/**
 * Initialise the address search bar.
 * Call once after the map is ready.
 */
export const initAddressSearch = () => {
  const input       = document.getElementById('address-search-input');
  const resultsList = document.getElementById('address-search-results');
  const clearBtn    = document.getElementById('address-search-clear');
  if (!input || !resultsList) return;

  // Suggest on input (debounced)
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) { resultsList.innerHTML = ''; resultsList.style.display = 'none'; return; }
    debounceTimer = setTimeout(() => fetchSuggestions(q, resultsList, input), 250);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.address-search')) {
      resultsList.style.display = 'none';
    }
  });

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      resultsList.innerHTML = '';
      resultsList.style.display = 'none';
      clearMarker();
    });
  }
};

async function fetchSuggestions(query, resultsList, input) {
  try {
    const params = new URLSearchParams({ q: query, rows: 6 });
    const res  = await fetch(`${PDOK_SUGGEST_URL}?${params}`);
    const data = await res.json();
    const docs = data?.response?.docs || [];

    resultsList.innerHTML = '';
    if (!docs.length) {
      resultsList.style.display = 'none';
      return;
    }

    docs.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.weergavenaam;
      li.addEventListener('click', () => {
        input.value = doc.weergavenaam;
        resultsList.style.display = 'none';
        lookupAndZoom(doc.id);
      });
      resultsList.appendChild(li);
    });
    resultsList.style.display = 'block';
  } catch (err) {
    console.error('Address search error:', err);
  }
}

async function lookupAndZoom(id) {
  try {
    const params = new URLSearchParams({ id });
    const res  = await fetch(`${PDOK_LOOKUP_URL}?${params}`);
    const data = await res.json();
    const doc  = data?.response?.docs?.[0];
    if (!doc) return;

    // centroide_rd is "POINT(x y)"
    const match = doc.centroide_rd?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (!match) return;
    const coords = [parseFloat(match[1]), parseFloat(match[2])];

    placeMarker(coords);
    map.getView().animate({ center: coords, zoom: 16, duration: 400 });
  } catch (err) {
    console.error('Address lookup error:', err);
  }
}
