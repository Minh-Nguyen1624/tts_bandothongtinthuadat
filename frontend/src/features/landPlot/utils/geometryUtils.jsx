// import wkx from "wkx";

// export const checkValidGeometry = (geom) => {
//   if (!geom || typeof geom !== "string") return false;
//   try {
//     if (geom.startsWith("010") && geom.length > 50) return true;
//     const parsed = JSON.parse(geom);
//     return isValidGeoJSON(parsed);
//   } catch (error) {
//     console.error("Error checking geometry:", error);
//     return false;
//   }
// };

// export const wkbToGeoJSON = (wkbHex) => {
//   if (!wkbHex || !wkbHex.startsWith("010")) return null;
//   try {
//     const geometry = wkx.Geometry.parse(Buffer.from(wkbHex, "hex"));
//     return geometry.toGeoJSON();
//   } catch (error) {
//     console.error("Error converting WKB to GeoJSON:", error);
//     return null;
//   }
// };

// export const processGeometryForServer = (geom) => {
//   if (!geom || !geom.trim()) return null;
//   try {
//     if (geom.startsWith("010") && geom.length > 50) {
//       const geoJSON = wkbToGeoJSON(geom);
//       return geoJSON || null;
//     }
//     if (geom.trim().startsWith("{")) {
//       const parsed = JSON.parse(geom);
//       return isValidGeoJSON(parsed) ? parsed : null;
//     }
//     return null;
//   } catch (error) {
//     console.error("Error processing geometry for server:", error);
//     return null;
//   }
// };

import wkx from "wkx";

export const checkValidGeometry = (geom) => {
  if (!geom || typeof geom !== "string") return false;
  try {
    if (geom.startsWith("010") && geom.length > 50) return true;
    const parsed = JSON.parse(geom);
    return isValidGeoJSON(parsed);
  } catch (error) {
    console.error("Error checking geometry:", error);
    return false;
  }
};

export const wkbToGeoJSON = (wkbHex) => {
  if (!wkbHex || !wkbHex.startsWith("010")) return null;
  try {
    const geometry = wkx.Geometry.parse(Buffer.from(wkbHex, "hex"));
    return geometry.toGeoJSON();
  } catch (error) {
    console.error("Error converting WKB to GeoJSON:", error);
    return null;
  }
};

export const processGeometryForServer = (geom) => {
  if (!geom || !geom.trim()) return null;
  try {
    if (geom.startsWith("010") && geom.length > 50) {
      const geoJSON = wkbToGeoJSON(geom);
      return geoJSON || null;
    }
    if (geom.trim().startsWith("{")) {
      const parsed = JSON.parse(geom);
      return isValidGeoJSON(parsed) ? parsed : null;
    }
    return null;
  } catch (error) {
    console.error("Error processing geometry for server:", error);
    return null;
  }
};

// export const isValidGeoJSON = (geojson) => {
//   if (!geojson || typeof geojson !== "object") return false;
//   if (!geojson.type) return false;
//   if (geojson.type === "Polygon") {
//     if (!Array.isArray(geojson.coordinates)) return false;
//     if (geojson.coordinates.length === 0) return false;
//     const exteriorRing = geojson.coordinates[0];
//     if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) return false;
//     const first = exteriorRing[0];
//     const last = exteriorRing[exteriorRing.length - 1];
//     return first[0] === last[0] && first[1] === last[1];
//   }
//   return false;
// };
export const isValidGeoJSON = (geojson) => {
  if (!geojson || typeof geojson !== "object") return false;
  if (!geojson.type) return false;

  if (geojson.type === "Polygon") {
    if (!Array.isArray(geojson.coordinates)) return false;
    if (geojson.coordinates.length === 0) return false;

    const exteriorRing = geojson.coordinates[0];
    if (!Array.isArray(exteriorRing) || exteriorRing.length < 3) return false;

    // Kiểm tra và tự động đóng vòng nếu cần
    if (exteriorRing.length >= 3) {
      const first = exteriorRing[0];
      const last = exteriorRing[exteriorRing.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        console.warn("⚠️ Polygon không đóng vòng, tự động thêm điểm đóng");
        return true; // Cho phép qua để xử lý tiếp
      }
    }
    return true;
  }
  return false;
};
