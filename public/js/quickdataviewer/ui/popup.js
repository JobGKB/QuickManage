// ===========================
// Feature Popup Overlay
// ===========================
import { selectedFeature, setSelectedFeature, clearSelection } from '../core/state.js';
import { dataLayers } from '../core/state.js';

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

  // Navigation bar for multiple features at the same location
  const navBar = document.createElement("div");
  navBar.style.cssText = "display: none; align-items: center; justify-content: space-between; margin-top: 6px; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.1);";

  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = "<i class=\"fa-solid fa-arrow-left\"></i>";
  prevBtn.style.cssText = "border: none; background: #eee; border-radius: 4px; cursor: pointer; padding: 2px 10px; font-size: 14px;";
  prevBtn.onmouseenter = () => (prevBtn.style.background = "#ddd");
  prevBtn.onmouseleave = () => (prevBtn.style.background = "#eee");

  const navLabel = document.createElement("span");
  navLabel.style.cssText = "font-size: 12px; color: #555;";

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = "<i class=\"fa-solid fa-arrow-right\"></i>";
  nextBtn.style.cssText = "border: none; background: #eee; border-radius: 4px; cursor: pointer; padding: 2px 10px; font-size: 14px;";
  nextBtn.onmouseenter = () => (nextBtn.style.background = "#ddd");
  nextBtn.onmouseleave = () => (nextBtn.style.background = "#eee");

  navBar.appendChild(prevBtn);
  navBar.appendChild(navLabel);
  navBar.appendChild(nextBtn);
  popupEl.appendChild(navBar);

  const content = document.createElement("div");
  content.style.cssText = "margin-top: 8px; max-height: 400px; overflow: auto;";
  popupEl.appendChild(content);

  document.body.appendChild(popupEl);

  const overlay = new ol.Overlay({ element: popupEl, autoPan: true, autoPanAnimation: { duration: 200 }, offset: [0, -10] });
  map.addOverlay(overlay);

  // State for multi-feature navigation
  let hitFeatures = [];
  let currentIndex = 0;

  const renderFeature = (feature) => {
    // Clear previous selection highlight
    if (selectedFeature && typeof selectedFeature.set === 'function') {
      selectedFeature.set('selected', 0);
    }
    // Highlight new feature
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

    // Show layer name in title if available
    const layerName = feature.get('_layerName') || '';
    title.textContent = keys.length
      ? (layerName ? `Attributes — ${layerName}` : "Attributes")
      : "No attributes";

    content.innerHTML = "";

    if (keys.length) {
      const table = document.createElement("table");
      table.style.cssText = "width: 100%; border-collapse: collapse;";
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
  };

  const updateNav = () => {
    if (hitFeatures.length > 1) {
      navBar.style.display = "flex";
      navLabel.textContent = `Feature ${currentIndex + 1} of ${hitFeatures.length}`;
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      prevBtn.style.opacity = "1";
      nextBtn.style.opacity = "1";
    } else {
      navBar.style.display = "none";
    }
  };

  prevBtn.addEventListener("click", () => {
    if (!hitFeatures.length) return;
    currentIndex = (currentIndex - 1 + hitFeatures.length) % hitFeatures.length;
    renderFeature(hitFeatures[currentIndex]);
    updateNav();
  });

  nextBtn.addEventListener("click", () => {
    if (!hitFeatures.length) return;
    currentIndex = (currentIndex + 1) % hitFeatures.length;
    renderFeature(hitFeatures[currentIndex]);
    updateNav();
  });

  const closePopup = () => {
    if (selectedFeature && typeof selectedFeature.set === 'function') {
      selectedFeature.set('selected', 0);
    }
    clearSelection();
    hitFeatures = [];
    currentIndex = 0;
    overlay.setPosition(undefined);
  };
  
  closer.addEventListener("click", closePopup);

  const HIT_TOLERANCE_PX = 5;
  map.on("pointermove", (evt) => (map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel, { hitTolerance: HIT_TOLERANCE_PX }) ? "pointer" : ""));
  map.on("singleclick", (evt) => {
    // Collect features actually under the click pixel (geometry-accurate),
    // using OpenLayers' built-in hit detection rather than a bounding-box scan.
    const visibleLayers = new Set(Object.values(dataLayers).filter(l => l.getVisible()));

    const seen = new Set();
    const features = [];
    map.forEachFeatureAtPixel(
      evt.pixel,
      (feature, layer) => {
        if (!layer || !visibleLayers.has(layer)) return;
        // Expand cluster/multi features if applicable
        const inner = feature.get('features');
        const list = Array.isArray(inner) && inner.length ? inner : [feature];
        list.forEach(f => {
          if (!seen.has(f)) {
            seen.add(f);
            features.push(f);
          }
        });
      },
      { hitTolerance: HIT_TOLERANCE_PX }
    );

    if (!features.length) { closePopup(); return; }

    hitFeatures = features;
    currentIndex = 0;

    renderFeature(hitFeatures[0]);
    updateNav();
    overlay.setPosition(evt.coordinate);
  });

  return closePopup;
};
