// ===========================
// Feature Search — public API + state
// ===========================
// Per-layer "search by field value" popover, anchored to the kebab (⋮)
// button rendered in each layer row. Mirrors the modular layout used by
// the rest of quickdataviewer.

import { buildFieldSelect } from './fieldSelector.js';
import { buildPopover, positionPopover } from './popover.js';
import { wireSuggestions } from './suggestions.js';
import { clearHighlight } from './zoomToFeature.js';

let activePopover = null; // { root, dispose, layerName }

const dispose = () => {
  if (!activePopover) return;
  try { activePopover.dispose?.(); } catch (_) { /* noop */ }
  activePopover.root.remove();
  document.removeEventListener('mousedown', onOutsideClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('resize', onWindowChange);
  window.removeEventListener('scroll', onWindowChange, true);
  activePopover = null;
};

const onOutsideClick = (e) => {
  if (!activePopover) return;
  if (activePopover.root.contains(e.target)) return;
  // Allow clicks on any kebab button to be handled by the layer-panel
  // delegation handler (which will close + re-open as needed).
  if (e.target.closest?.('.layer-menu-btn')) return;
  closeFeatureSearch();
};

const onKeyDown = (e) => {
  if (e.key === 'Escape') closeFeatureSearch();
};

const onWindowChange = () => {
  if (activePopover?.anchor) {
    positionPopover(activePopover.root, activePopover.anchor);
  }
};

/**
 * Close the active popover (if any) and clear any feature highlight it set.
 */
export const closeFeatureSearch = () => {
  clearHighlight();
  dispose();
};

/**
 * Open the feature-search popover for a layer, anchored to the given element.
 *
 * @param {string} layerName
 * @param {HTMLElement} anchor - The kebab button that was clicked.
 */
export const openFeatureSearch = (layerName, anchor) => {
  // Toggle: clicking the kebab on the same layer closes the popover.
  if (activePopover && activePopover.layerName === layerName) {
    closeFeatureSearch();
    return;
  }
  // Switching layers: close any existing popover first.
  closeFeatureSearch();

  const { select: fieldSelect, fields } = buildFieldSelect(layerName);
  const { root, input, list, closeBtn } = buildPopover(layerName, fieldSelect);

  document.body.appendChild(root);
  positionPopover(root, anchor);

  let unwire = () => {};
  if (fields.length) {
    unwire = wireSuggestions({
      input,
      list,
      getLayerName: () => layerName,
      getFieldName: () => fieldSelect.value,
      onPick: () => { /* keep popover open so user can pick another */ },
    });

    // Re-run filter when the field changes
    fieldSelect.addEventListener('change', () => {
      input.dispatchEvent(new Event('input'));
    });
  } else {
    input.disabled = true;
    input.placeholder = 'Geen velden om in te zoeken';
  }

  closeBtn.addEventListener('click', closeFeatureSearch);

  activePopover = {
    root,
    anchor,
    layerName,
    dispose: () => unwire(),
  };

  document.addEventListener('mousedown', onOutsideClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('resize', onWindowChange);
  window.addEventListener('scroll', onWindowChange, true);

  // Focus value input for quick typing (skip if no fields).
  if (fields.length) input.focus();
};
