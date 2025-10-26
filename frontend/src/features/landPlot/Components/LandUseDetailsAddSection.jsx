import React from "react";
import { FaLayerGroup, FaPlus, FaTrash, FaCalculator } from "react-icons/fa";
import LandUseDetailRow from "../../landPlot/Components/LandUseDetailRow";

// const LandUseDetailsAddSection = ({
//   formData,
//   errors,
//   touched,
//   loading,
//   autoDistributeEnabled,
//   totalLandUseArea,
//   remainingArea,
//   hasAreaMismatch,
//   areaDifference,
//   handleLandUseDetailChange,
//   addLandUseDetail,
//   removeLandUseDetail,
//   autoDistributeArea,
//   toggleAutoDistribute,
// }) => (
//   <div className="form-row">
//     <div className="form-group full-width">
//       <div className="land-use-details-section">
//         <div className="section-header">
//           <label className="blue-field-label">
//             <FaLayerGroup className="label-icon" />
//             Chi tiết sử dụng đất (Tùy chọn)
//           </label>
//           <div className="section-actions">
//             <div className="toggle-group">
//               <label className="toggle-label">
//                 <input
//                   type="checkbox"
//                   checked={autoDistributeEnabled}
//                   onChange={toggleAutoDistribute}
//                   disabled={loading}
//                 />
//                 Tự động chia diện tích
//               </label>
//             </div>
//             <button
//               type="button"
//               onClick={addLandUseDetail}
//               className="action-button secondary"
//               disabled={loading}
//             >
//               <FaPlus /> Thêm loại đất
//             </button>
//             {formData.land_use_details.length > 0 && (
//               <button
//                 type="button"
//                 onClick={autoDistributeArea}
//                 className="action-button secondary"
//                 disabled={loading || !formData.dien_tich}
//               >
//                 <FaCalculator /> Chia đều
//               </button>
//             )}
//           </div>
//         </div>

//         {formData.land_use_details.length > 0 && (
//           <div className="land-use-details-list">
//             <div className="details-header">
//               <span>Loại đất</span>
//               <span>Diện tích (m²)</span>
//               <span>Hình học</span>
//               <span>Thao tác</span>
//             </div>
//             {formData.land_use_details.map((detail, index) => (
//               <div key={index} className="detail-row">
//                 <input
//                   type="text"
//                   value={detail.ky_hieu_mdsd}
//                   onChange={(e) =>
//                     handleLandUseDetailChange(
//                       index,
//                       "ky_hieu_mdsd",
//                       e.target.value
//                     )
//                   }
//                   placeholder="VD: ODT, CLN..."
//                   className={`blue-input compact-input ${
//                     errors[`land_use_details_${index}_ky_hieu_mdsd`]
//                       ? "error"
//                       : ""
//                   }`}
//                   disabled={loading}
//                 />
//                 <input
//                   type="text"
//                   value={detail.dien_tich}
//                   onChange={(e) =>
//                     handleLandUseDetailChange(
//                       index,
//                       "dien_tich",
//                       e.target.value
//                     )
//                   }
//                   placeholder="Diện tích"
//                   className={`blue-input compact-input ${
//                     errors[`land_use_details_${index}_dien_tich`] ? "error" : ""
//                   }`}
//                   disabled={loading}
//                 />
//                 <textarea
//                   value={detail.geometry || ""}
//                   onChange={(e) =>
//                     handleLandUseDetailChange(index, "geometry", e.target.value)
//                   }
//                   placeholder="GeoJSON (tùy chọn)"
//                   className="blue-input compact-textarea"
//                   disabled={loading}
//                   rows={2}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => removeLandUseDetail(index)}
//                   className="remove-button action-button secondary"
//                   disabled={loading}
//                   title="Xóa"
//                 >
//                   <FaTrash />
//                 </button>
//               </div>
//             ))}

