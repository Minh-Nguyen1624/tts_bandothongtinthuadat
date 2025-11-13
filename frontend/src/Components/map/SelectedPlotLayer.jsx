// SelectedPlotLayer.jsx
import React, { useMemo } from "react";
import { Polygon, Popup } from "react-leaflet";
import PlotInfo from "./PlotPopupContent";

const SelectedPlotLayer = ({ selectedPlot, plotBoundary, isLoading }) => {
  const renderedSelectedPlot = useMemo(() => {
    if (!selectedPlot || !plotBoundary || isLoading) return null;
    return plotBoundary.map((polygonCoords, polyIndex) => (
      <Polygon
        key={`selected-plot-${selectedPlot.id}-${polyIndex}`}
        positions={polygonCoords}
        pathOptions={{
          color: "#ff0000",
          fillColor: "#ff0000",
          fillOpacity: 0.3,
          weight: 4,
          stroke: true,
          lineJoin: "round",
          className: "selected-plot-highlight",
        }}
      >
        <Popup>
          <div style={{ minWidth: "280px" }}>
            <strong style={{ color: "#ff0000" }}>LÔ ĐẤT ĐƯỢC CHỌN</strong>
            <PlotInfo plot={selectedPlot} />
          </div>
        </Popup>
      </Polygon>
    ));
  }, [selectedPlot, plotBoundary, isLoading]);

  return <>{renderedSelectedPlot}</>;
};

export default SelectedPlotLayer;
