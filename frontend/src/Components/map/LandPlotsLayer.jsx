// Components/map/LandPlotsLayer.jsx
import React, { useMemo } from "react";
import { Polygon, Popup } from "react-leaflet";
import { getColorByLoaiDat } from "./utils/mapUtils";
import PlotInfo from "./PlotPopupContent";

// XỬ LÝ GEOMETRY – SAO CHÉP TỪ FILE GỐC
const processPlotGeometry = (plot) => {
  const results = { geometries: [], source: "none", details: [] };

  // ƯU TIÊN: land_use_details có leafletGeometry
  if (plot.land_use_details && plot.land_use_details.length > 0) {
    const validDetails = plot.land_use_details
      .map((detail) => {
        if (detail.leafletGeometry) {
          return {
            ...detail,
            color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
            leafletGeometry: detail.leafletGeometry,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (validDetails.length > 0) {
      results.geometries = validDetails.flatMap((d) => d.leafletGeometry);
      results.details = validDetails;
      results.source = "land_use_details";
      return results;
    }
  }

  // Nếu không có → dùng geom
  if (plot.geom) {
    try {
      let coords = plot.geom;
      if (typeof plot.geom === "string") {
        coords = JSON.parse(plot.geom);
      }
      if (coords && coords.coordinates) {
        const leafletCoords = L.GeoJSON.geometryToLayer(coords).getLatLngs();
        if (leafletCoords.length > 0) {
          const landTypes = Array.isArray(plot.ky_hieu_mdsd)
            ? plot.ky_hieu_mdsd
            : [plot.ky_hieu_mdsd || "UNKNOWN"];
          const details = landTypes.map((type) => ({
            ky_hieu_mdsd: type,
            dien_tich: plot.dien_tich || "0",
            color: getColorByLoaiDat(type),
            leafletGeometry: leafletCoords,
          }));
          results.geometries = leafletCoords;
          results.details = details;
          results.source = "main_geom";
          return results;
        }
      }
    } catch (e) {
      console.error("Lỗi parse geom:", e);
    }
  }

  // Fallback
  if (plot.lat && plot.lng) {
    const lat = parseFloat(plot.lat),
      lng = parseFloat(plot.lng);
    const o = 0.0001;
    const box = [
      [
        [lng - o, lat - o],
        [lng + o, lat - o],
        [lng + o, lat + o],
        [lng - o, lat + o],
        [lng - o, lat - o],
      ],
    ];
    const details = [
      {
        ky_hieu_mdsd: plot.ky_hieu_mdsd || "UNKNOWN",
        dien_tich: plot.dien_tich || "0",
        color: getColorByLoaiDat(plot.ky_hieu_mdsd || "UNKNOWN"),
        leafletGeometry: box,
      },
    ];
    results.geometries = box;
    results.details = details;
    results.source = "fallback";
    return results;
  }

  return null;
};

const LandPlotsLayer = ({ landUseData, zoomLevel, isLoading }) => {
  const getStyle = (z) => {
    if (z >= 20) return { opacity: 0.9, weight: 4 };
    if (z >= 18) return { opacity: 0.85, weight: 3 };
    if (z >= 16) return { opacity: 0.8, weight: 2.5 };
    if (z >= 14) return { opacity: 0.7, weight: 2 };
    if (z >= 12) return { opacity: 0.6, weight: 1.5, dashArray: "2,2" };
    return { opacity: 0.5, weight: 1, dashArray: "3,3" };
  };

  const style = getStyle(zoomLevel);

  const rendered = useMemo(() => {
    if (isLoading || !landUseData.length) return null;

    let keyId = 0;

    return landUseData
      .map((plot) => {
        const processed = processPlotGeometry(plot);
        if (!processed) return null;

        return processed.details.map((detail) => {
          return detail.leafletGeometry.map((coords) => {
            const key = `poly-${plot.id}-${detail.ky_hieu_mdsd}-${keyId++}`;
            const fill = detail.color;
            return (
              <Polygon
                key={key}
                positions={coords}
                pathOptions={{
                  color: fill,
                  fillColor: fill,
                  fillOpacity: style.opacity,
                  weight: style.weight,
                  dashArray: style.dashArray,
                }}
              >
                <Popup>
                  <PlotInfo plot={plot} detail={detail} />
                </Popup>
              </Polygon>
            );
          });
        });
      })
      .flat(2)
      .filter(Boolean);
  }, [landUseData, zoomLevel, isLoading]);

  return <>{rendered}</>;
};

export default LandPlotsLayer;
