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
  if (!geom) return false;

  // Nếu là object, kiểm tra trực tiếp
  if (typeof geom === "object" && geom !== null) {
    return isValidGeoJSON(geom);
  }

  // Nếu là string
  if (typeof geom === "string") {
    try {
      if (geom.startsWith("010") && geom.length > 50) return true;
      const parsed = JSON.parse(geom);
      return isValidGeoJSON(parsed);
    } catch (error) {
      console.error("Error checking geometry:", error);
      return false;
    }
  }

  return false;
};

export const wkbToGeoJSON = (wkbInput) => {
  if (!wkbInput) return null;

  try {
    // Nếu đã là GeoJSON object, trả về luôn
    if (typeof wkbInput === "object" && wkbInput !== null) {
      return isValidGeoJSON(wkbInput) ? wkbInput : null;
    }

    // Nếu là WKB hex string
    if (typeof wkbInput === "string" && wkbInput.startsWith("010")) {
      const geometry = wkx.Geometry.parse(Buffer.from(wkbInput, "hex"));
      return geometry.toGeoJSON();
    }

    return null;
  } catch (error) {
    console.error("Error converting to GeoJSON:", error);
    return null;
  }
};

export const processGeometryForServer = (geom) => {
  if (!geom) return null;

  try {
    // Nếu đã là GeoJSON object hợp lệ
    if (typeof geom === "object" && isValidGeoJSON(geom)) {
      return geom;
    }

    // Nếu là string
    if (typeof geom === "string") {
      if (geom.startsWith("010") && geom.length > 50) {
        const geoJSON = wkbToGeoJSON(geom);
        return geoJSON || null;
      }
      if (geom.trim().startsWith("{")) {
        const parsed = JSON.parse(geom);
        return isValidGeoJSON(parsed) ? parsed : null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error processing geometry for server:", error);
    return null;
  }
};

export const isValidGeoJSON = (geojson) => {
  if (!geojson || typeof geojson !== "object") return false;
  if (!geojson.type) return false;

  const validTypes = [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
    "GeometryCollection",
    "Feature",
    "FeatureCollection",
  ];

  if (!validTypes.includes(geojson.type)) {
    return false;
  }

  // Kiểm tra cơ bản cho các type phổ biến
  switch (geojson.type) {
    case "Point":
      return (
        Array.isArray(geojson.coordinates) && geojson.coordinates.length >= 2
      );

    case "LineString":
      return (
        Array.isArray(geojson.coordinates) && geojson.coordinates.length >= 2
      );

    case "Polygon":
      if (!Array.isArray(geojson.coordinates)) return false;
      if (geojson.coordinates.length === 0) return false;

      const exteriorRing = geojson.coordinates[0];
      if (!Array.isArray(exteriorRing) || exteriorRing.length < 3) return false;

      // Kiểm tra đóng vòng (không bắt buộc để linh hoạt)
      const first = exteriorRing[0];
      const last = exteriorRing[exteriorRing.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        console.warn("⚠️ Polygon không đóng vòng, nhưng vẫn cho phép");
      }
      return true;

    case "MultiPolygon":
      return (
        Array.isArray(geojson.coordinates) && geojson.coordinates.length > 0
      );

    default:
      return true; // Cho các type khác, để server xử lý validation
  }
};
