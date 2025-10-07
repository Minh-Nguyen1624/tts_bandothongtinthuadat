// components/GeometryDebug.js
import React from "react";

const GeometryDebug = ({ geom }) => {
  if (!geom) {
    return (
      <div
        style={{
          padding: "10px",
          margin: "10px 0",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "4px",
          fontSize: "12px",
        }}
      >
        <strong>Geometry Debug:</strong> No geometry data
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "10px",
        margin: "10px 0",
        backgroundColor: "#d1ecf1",
        border: "1px solid #bee5eb",
        borderRadius: "4px",
        fontSize: "12px",
      }}
    >
      <strong>Geometry Debug Info:</strong>
      <div>Raw data length: {geom.length}</div>
      <div>Format: EWKB Hex</div>
      <div>First 50 chars: {geom.substring(0, 50)}...</div>

      <div style={{ marginTop: "8px" }}>
        <strong>Analysis:</strong> PostGIS EWKB Format
      </div>
      <div>SRID: 4326 (WGS84)</div>
      <div>Type: Polygon</div>

      <details style={{ marginTop: "8px" }}>
        <summary>Raw Data (first 200 chars)</summary>
        <code
          style={{
            display: "block",
            wordBreak: "break-all",
            marginTop: "4px",
            fontSize: "10px",
          }}
        >
          {geom.substring(0, 200)}
        </code>
      </details>
    </div>
  );
};

export default GeometryDebug;
