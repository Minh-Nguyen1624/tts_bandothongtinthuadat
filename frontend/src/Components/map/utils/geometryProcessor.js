// utils/geometryProcessor.js
export const processGeometryData = (geometry) => {
  try {
    if (!geometry) return null;
    let g = geometry;
    if (typeof g === "string") g = JSON.parse(g);
    if (g.type === "FeatureCollection" && g.features?.[0]?.geometry)
      g = g.features[0].geometry;
    if (g.type === "Feature" && g.geometry) g = g.geometry;
    return g;
  } catch (e) {
    console.error("processGeometryData:", e);
    return null;
  }
};

export const convertGeoJSONToLeaflet = (geojson) => {
  if (!geojson?.coordinates) return null;
  const convert = (c) => {
    if (c.length === 2 && typeof c[0] === "number") return [c[1], c[0]];
    return c.map(convert);
  };
  if (geojson.type === "Polygon") return [convert(geojson.coordinates)];
  if (geojson.type === "MultiPolygon") return geojson.coordinates.map(convert);
  return null;
};
