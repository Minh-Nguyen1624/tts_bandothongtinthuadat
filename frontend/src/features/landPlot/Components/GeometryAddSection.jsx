import React from "react";
import { FaDrawPolygon } from "react-icons/fa";

// const GeometryAddSection = ({
//   formData,
//   errors,
//   touched,
//   loading,
//   showGeometryInput,
//   handleGeometryChange,
//   formatGeometryJSON,
//   toggleGeometryInput,
//   handleBlur,
// }) => (
//   <div className="form-row">
//     <div className="form-group full-width">
//       <div className="geometry-section">
//         <div className="geometry-header">
//           <label className="blue-field-label">
//             <FaDrawPolygon className="label-icon" />
//             Dữ liệu hình học (Geometry)
//           </label>
//           <button
//             type="button"
//             onClick={toggleGeometryInput}
//             className="geometry-toggle-button"
//             disabled={loading}
//           >
//             {showGeometryInput ? "Ẩn" : "Hiện"} Geometry
//           </button>
//         </div>

//         {showGeometryInput && (
//           <div className="geometry-input-container">
//             <div className="geometry-toolbar">
//               <button
//                 type="button"
//                 onClick={formatGeometryJSON}
//                 className="geometry-format-button"
//                 disabled={loading || !formData.geom}
//               >
//                 Format JSON
//               </button>
//             </div>
//             <textarea
//               name="geom"
//               value={formData.geom || ""}
//               onChange={handleGeometryChange}
//               onBlur={handleBlur}
//               placeholder="Nhập dữ liệu GeoJSON..."
//               className={`blue-textarea geometry-textarea ${
//                 errors.geom && touched.geom ? "error" : ""
//               }`}
//               disabled={loading}
//               rows={8}
//             />
//             {errors.geom && touched.geom && (
//               <span className="blue-error-message">{errors.geom}</span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// );
const GeometryAddSection = ({
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
              <FaDrawPolygon className="label-icon" />
              Dữ liệu hình học (Geometry)
            </label>
            <button
              type="button"
              onClick={toggleGeometryInput}
              className="geometry-toggle-button"
              disabled={loading}
            >
              {showGeometryInput ? "Ẩn" : "Hiện"} Geometry
            </button>
          </div>

          {showGeometryInput && (
            <div className="geometry-input-container">
              <div className="geometry-toolbar">
                <button
                  type="button"
                  onClick={formatGeometryJSON}
                  className="geometry-format-button"
                  disabled={loading || !formData.geom}
                >
                  Format JSON
                </button>
              </div>
              <textarea
                name="geom"
                value={formData.geom || ""}
                onChange={handleGeometryChange}
                onBlur={handleBlur}
                placeholder="Nhập dữ liệu GeoJSON..."
                className={`blue-textarea geometry-textarea ${
                  errors.geom && touched.geom ? "error" : ""
                }`}
                disabled={loading}
                rows={8}
              />
              {errors.geom && touched.geom && (
                <span className="blue-error-message">{errors.geom}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeometryAddSection;
