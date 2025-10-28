// src/features/landPlot/components/LandUseDetailRow.js
import React from "react";
import { FaTrash } from "react-icons/fa";

const LandUseDetailRow = ({
  index,
  detail,
  errors,
  handleLandUseDetailChange,
  removeLandUseDetail,
  loading,
}) => {
  return (
    <div className="detail-row">
      <input
        type="text"
        value={detail.ky_hieu_mdsd}
        onChange={(e) =>
          handleLandUseDetailChange(index, "ky_hieu_mdsd", e.target.value)
        }
        placeholder="VD: ODT, CLN..."
        className={`blue-input compact-input ${
          errors[`land_use_details_${index}_ky_hieu_mdsd`] ? "error" : ""
        }`}
        disabled={loading}
      />
      <input
        type="text"
        value={detail.dien_tich}
        onChange={(e) =>
          handleLandUseDetailChange(index, "dien_tich", e.target.value)
        }
        placeholder="Diện tích"
        className={`blue-input compact-input ${
          errors[`land_use_details_${index}_dien_tich`] ? "error" : ""
        }`}
        disabled={loading}
      />
      <textarea
        value={detail.geometry || ""}
        onChange={(e) =>
          handleLandUseDetailChange(index, "geometry", e.target.value)
        }
        placeholder="GeoJSON (tùy chọn)"
        className="blue-input compact-textarea"
        disabled={loading}
        rows={2}
      />
      <label htmlFor="">Màu của thửa đất</label>
      <input
        type="color"
        value={detail.color}
        onChange={(e) =>
          handleLandUseDetailChange(index, "color", e.target.value)
        }
        className="color-input"
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => removeLandUseDetail(index)}
        className="remove-button action-button secondary"
        disabled={loading}
        title="Xóa"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default LandUseDetailRow;
