// ===========================
// Vector Feature Styling
// ===========================

// Pre-create cached style instances to avoid GC pressure on large datasets
const selectedStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: "rgba(0, 102, 204, 0.8)" }),
  stroke: new ol.style.Stroke({ color: "rgb(0, 51, 153)", width: 3 }),
  image: new ol.style.Circle({ radius: 8, fill: new ol.style.Fill({ color: "rgba(0, 102, 204, 0.9)" }), stroke: new ol.style.Stroke({ color: "rgb(0, 51, 153)", width: 3 }) })
});

const defaultStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: "rgba(231, 151, 3, 0.58)" }),
  stroke: new ol.style.Stroke({ color: "rgb(173, 81, 1)", width: 2 }),
  image: new ol.style.Circle({ radius: 6, fill: new ol.style.Fill({ color: "rgba(255, 165, 0, 0.75)" }), stroke: new ol.style.Stroke({ color: "rgba(255, 120, 0, 1)", width: 2 }) })
});

export const getFeatureStyle = (feature) => {
  if (feature.get('selected') === 1) return selectedStyle;
  return defaultStyle;
};
