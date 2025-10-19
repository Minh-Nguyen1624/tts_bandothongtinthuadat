// geometryProcessor.js — fully browser-optimized version (no dependencies)
// Handles WKB, GeoJSON, and coordinate scaling for Leaflet

/**
 * 🧩 Main geometry processor
 */
export function processGeometryData(geom) {
  if (!geom) return null;

  if (typeof geom === "string") return processStringGeometry(geom);
  if (typeof geom === "object") return processObjectGeometry(geom);

  return null;
}

/**
 * 🧩 Handle string geometry (WKB hex or JSON)
 */
function processStringGeometry(geomString) {
  try {
    // Detect WKB hex (only hex digits)
    if (/^[0-9a-fA-F]+$/.test(geomString)) {
      return parseWKB(geomString);
    }

    // Detect JSON (GeoJSON)
    if (
      geomString.trim().startsWith("{") ||
      geomString.trim().startsWith("[")
    ) {
      return processObjectGeometry(JSON.parse(geomString));
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 🧩 Handle GeoJSON or object geometry
 */
function processObjectGeometry(geomObj) {
  if (!geomObj || typeof geomObj !== "object") return null;

  if (geomObj.type && geomObj.coordinates) return geomObj;
  if (geomObj.type === "Feature" && geomObj.geometry)
    return processObjectGeometry(geomObj.geometry);
  if (geomObj.type === "FeatureCollection" && Array.isArray(geomObj.features))
    return processObjectGeometry(geomObj.features[0]?.geometry);
  if (Array.isArray(geomObj)) return { type: "Array", coordinates: geomObj };

  return null;
}

/**
 * 🧩 Parse WKB (Well-Known Binary)
 */
function parseWKB(wkbHex) {
  const bytes = hexToBytes(wkbHex);
  if (!bytes.length) return null;

  const isLittleEndian = bytes[0] === 1;
  let geometryType = readUInt32(bytes, 1, isLittleEndian);
  let offset = 5;

  const hasSRID = (geometryType & 0x20000000) !== 0;
  if (hasSRID) {
    geometryType &= 0x1fffffff;
    offset += 4;
  }

  switch (geometryType) {
    case 1:
      return parseWKBPoint(bytes, offset, isLittleEndian);
    case 2:
      return parseWKBLineString(bytes, offset, isLittleEndian);
    case 3:
      return parseWKBPolygon(bytes, offset, isLittleEndian);
    case 4:
      return parseWKBMultiPoint(bytes, offset, isLittleEndian);
    case 5:
      return parseWKBMultiLineString(bytes, offset, isLittleEndian);
    case 6:
      return parseWKBMultiPolygon(bytes, offset, isLittleEndian);
    default:
      return null;
  }
}

/* --- Low-level binary utils --- */
function hexToBytes(hex) {
  const out = [];
  for (let i = 0; i < hex.length; i += 2)
    out.push(parseInt(hex.substr(i, 2), 16));
  return out;
}

function readUInt32(b, o, le) {
  if (le) return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24);
  return (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3];
}

function readDouble(b, o, le) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  for (let i = 0; i < 8; i++) view.setUint8(i, b[o + (le ? i : 7 - i)]);
  return view.getFloat64(0, true);
}

/* --- Geometry parsers --- */
function parseWKBPoint(b, o, le) {
  return {
    type: "Point",
    coordinates: [readDouble(b, o, le), readDouble(b, o + 8, le)],
  };
}

function parseWKBLineString(b, o, le) {
  const n = readUInt32(b, o, le);
  o += 4;
  const coords = [];
  for (let i = 0; i < n; i++, o += 16)
    coords.push([readDouble(b, o, le), readDouble(b, o + 8, le)]);
  return { type: "LineString", coordinates: coords };
}

function parseWKBPolygon(b, o, le) {
  const numRings = readUInt32(b, o, le);
  o += 4;
  const coords = [];
  for (let r = 0; r < numRings; r++) {
    const numPts = readUInt32(b, o, le);
    o += 4;
    const ring = [];
    for (let p = 0; p < numPts; p++, o += 16)
      ring.push([readDouble(b, o, le), readDouble(b, o + 8, le)]);
    coords.push(ring);
  }
  return { type: "Polygon", coordinates: coords };
}

function parseWKBMultiPoint(b, o, le) {
  const n = readUInt32(b, o, le);
  o += 4;
  const coords = [];
  for (let i = 0; i < n; i++) {
    o += 5;
    coords.push([readDouble(b, o, le), readDouble(b, o + 8, le)]);
    o += 16;
  }
  return { type: "MultiPoint", coordinates: coords };
}

function parseWKBMultiLineString(b, o, le) {
  const n = readUInt32(b, o, le);
  o += 4;
  const coords = [];
  for (let i = 0; i < n; i++) {
    o += 5;
    const numPts = readUInt32(b, o, le);
    o += 4;
    const line = [];
    for (let j = 0; j < numPts; j++, o += 16)
      line.push([readDouble(b, o, le), readDouble(b, o + 8, le)]);
    coords.push(line);
  }
  return { type: "MultiLineString", coordinates: coords };
}

function parseWKBMultiPolygon(b, o, le) {
  const n = readUInt32(b, o, le);
  o += 4;
  const coords = [];
  for (let i = 0; i < n; i++) {
    o += 5;
    const numRings = readUInt32(b, o, le);
    o += 4;
    const polygon = [];
    for (let r = 0; r < numRings; r++) {
      const numPts = readUInt32(b, o, le);
      o += 4;
      const ring = [];
      for (let p = 0; p < numPts; p++, o += 16)
        ring.push([readDouble(b, o, le), readDouble(b, o + 8, le)]);
      polygon.push(ring);
    }
    coords.push(polygon);
  }
  return { type: "MultiPolygon", coordinates: coords };
}

/**
 * 🧭 Convert geometry coordinates to Leaflet format [lat, lng]
 * with auto scaling for VN2000 → WGS84
 */
export function convertGeoJSONToLeaflet(geometry) {
  if (!geometry?.coordinates) return null;

  const convertCoord = ([x, y]) => {
    if (Math.abs(x) > 180 || Math.abs(y) > 90) {
      // scale meters → degrees
      x = 106 + (x - 500000) / 100000;
      y = 10 + (y - 1100000) / 100000;
    }
    return [y, x]; // Leaflet expects [lat, lng]
  };

  const convertRing = (ring) => ring.map(convertCoord);
  const convertPolygon = (poly) => poly.map(convertRing);

  switch (geometry.type) {
    case "Point":
      return [convertCoord(geometry.coordinates)];
    case "LineString":
      return [geometry.coordinates.map(convertCoord)];
    case "Polygon":
      return [convertPolygon(geometry.coordinates)];
    case "MultiPolygon":
      return geometry.coordinates.map(convertPolygon);
    default:
      return null;
  }
}

export default { processGeometryData, convertGeoJSONToLeaflet };
