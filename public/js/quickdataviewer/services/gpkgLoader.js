// ===========================
// GeoPackage Loading Service
// ===========================
// Parses a .gpkg file (ArrayBuffer) into GeoJSON layers and renders them on the map.
// Uses @ngageoint/geopackage library (loaded globally as GeoPackageAPI).

import { detectDataProjection } from './projectionDetector.js';
import { showLoadingLayers, markLayerLoaded } from './layerManager.js';
import { addDataLayer, clearAllDataLayers, zoomToData } from '../core/map.js';

// --- Raw WKB parser for curve geometry types ---
// The GeoPackage library can't parse MultiCurve/CompoundCurve/CircularString etc.
// When it fails, geomData.geometry is null. We parse the raw GP binary ourselves.

function parseGpkgBinaryToGeoJSON(gpBytes) {
  if (!gpBytes || gpBytes.length < 8) return null;
  const bytes = gpBytes instanceof Uint8Array ? gpBytes : new Uint8Array(gpBytes);

  // Strip GeoPackage binary header (magic 'GP' + version + flags + srsId + envelope)
  if (bytes[0] !== 0x47 || bytes[1] !== 0x50) return null; // Not GP binary
  const flags = bytes[3];
  const envType = (flags >> 1) & 0x07;
  const envSize = [0, 32, 48, 48, 64][envType] || 0;
  const wkbStart = 8 + envSize;
  if (wkbStart >= bytes.length) return null;

  const dv = new DataView(bytes.buffer, bytes.byteOffset + wkbStart, bytes.byteLength - wkbStart);
  try {
    const result = wkbRead(dv, 0);
    return result ? result.geo : null;
  } catch (e) {
    console.warn('WKB parse error:', e);
    return null;
  }
}

function wkbRead(dv, pos) {
  if (pos + 5 > dv.byteLength) return null;
  const le = dv.getUint8(pos) === 1; pos++;
  let type = dv.getUint32(pos, le); pos += 4;

  // Handle Z/M/ZM variants (ISO WKB type codes)
  let hasZ = false, hasM = false;
  if (type >= 3000)      { type -= 3000; hasZ = true; hasM = true; }
  else if (type >= 2000) { type -= 2000; hasZ = true; }
  else if (type >= 1000) { type -= 1000; hasM = true; }

  const dims = 2 + (hasZ ? 1 : 0) + (hasM ? 1 : 0);

  function readPts(n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const c = [dv.getFloat64(pos, le), dv.getFloat64(pos + 8, le)];
      if (hasZ) c.push(dv.getFloat64(pos + 16, le));
      pos += dims * 8;
      pts.push(c);
    }
    return pts;
  }

  function readSubs() {
    const n = dv.getUint32(pos, le); pos += 4;
    const geoms = [];
    for (let i = 0; i < n; i++) {
      const r = wkbRead(dv, pos);
      if (!r) return null;
      geoms.push(r.geo);
      pos = r.pos;
    }
    return geoms;
  }

  // Point (1)
  if (type === 1) {
    const c = readPts(1);
    return { geo: { type: 'Point', coordinates: c[0] }, pos };
  }
  // LineString (2) or CircularString (8) — same binary layout
  if (type === 2 || type === 8) {
    const n = dv.getUint32(pos, le); pos += 4;
    return { geo: { type: 'LineString', coordinates: readPts(n) }, pos };
  }
  // Polygon (3)
  if (type === 3) {
    const nRings = dv.getUint32(pos, le); pos += 4;
    const rings = [];
    for (let i = 0; i < nRings; i++) {
      const n = dv.getUint32(pos, le); pos += 4;
      rings.push(readPts(n));
    }
    return { geo: { type: 'Polygon', coordinates: rings }, pos };
  }
  // MultiPoint (4)
  if (type === 4) {
    const subs = readSubs();
    if (!subs) return null;
    return { geo: { type: 'MultiPoint', coordinates: subs.map(g => g.coordinates) }, pos };
  }
  // MultiLineString (5)
  if (type === 5) {
    const subs = readSubs();
    if (!subs) return null;
    return { geo: { type: 'MultiLineString', coordinates: subs.map(g => g.coordinates) }, pos };
  }
  // MultiPolygon (6)
  if (type === 6) {
    const subs = readSubs();
    if (!subs) return null;
    return { geo: { type: 'MultiPolygon', coordinates: subs.map(g => g.coordinates) }, pos };
  }
  // CompoundCurve (9) — concatenate sub-curves into one LineString
  if (type === 9) {
    const subs = readSubs();
    if (!subs) return null;
    let all = [];
    for (const g of subs) {
      const c = g.coordinates || [];
      // Skip duplicate join point between consecutive curves
      if (all.length && c.length &&
          all[all.length - 1][0] === c[0][0] &&
          all[all.length - 1][1] === c[0][1]) {
        all.push(...c.slice(1));
      } else {
        all.push(...c);
      }
    }
    return { geo: { type: 'LineString', coordinates: all }, pos };
  }
  // CurvePolygon (10) — rings can be curves
  if (type === 10) {
    const subs = readSubs();
    if (!subs) return null;
    return { geo: { type: 'Polygon', coordinates: subs.map(g => g.coordinates) }, pos };
  }
  // MultiCurve (11) → MultiLineString
  if (type === 11) {
    const subs = readSubs();
    if (!subs) return null;
    return { geo: { type: 'MultiLineString', coordinates: subs.map(g => g.coordinates) }, pos };
  }
  // MultiSurface (12) → MultiPolygon
  if (type === 12) {
    const subs = readSubs();
    if (!subs) return null;
    return { geo: { type: 'MultiPolygon', coordinates: subs.map(g => g.coordinates) }, pos };
  }
  console.warn('Unknown WKB type:', type);
  return null;
}

