// UpdateMapView.jsx
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

const UpdateMapView = ({ center, zoom, shouldUpdate }) => {
  const map = useMap();
  useEffect(() => {
    if (
      shouldUpdate &&
      center &&
      Array.isArray(center) &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1]) &&
      Math.abs(center[0]) <= 90 &&
      Math.abs(center[1]) <= 180
    ) {
      map.setView(center, zoom);
    } else {
      console.warn("Invalid center coordinates, skipping update:", center);
    }
  }, [map, center, zoom, shouldUpdate]);
  return null;
};

export default UpdateMapView;
