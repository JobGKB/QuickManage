// ===========================
// Feature Popup Overlay
// ===========================
import { selectedFeature, setSelectedFeature, clearSelection } from '../core/state.js';

// Creates interactive popup displayed when clicking on features
export const createPopup = (map) => {
  const popupEl = document.createElement("div");
  Object.assign(popupEl.style, { position: "absolute", minWidth: "400px", maxWidth: "450px", background: "white", border: "1px solid rgba(0,0,0,0.25)", borderRadius: "10px", boxShadow: "0 6px 18px rgba(0,0,0,0.18)", padding: "10px 12px", fontSize: "13px", lineHeight: "1.35", pointerEvents: "auto" });
  
  const closer = document.createElement("div");
  closer.textContent = "×";
  Object.assign(closer.style, { position: "absolute", top: "6px", right: "10px", cursor: "pointer", fontSize: "18px", opacity: "0.6" });
  closer.onmouseenter = () => (closer.style.opacity = "1");
  closer.onmouseleave = () => (closer.style.opacity = "0.6");
  popupEl.appendChild(closer);

  const title = document.createElement("div");
  title.style.cssText = "font-weight: 600; margin-right: 18px;";
  title.textContent = "Attributes";
  popupEl.appendChild(title);

  const content = document.createElement("div");
  content.style.cssText = "margin-top: 8px; max-height: 400px; overflow: auto;";
  popupEl.appendChild(content);

  document.body.appendChild(popupEl);

  const overlay = new ol.Overlay({ element: popupEl, autoPan: true, autoPanAnimation: { duration: 200 }, offset: [0, -10] });
  map.addOverlay(overlay);

  const closePopup = () => {
    if (selectedFeature && typeof selectedFeature.set === 'function') {
      selectedFeature.set('selected', 0);
    }
    clearSelection();
    overlay.setPosition(undefined);
  };
  
  closer.addEventListener("click", closePopup);

  map.on("pointermove", (evt) => (map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel) ? "pointer" : ""));
  map.on("singleclick", (evt) => {
    let feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (!feature) { closePopup(); return; }
    
    // Clear previous selection
    if (selectedFeature && typeof selectedFeature.set === 'function') {
      selectedFeature.set('selected', 0);
    }
    // Set new feature as selected and highlight in blue
    setSelectedFeature(feature);
    if (typeof feature.set === 'function') {
      feature.set('selected', 1);
    }
    
    const props = { ...feature.getProperties() };
    delete props.geometry;
    delete props.selected;
    delete props._layerName;
    delete props.features;
    const keys = Object.keys(props);

    title.textContent = keys.length ? "Attributes" : "No attributes";
    content.innerHTML = "";

    if (keys.length) {
      const table = document.createElement("table");
      table.style.cssText = "width: 100%; border-collapse: collapse;";
      // Create table rows for each feature property (key-value pairs)
      keys.forEach(k => {
        const tr = document.createElement("tr");
        const tdK = document.createElement("td");
        tdK.textContent = k;
        tdK.style.cssText = "font-weight: 600; padding: 4px 6px; border-bottom: 1px solid rgba(0,0,0,0.08); vertical-align: top; width: 45%;";
        const tdV = document.createElement("td");
        tdV.textContent = props[k] ?? "";
        tdV.style.cssText = "padding: 4px 6px; border-bottom: 1px solid rgba(0,0,0,0.08); vertical-align: top;";
        tr.appendChild(tdK);
        tr.appendChild(tdV);
        table.appendChild(tr);
      });
      content.appendChild(table);
    } else {
      content.textContent = "No attributes found on this feature.";
    }

    overlay.setPosition(evt.coordinate);
  });

  return closePopup;
};
