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

// /**
//  * 🧭 Convert geometry coordinates to Leaflet format [lat, lng]
//  * with auto scaling for VN2000 → WGS84
//  */
// export function convertGeoJSONToLeaflet(geometry) {
//   if (!geometry?.coordinates) return null;

//   const convertCoord = ([x, y]) => {
//     if (Math.abs(x) > 180 || Math.abs(y) > 90) {
//       // scale meters → degrees
//       x = 106 + (x - 500000) / 100000;
//       y = 10 + (y - 1100000) / 100000;
//     }
//     return [y, x]; // Leaflet expects [lat, lng]
//   };

//   const convertRing = (ring) => ring.map(convertCoord);
//   const convertPolygon = (poly) => poly.map(convertRing);

//   switch (geometry.type) {
//     case "Point":
//       return [convertCoord(geometry.coordinates)];
//     case "LineString":
//       return [geometry.coordinates.map(convertCoord)];
//     case "Polygon":
//       return [convertPolygon(geometry.coordinates)];
//     case "MultiPolygon":
//       return geometry.coordinates.map(convertPolygon);
//     default:
//       return null;
//   }
// }

/**
 * 🧭 Convert geometry coordinates to Leaflet format [lat, lng]
 * Fix NaN error and improve coordinate handling
 */
export function convertGeoJSONToLeaflet(geometry) {
  console.log("🔧 convertGeoJSONToLeaflet called with:", {
    hasGeometry: !!geometry,
    type: geometry?.type,
    hasCoordinates: !!geometry?.coordinates,
    coordinatesType: Array.isArray(geometry?.coordinates) ? 'array' : typeof geometry?.coordinates,
    coordinatesLength: Array.isArray(geometry?.coordinates) ? geometry.coordinates.length : 'N/A',
    geometry: geometry
  });

  if (!geometry) {
    console.error("❌ No geometry provided");
    return null;
  }

  if (!geometry.type) {
    console.error("❌ Geometry missing type:", geometry);
    return null;
  }

  // GeometryCollection doesn't have coordinates, it has geometries
  if (geometry.type === 'GeometryCollection') {
    if (!geometry.geometries || !Array.isArray(geometry.geometries)) {
      console.error("❌ GeometryCollection missing geometries array:", geometry);
      return null;
    }
    // Will be handled in the switch statement below
  } else {
    // For other geometry types, check coordinates
    if (!geometry.coordinates) {
      console.error("❌ Geometry missing coordinates:", geometry);
      return null;
    }
  }

  console.log("🔧 Converting geometry type:", geometry.type);

  const convertCoord = ([x, y]) => {
    // Validate coordinates
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      isNaN(x) ||
      isNaN(y)
    ) {
      console.warn("Invalid coordinate detected:", [x, y]);
      return [10.367, 106.345]; // Fallback to safe coordinates
    }

    // Check if coordinates are already in degrees (WGS84)
    // WGS84 ranges: longitude: -180 to 180, latitude: -90 to 90
    const isWGS84 = Math.abs(x) <= 180 && Math.abs(y) <= 90;

    if (isWGS84) {
      // Already in WGS84 degrees, just swap for Leaflet [lat, lng]
      return [y, x];
    } else {
      // Likely in projected coordinates (VN2000 meters)
      // Use approximate scaling for Vietnam coordinates
      // This is a simplified conversion - adjust based on your actual projection
      const lat = 10.3 + (y - 1100000) / 100000;
      const lng = 106.3 + (x - 500000) / 100000;

      // Validate converted coordinates
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        console.warn("Coordinate conversion failed, using fallback:", [
          lat,
          lng,
        ]);
        return [10.367, 106.345]; // Fallback
      }

      return [lat, lng];
    }
  };

  const convertRing = (ring) => {
    if (!Array.isArray(ring)) return [];
    return ring.map((coord) => {
      if (Array.isArray(coord) && coord.length >= 2) {
        return convertCoord([coord[0], coord[1]]);
      }
      console.warn("Invalid ring coordinate:", coord);
      return [10.367, 106.345]; // Fallback
    });
  };

  const convertPolygon = (poly) => {
    if (!Array.isArray(poly)) return [];
    return poly.map((ring) => convertRing(ring));
  };

  try {
    let result;

    switch (geometry.type) {
      case "Point":
        result = [convertCoord(geometry.coordinates)];
        break;
      case "LineString":
        result = [geometry.coordinates.map(convertCoord)];
        break;
      case "Polygon":
        result = convertPolygon(geometry.coordinates);
        break;
      case "MultiPolygon":
        result = geometry.coordinates.map(convertPolygon);
        break;
      case "MultiLineString":
        result = geometry.coordinates.map((line) => line.map(convertCoord));
        break;
      case "MultiPoint":
        result = [geometry.coordinates.map(convertCoord)];
        break;
      case "GeometryCollection":
        // GeometryCollection contains an array of geometries
        console.log("🔧 Processing GeometryCollection with", geometry.geometries?.length || 0, "geometries");
        
        if (!geometry.geometries || !Array.isArray(geometry.geometries)) {
          console.error("❌ GeometryCollection missing geometries array");
          return null;
        }

        // Convert each geometry in the collection
        const convertedGeometries = [];
        for (const geom of geometry.geometries) {
          if (!geom || !geom.type) {
            console.warn("⚠️ Skipping invalid geometry in collection:", geom);
            continue;
          }
          
          const converted = convertGeoJSONToLeaflet(geom);
          if (converted) {
            // If it's a polygon or multipolygon, we may need to flatten
            if (Array.isArray(converted)) {
              if (geom.type === 'Polygon') {
                // Polygon returns [[ring1], [ring2], ...], wrap it
                convertedGeometries.push(converted);
              } else if (geom.type === 'MultiPolygon') {
                // MultiPolygon returns [[poly1], [poly2], ...], spread them
                convertedGeometries.push(...converted);
              } else {
                // LineString, etc. - add as is
                convertedGeometries.push(converted);
              }
            } else {
              convertedGeometries.push(converted);
            }
          } else {
            console.warn("⚠️ Failed to convert geometry in collection:", geom.type);
          }
        }

        console.log("🔧 GeometryCollection converted to", convertedGeometries.length, "geometries");
        result = convertedGeometries.length > 0 ? convertedGeometries : null;
        break;
      default:
        console.warn("Unsupported geometry type:", geometry.type);
        return null;
    }

    console.log("🔧 Conversion result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error in convertGeoJSONToLeaflet:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Geometry that caused error:", geometry);
    return null;
  }
}

export default { processGeometryData, convertGeoJSONToLeaflet };