/**
 * Load a GeoPackage from an ArrayBuffer and render features on the map.
 * @param {ArrayBuffer} gpkgBuffer - The .gpkg file content
 * @param {function} closePopupFn
 * @param {function} setLoadingFn
 */
export const loadGpkgBuffer = async (gpkgBuffer, closePopupFn, setLoadingFn) => {

  if (typeof GeoPackage === 'undefined' || typeof GeoPackage.GeoPackageAPI === 'undefined') {
    throw new Error("GeoPackage library is niet geladen.");
  }

  setLoadingFn(true, "GeoPackage verwerken…");

  // Point sql.js WASM file to CDN matching the rtree-sql.js version bundled in @ngageoint/geopackage@4
  if (typeof GeoPackage.setSqljsWasmLocateFile === 'function') {
    GeoPackage.setSqljsWasmLocateFile(
      filename => `https://cdn.jsdelivr.net/npm/rtree-sql.js@1.7.0/dist/${filename}`
    );
  }

  const geopackage = await GeoPackage.GeoPackageAPI.open(new Uint8Array(gpkgBuffer));
  const featureTableNames = geopackage.getFeatureTables();

  if (!featureTableNames.length) {
    geopackage.close();
    throw new Error("Geen feature-tabellen gevonden in GeoPackage.");
  }

  clearAllDataLayers();
  showLoadingLayers(featureTableNames);

  const allFeatures = [];
  const layers = [];
  const geojsonFormat = new ol.format.GeoJSON();

  for (const tableName of featureTableNames) {
    try {
      setLoadingFn(true, `Laag "${tableName}" verwerken…`);
      const featureCollection = { type: "FeatureCollection", features: [] };

      // Manual row iteration to avoid library's internal geometry error logging
      const featureDao = geopackage.getFeatureDao(tableName);
      const srs = featureDao.srs;
      const geomColName = featureDao.geometryColumnName;
      const each = featureDao.queryForEach();
      let useRawParsing = false;

      for (const rawRow of each) {
        try {
          const featureRow = featureDao.getRow(rawRow);
          let geojson = null;

          // Always get the geomData wrapper — raw bytes live on it even when parsing fails
          const geomData = featureRow.geometry;
          if (!geomData) continue;

          if (!useRawParsing) {
            // Try library parser first
            if (geomData.geometry) {
              try { geojson = geomData.geometry.toGeoJSON(); } catch (_) {}
            }
            if (!geojson) {
              // Library failed — switch to raw WKB parsing for all features in this table
              useRawParsing = true;
              console.log(`ℹ️ Layer "${tableName}": library geometry parser failed, using raw WKB parser`);
            }
          }

          if (!geojson) {
            // Raw parsing: extract bytes from the geomData wrapper
            const raw = geomData.geometryData || geomData.bytes || geomData.buffer;
            if (raw) geojson = parseGpkgBinaryToGeoJSON(raw);
            if (!geojson) continue;
          }

          const props = {};
          for (const col of featureRow.columnNames) {
            if (col !== (featureRow.geometryColumn?.name || geomColName)) {
              props[col] = featureRow.getValueWithColumnName(col);
            }
          }
          featureCollection.features.push({
            type: "Feature",
            geometry: geojson,
            properties: props
          });
        } catch (_) {
          // Skip features with unparseable geometry
        }
      }

      if (!featureCollection.features.length) {
        console.warn(`⚠️ Layer "${tableName}": 0 features, skipping`);
        markLayerLoaded(tableName, 0);
        continue;
      }

      const dataProjection = srs
        ? [srs.organization.toUpperCase(), srs.organization_coordsys_id].join(':')
        : detectDataProjection(featureCollection, "");

      console.log(`📐 Layer "${tableName}": projection=${dataProjection}, features=${featureCollection.features.length}`);

      const olFeatures = geojsonFormat.readFeatures(featureCollection, {
        dataProjection,
        featureProjection: "EPSG:28992"
      });
      for (const f of olFeatures) {
        f.set('_layerName', tableName);
      }

      layers.push({
        name: tableName,
        geojson: featureCollection,
        featureCount: featureCollection.features.length
      });

      allFeatures.push(...olFeatures);

      // Add layer to map and show checkbox immediately
      addDataLayer(tableName, olFeatures);
      markLayerLoaded(tableName, featureCollection.features.length);
      console.log(`✅ Layer "${tableName}": ${olFeatures.length} OL features added`);
    } catch (err) {
      console.error(`❌ Error loading layer "${tableName}":`, err);
      markLayerLoaded(tableName, 0);
    }

    // Yield to browser so spinner updates render
    await new Promise(r => setTimeout(r, 0));
  }

  geopackage.close();

  if (!allFeatures.length) {
    throw new Error("Geen features gevonden in GeoPackage.");
  }

  closePopupFn();
  zoomToData();
};
