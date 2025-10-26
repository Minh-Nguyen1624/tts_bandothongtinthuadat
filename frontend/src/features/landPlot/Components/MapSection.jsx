import React from "react";
import {
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExpand,
} from "react-icons/fa";
import LandPlotMap from "../../../shared/Components/LandPlotMap";

const MapSection = ({
  geom,
  plotInfo,
  isMapExpanded,
  toggleMapExpand,
  hasValidGeometry,
}) => (
  <div className={`map-section ${isMapExpanded ? "expanded" : ""}`}>
    <div className="map-header">
      <div className="map-title-section">
        <h3 className="map-title">
          <FaGlobe className="map-icon" />
          Hình dạng thửa đất
        </h3>
        <div className="map-status">
          <span
            className={`status-badge ${
              hasValidGeometry ? "success" : "warning"
            }`}
            role="status"
          >
            {hasValidGeometry ? (
              <>
                <FaCheckCircle className="status-icon" />
                Có dữ liệu
              </>
            ) : (
              <>
                <FaExclamationTriangle className="status-icon" />
                Không có dữ liệu
              </>
            )}
          </span>
        </div>
      </div>
      <div className="map-actions">
        <button
          onClick={toggleMapExpand}
          className="map-expand-button"
          title={isMapExpanded ? "Thu nhỏ" : "Mở rộng"}
        >
          {isMapExpanded ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
    <div className="map-container">
      <LandPlotMap geom={geom} plotInfo={plotInfo} />
    </div>
  </div>
);

export default MapSection;
