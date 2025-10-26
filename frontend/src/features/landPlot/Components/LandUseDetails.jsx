import React from "react";
import {
  FaInfoCircle,
  FaPlus,
  FaMinus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";

const LandUseDetails = ({
  formData,
  errors,
  isLoading,
  autoDistribute,
  setAutoDistribute,
  selectedDetails,
  handleSelectDetail,
  handleSelectAllDetails,
  handleRemoveSelectedDetails,
  handleAddLandUseDetail,
  handleRemoveLandUseDetail,
  handleLandUseDetailChange,
  handleLandUseDetailGeometryChange,
  handleToggleDetailGeometry,
  totalDetailArea,
  areaMatch,
  handleAutoDistribute,
  handleBlur,
  showGeometryInput,
  toggleGeometryInput,
  handleGeometryChange,
  formatGeometryJSON,
}) => {
  // Tối ưu hóa render bằng cách memoize các giá trị thay đổi ít
  const hasDetails = formData.land_use_details.length > 0;
  const allSelected =
    selectedDetails.length === formData.land_use_details.length;

  return (
    <div
      className="land-use-details-section"
      style={{
        padding: "16px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
      role="region"
      aria-label="Chi tiết sử dụng đất"
    >
      {/* Cấu hình và gợi ý */}
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <input
            type="checkbox"
            id="auto-distribute"
            checked={autoDistribute}
            onChange={(e) => setAutoDistribute(e.target.checked)}
            disabled={isLoading}
            aria-label="Tự động chia diện tích"
          />
          <label
            htmlFor="auto-distribute"
            style={{ fontSize: "14px", color: "#333" }}
          >
            Tự động chia diện tích
          </label>
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            paddingLeft: "28px",
          }}
        >
          Khi bật, diện tích sẽ tự động chia đều cho các loại đất
        </div>
      </div>

      {/* Tiêu đề và nút thêm */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "16px", color: "#1a202c" }}>
          Chi tiết sử dụng đất
        </h4>
        <button
          type="button"
          onClick={handleAddLandUseDetail}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
          disabled={isLoading}
          aria-label="Thêm chi tiết sử dụng đất"
        >
          <FaPlus /> Thêm chi tiết
        </button>
      </div>

      {/* Lỗi toàn cục */}
      {(errors.land_use_details || errors.land_use_details_types) && (
        <div
          style={{
            color: "#dc3545",
            fontSize: "12px",
            marginBottom: "12px",
            padding: "8px",
            background: "#fee2e2",
            borderRadius: "4px",
          }}
        >
          {errors.land_use_details || errors.land_use_details_types}
        </div>
      )}

      {/* Bảng chi tiết */}
      {hasDetails && (
        <div
          style={{
            overflowX: "auto",
            marginBottom: "16px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f7fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                <th
                  style={{
                    padding: "8px",
                    textAlign: "center",
                    width: "40px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAllDetails}
                    disabled={isLoading}
                    aria-label="Chọn tất cả chi tiết"
                  />
                </th>
                <th style={{ padding: "8px", textAlign: "left" }}>Loại đất</th>
                <th
                  style={{
                    padding: "8px",
                    textAlign: "right",
                    width: "120px",
                  }}
                >
                  Diện tích (m²)
                </th>
                <th
                  style={{
                    padding: "8px",
                    textAlign: "center",
                    width: "120px",
                  }}
                >
                  Hình học
                </th>
                <th
                  style={{
                    padding: "8px",
                    textAlign: "center",
                    width: "60px",
                  }}
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.land_use_details.map((detail, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #edf2f7",
                    transition: "background 0.2s",
                    background: selectedDetails.includes(index)
                      ? "#eef2ff"
                      : "transparent",
                  }}
                >
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedDetails.includes(index)}
                      onChange={() => handleSelectDetail(index)}
                      disabled={isLoading}
                      aria-label={`Chọn chi tiết ${index + 1}`}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={detail.ky_hieu_mdsd}
                      onChange={(e) =>
                        handleLandUseDetailChange(
                          index,
                          "ky_hieu_mdsd",
                          e.target.value
                        )
                      }
                      placeholder="VD: ODT, CLN..."
                      style={{
                        width: "100%",
                        padding: "4px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                      disabled={isLoading}
                      maxLength={50}
                    />
                    {errors[`land_use_details_${index}_ky_hieu_mdsd`] && (
                      <span
                        style={{
                          color: "#dc3545",
                          fontSize: "12px",
                          display: "block",
                          marginTop: "4px",
                        }}
                      >
                        {errors[`land_use_details_${index}_ky_hieu_mdsd`]}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={detail.dien_tich}
                      onChange={(e) =>
                        handleLandUseDetailChange(
                          index,
                          "dien_tich",
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      style={{
                        width: "100px",
                        padding: "4px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        textAlign: "right",
                      }}
                      disabled={isLoading || autoDistribute}
                    />
                    {errors[`land_use_details_${index}_dien_tich`] && (
                      <span
                        style={{
                          color: "#dc3545",
                          fontSize: "12px",
                          display: "block",
                          marginTop: "4px",
                        }}
                      >
                        {errors[`land_use_details_${index}_dien_tich`]}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleDetailGeometry(index)}
                      style={{
                        padding: "4px 8px",
                        background: "#f7fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                      disabled={isLoading}
                      aria-label={`${
                        detail.showGeometry ? "Ẩn" : "Hiện"
                      } GeoJSON chi tiết ${index + 1}`}
                    >
                      {detail.showGeometry ? "Ẩn" : "Hiện"} GeoJSON
                    </button>
                    {detail.showGeometry && (
                      <textarea
                        value={
                          typeof detail.geometry === "string"
                            ? detail.geometry
                            : JSON.stringify(detail.geometry || {}, null, 2)
                        }
                        onChange={(e) =>
                          handleLandUseDetailGeometryChange(
                            index,
                            e.target.value
                          )
                        }
                        placeholder="GeoJSON geometry..."
                        style={{
                          width: "100%",
                          marginTop: "8px",
                          padding: "8px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                        }}
                        disabled={isLoading}
                        rows={2} // Giảm rows để tiết kiệm không gian
                      />
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveLandUseDetail(index)}
                      style={{
                        padding: "4px",
                        background: "transparent",
                        border: "none",
                        color: "#dc3545",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                      disabled={isLoading}
                      aria-label={`Xóa chi tiết ${index + 1}`}
                    >
                      <FaTimes />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedDetails.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
                padding: "8px",
                background: "#eef2ff",
                borderRadius: "4px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#1a202c" }}>
                Đã chọn {selectedDetails.length} chi tiết
              </span>
              <button
                type="button"
                onClick={handleRemoveSelectedDetails}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                }}
                disabled={isLoading}
                aria-label="Xóa các chi tiết đã chọn"
              >
                <FaMinus /> Xóa đã chọn
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tóm tắt diện tích */}
      <div
        style={{
          padding: "12px",
          background: "#f7fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <div>
            <span style={{ fontSize: "14px", color: "#666" }}>
              Tổng diện tích chi tiết:
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#1a202c",
              }}
            >
              {totalDetailArea.toFixed(2)} m²
            </span>
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#666" }}>
              Diện tích tổng:
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#1a202c",
              }}
            >
              {parseFloat(formData.dien_tich || 0).toFixed(2)} m²
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              color: areaMatch ? "#10b981" : "#dc3545",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {areaMatch ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {areaMatch ? "Khớp" : "Không khớp"}
          </span>
          {!areaMatch && hasDetails && autoDistribute && (
            <button
              type="button"
              onClick={handleAutoDistribute}
              style={{
                padding: "6px 12px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
              disabled={isLoading}
              aria-label="Tự động điều chỉnh diện tích"
            >
              Tự động điều chỉnh
            </button>
          )}
        </div>
        {!areaMatch && hasDetails && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#dc3545",
              textAlign: "center",
            }}
          >
            Tổng diện tích chi tiết phải khớp với diện tích tổng
          </div>
        )}
      </div>

      {/* Thông báo khi không có chi tiết */}
      {!hasDetails && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            background: "#fff3f3",
            borderRadius: "8px",
            color: "#666",
            fontSize: "14px",
          }}
          role="alert"
        >
          <FaInfoCircle />
          <div>
            <p>Chưa có chi tiết sử dụng nào.</p>
            <p>
              Thêm chi tiết diện tích cho từng loại đất. Tổng diện tích phải
              khớp với diện tích tổng.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandUseDetails;
