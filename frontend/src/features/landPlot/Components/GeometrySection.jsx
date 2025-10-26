import React from "react";
import { FaDrawPolygon } from "react-icons/fa";

const GeometrySection = ({
  formData,
  errors,
  touched,
  showGeometryInput,
  handleGeometryChange,
  formatGeometryJSON,
  toggleGeometryInput,
  handleBlur,
  loading,
}) => {
  return (
    <div className="form-row">
      <div className="form-group full-width">
        <div className="geometry-section">
          <div className="geometry-header">
            <label className="blue-field-label">
              <FaDrawPolygon className="geometry-icon" />
              Dữ liệu hình học (Geometry)
            </label>
            <button
              type="button"
              onClick={toggleGeometryInput}
              disabled={loading}
              className="geometry-toggle-button"
            >
              <FaDrawPolygon className="geometry-icon" />
              {showGeometryInput ? "Ẩn" : "Hiển thị"} Geometry
            </button>
          </div>
          {showGeometryInput && (
            <div className="geometry-input-container">
              <div className="geometry-toolbar">
                <button
                  type="button"
                  onClick={toggleGeometryInput}
                  disabled={loading || !formData.geom}
                  className="geometry-format-button"
                >
                  Format JSON
                </button>
                <textarea
                  name="geom"
                  value={formData.geom || ""}
                  onChange={handleGeometryChange}
                  onBlur={handleBlur}
                  placeholder="Nhập dữ liệu GeoJSON"
                  className={`blue-textarea geometry-textarea${
                    errors.geom && touched?.geom ? "error" : ""
                  }`}
                  disabled={loading}
                  rows={8}
                />
                {errors.geom && touched?.geom && (
                  <div className="error-message">{errors.geom}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeometrySection;
