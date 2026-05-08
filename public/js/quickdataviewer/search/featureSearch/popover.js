// ===========================
// Feature Search — popover DOM + positioning
// ===========================

/**
 * Build the popover element structure for a given layer.
 * @param {string} layerName
 * @param {HTMLSelectElement} fieldSelect
 * @returns {{
 *   root: HTMLDivElement,
 *   input: HTMLInputElement,
 *   list: HTMLUListElement,
 *   closeBtn: HTMLButtonElement,
 * }}
 */
export const buildPopover = (layerName, fieldSelect) => {
  const root = document.createElement('div');
  root.className = 'feature-search-popover';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', `Zoeken in laag ${layerName}`);

  const header = document.createElement('div');
  header.className = 'feature-search-header';

  const title = document.createElement('span');
  title.className = 'feature-search-title';
  title.textContent = `Zoek in: ${layerName}`;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'feature-search-close';
  closeBtn.setAttribute('aria-label', 'Sluiten');
  closeBtn.innerHTML = '&times;';

  header.appendChild(title);
  header.appendChild(closeBtn);

  const fieldRow = document.createElement('div');
  fieldRow.className = 'feature-search-row';
  const fieldLabel = document.createElement('label');
  fieldLabel.className = 'feature-search-label';
  fieldLabel.textContent = 'Veld';
  fieldRow.appendChild(fieldLabel);
  fieldRow.appendChild(fieldSelect);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'feature-search-value';
  input.placeholder = 'Zoekwaarde…';
  input.autocomplete = 'off';

  const valueRow = document.createElement('div');
  valueRow.className = 'feature-search-row';
  const valueLabel = document.createElement('label');
  valueLabel.className = 'feature-search-label';
  valueLabel.textContent = 'Waarde';
  valueRow.appendChild(valueLabel);
  valueRow.appendChild(input);

  const list = document.createElement('ul');
  list.className = 'feature-search-suggestions';
  list.style.display = 'none';

  root.appendChild(header);
  root.appendChild(fieldRow);
  root.appendChild(valueRow);
  root.appendChild(list);

  return { root, input, list, closeBtn };
};

/**
 * Position the popover next to the anchor element. Uses fixed positioning
 * so it floats above the layer panel without being clipped.
 */
export const positionPopover = (root, anchor) => {
  const rect = anchor.getBoundingClientRect();
  const popoverWidth = 280;
  const margin = 6;

  // Prefer placing to the right of the kebab; if it would overflow,
  // place it below-and-left so it stays within the viewport.
  let left = rect.right + margin;
  let top = rect.top;

  if (left + popoverWidth > window.innerWidth - 8) {
    left = Math.max(8, rect.right - popoverWidth);
    top = rect.bottom + margin;
  }
  // Guard against bottom overflow
  if (top + 220 > window.innerHeight) {
    top = Math.max(8, window.innerHeight - 240);
  }

  root.style.position = 'fixed';
  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
  root.style.width = `${popoverWidth}px`;
  root.style.zIndex = '2000';
};