//             <div className="details-summary">
//               <div className="total-area">
//                 Tổng diện tích chi tiết:{" "}
//                 <strong>{totalLandUseArea.toFixed(2)} m²</strong>
//               </div>
//               <div className="area-comparison">
//                 Diện tích tổng:{" "}
//                 <strong>{parseFloat(formData.dien_tich) || 0} m²</strong>
//                 {hasAreaMismatch ? (
//                   <span className="area-mismatch">
//                     ⚠️ Chênh lệch: {areaDifference.toFixed(2)} m²
//                   </span>
//                 ) : (
//                   <span className="area-match">✓ Khớp</span>
//                 )}
//               </div>
//               {remainingArea > 0 && (
//                 <div className="remaining-area">
//                   Diện tích còn lại:{" "}
//                   <strong>{remainingArea.toFixed(2)} m²</strong>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {errors.land_use_details && (
//           <span className="blue-error-message">{errors.land_use_details}</span>
//         )}
//         <div className="input-hint">
//           Thêm chi tiết diện tích cho từng loại đất. Tổng diện tích phải khớp
//           với diện tích tổng.
//         </div>
//       </div>
//     </div>
//   </div>
// );
const LandUseDetailsAddSection = ({
  formData,
  errors,
  loading,
  autoDistributeEnabled,
  toggleAutoDistribute,
  handleLandUseDetailChange,
  addLandUseDetail,
  removeLandUseDetail,
  autoDistributeArea,
  totalLandUseArea,
  remainingArea,
  hasAreaMismatch,
  areaDifference,
}) => {
  return (
    <div className="form-row">
      <div className="form-group full-width">
        <div className="land-use-details-section">
          <div className="section-header">
            <label className="blue-field-label">
              <FaLayerGroup className="label-icon" />
              Chi tiết sử dụng đất (Tùy chọn)
            </label>
            <div className="section-actions">
              <div className="toggle-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoDistributeEnabled}
                    onChange={toggleAutoDistribute}
                    disabled={loading}
                  />
                  Tự động chia diện tích
                </label>
              </div>
              <button
                type="button"
                onClick={addLandUseDetail}
                className="action-button secondary"
                disabled={loading}
              >
                <FaPlus /> Thêm loại đất
              </button>
              {formData.land_use_details.length > 0 && (
                <button
                  type="button"
                  onClick={autoDistributeArea}
                  className="action-button secondary"
                  disabled={loading || !formData.dien_tich}
                >
                  <FaCalculator /> Chia đều
                </button>
              )}
            </div>
          </div>

          {formData.land_use_details.length > 0 && (
            <div className="land-use-details-list">
              <div className="details-header">
                <span>Loại đất</span>
                <span>Diện tích (m²)</span>
                <span>Hình học</span>
                <span>Thao tác</span>
              </div>
              {formData.land_use_details.map((detail, index) => (
                <LandUseDetailRow
                  key={index}
                  index={index}
                  detail={detail}
                  errors={errors}
                  handleLandUseDetailChange={handleLandUseDetailChange}
                  removeLandUseDetail={removeLandUseDetail}
                  loading={loading}
                />
              ))}

              <div className="details-summary">
                <div className="total-area">
                  Tổng diện tích chi tiết:{" "}
                  <strong>{totalLandUseArea.toFixed(2)} m²</strong>
                </div>
                <div className="area-comparison">
                  Diện tích tổng:{" "}
                  <strong>{parseFloat(formData.dien_tich) || 0} m²</strong>
                  {hasAreaMismatch ? (
                    <span className="area-mismatch">
                      ⚠️ Chênh lệch: {areaDifference.toFixed(2)} m²
                    </span>
                  ) : (
                    <span className="area-match">✓ Khớp</span>
                  )}
                </div>
                {remainingArea > 0 && (
                  <div className="remaining-area">
                    Diện tích còn lại:{" "}
                    <strong>{remainingArea.toFixed(2)} m²</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {errors.land_use_details && (
            <span className="blue-error-message">
              {errors.land_use_details}
            </span>
          )}
          <div className="input-hint">
            Thêm chi tiết diện tích cho từng loại đất. Tổng diện tích phải khớp
            với diện tích tổng.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandUseDetailsAddSection;
