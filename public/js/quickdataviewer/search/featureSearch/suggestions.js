// ===========================
// Feature Search — suggestion list (substring filter)
// ===========================
import { dataLayers } from '../../core/state.js';
import { zoomAndHighlight } from './zoomToFeature.js';

const MAX_SUGGESTIONS = 20;
const DEBOUNCE_MS = 150;

/**
 * Find features in a layer where the chosen field's stringified value
 * contains the query (case-insensitive).
 *
 * @param {string} layerName
 * @param {string} fieldName
 * @param {string} query
 * @returns {Array<{ feature: ol.Feature, label: string }>}
 */
const findMatches = (layerName, fieldName, query) => {
  const layer = dataLayers[layerName];
  if (!layer || !fieldName) return [];
  const src = layer.get('_featureSource');
  const features = src?.getFeatures() || [];
  if (!features.length) return [];

  const q = query.toLowerCase();
  const out = [];
  for (let i = 0; i < features.length && out.length < MAX_SUGGESTIONS; i++) {
    const raw = features[i].get(fieldName);
    if (raw === null || raw === undefined) continue;
    const str = String(raw);
    if (str.toLowerCase().includes(q)) {
      out.push({ feature: features[i], label: str });
    }
  }
  return out;
};

/**
 * Render suggestion list items into the given <ul>.
 */
const renderList = (ul, layerName, matches, onPick) => {
  ul.innerHTML = '';
  if (!matches.length) {
    ul.style.display = 'none';
    return;
  }
  matches.forEach(({ feature, label }) => {
    const li = document.createElement('li');
    li.textContent = label;
    li.title = label;
    li.addEventListener('click', () => {
      zoomAndHighlight(layerName, feature);
      if (onPick) onPick(feature, label);
    });
    ul.appendChild(li);
  });
  ul.style.display = 'block';
};

/**
 * Wire up an input + suggestion list to provide debounced typeahead
 * search over a layer's field.
 *
 * @param {object} params
 * @param {HTMLInputElement} params.input
 * @param {HTMLUListElement} params.list
 * @param {() => string} params.getLayerName
 * @param {() => string} params.getFieldName
 * @param {(feature: ol.Feature, label: string) => void} [params.onPick]
 * @returns {() => void} dispose function (clears timer + listeners)
 */
export const wireSuggestions = ({ input, list, getLayerName, getFieldName, onPick }) => {
  let timer = null;

  const run = () => {
    const q = input.value.trim();
    if (q.length < 1) {
      list.innerHTML = '';
      list.style.display = 'none';
      return;
    }
    const layerName = getLayerName();
    const fieldName = getFieldName();
    const matches = findMatches(layerName, fieldName, q);
    renderList(list, layerName, matches, onPick);
  };

  const onInput = () => {
    clearTimeout(timer);
    timer = setTimeout(run, DEBOUNCE_MS);
  };

  input.addEventListener('input', onInput);

  return () => {
    clearTimeout(timer);
    input.removeEventListener('input', onInput);
  };
};
