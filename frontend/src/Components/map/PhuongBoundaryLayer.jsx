// PhuongBoundaryLayer.jsx
import React, { useMemo } from "react";
import { Polygon, Popup } from "react-leaflet";

const PhuongBoundaryLayer = ({ phuongBoundary }) => {
  const renderedPhuongBoundary = useMemo(() => {
    if (!phuongBoundary || !phuongBoundary.coordinates) return null;
    return phuongBoundary.coordinates.map((polygonCoords, index) => (
      <Polygon
        key={`phuong-boundary-${phuongBoundary.name}-${index}`}
        positions={polygonCoords}
        pathOptions={{
          color: "#ff0000",
          fillColor: "transparent",
          fillOpacity: 0,
          weight: 3,
          stroke: true,
          lineJoin: "round",
          dashArray: "5, 5",
          className: "phuong-boundary",
        }}
      >
        <Popup>
          <div style={{ minWidth: "200px" }}>
            <strong>Phường/Xã: {phuongBoundary.name}</strong>
            {phuongBoundary.ma_hanh_chinh && (
              <p>Mã hành chính: {phuongBoundary.ma_hanh_chinh}</p>
            )}
            <p>Ranh giới hành chính</p>
          </div>
        </Popup>
      </Polygon>
    ));
  }, [phuongBoundary]);

  return <>{renderedPhuongBoundary}</>;
};

export default PhuongBoundaryLayer;
