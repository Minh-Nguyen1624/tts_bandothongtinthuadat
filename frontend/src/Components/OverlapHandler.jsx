import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/OverlapHandler.css";

const API_URL = "http://127.0.0.1:8000";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Trong OverLapHandler.js
const OverLapHandler = ({ soTo, soThua, phuongXa, onOverlapData }) => {
  const [overlapGroup, setOverlapGroup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const debouncedCheckOverlap = debounce((soTo, soThua, phuongXa) => {
    checkOverlap(soTo, soThua, phuongXa);
  }, 500);

  useEffect(() => {
    if (soTo && soThua && phuongXa) {
      // checkOverlap(soTo, soThua, phuongXa);
      debouncedCheckOverlap(soTo, soThua, phuongXa);
    } else {
      setOverlapGroup(null);
      setError(null);
    }
  }, [soTo, soThua, phuongXa]);

  const checkOverlap = async (soTo, soThua, phuongXa) => {
    if (!token) {
      navigate("/login");
      return setError("Vui lòng đăng nhập để tiếp tục.");
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_URL}/api/land_plots/overlap-group`,
        {
          params: { so_to: soTo, so_thua: soThua, phuong_xa: phuongXa },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // console.log("✅ Overlap group response:", response.data);

      if (response.data.success) {
        setOverlapGroup(response.data);

        // Truyền dữ liệu lên component cha
        if (onOverlapData) {
          onOverlapData(response.data);
        }

        setError(null);
      } else {
        setError(response.data.message || "Không tìm thấy dữ liệu chồng lấn.");
        setOverlapGroup(null);
      }
    } catch (error) {
      console.error("❌ Overlap group error:", error);

      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
      } else if (error.response?.status === 404) {
        setError("API overlap-group không tồn tại. Vui lòng kiểm tra routes.");
      } else if (error.code === "ECONNABORTED") {
        setError("Kết nối timeout. Vui lòng thử lại.");
      } else {
        setError(
          "Lỗi khi lấy thông tin chồng lấn: " +
            (error.message || "Lỗi không xác định")
        );
      }
      setOverlapGroup(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorByLandType = (landType) => {
    const colors = {
      CAN: "#ff6b6b", // Thêm CAN
      ODT: "#ff8787",
      DGT: "#4dabf7",
      CLN: "#69db7c",
      LUC: "#51cf66",
      BHK: "#40c057",
      HCC: "#748ffc",
      SONG: "#339af0",
      NTS: "#20c997",
      ONT: "#ff6b6b",
    };
    return colors[landType] || "#868e96";
  };

  if (isLoading) {
    return (
      <div className="overlap-controls">
        <div className="overlap-loading">
          <div className="spinner"></div>
          Đang kiểm tra chồng lấn...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overlap-controls">
        <div className="overlap-error">
          ⚠️ {error}
          <button
            onClick={() => checkOverlap(soTo, soThua, phuongXa)}
            className="retry-btn"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!soTo || !soThua || !phuongXa) {
    return null;
  }

  if (!overlapGroup) {
    return null;
  }

  if (!overlapGroup.overlap_group?.has_overlap) {
    return (
      <div className="overlap-controls">
        <div className="overlap-info">
          ✅ {overlapGroup.overlap_group?.message || "Không có chồng lấn"}
          <div className="overlap-subtitle">
            Số tờ: {soTo} - Số thửa: {soThua} - Phường/Xã: {phuongXa}
          </div>
          <div className="overlap-details">
            Tổng số thửa: {overlapGroup.overlap_group?.total_plots || 0}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlap-controls">
      <div className="overlap-warning">
        ⚠️{" "}
        {overlapGroup.overlap_group.message ||
          `Có ${overlapGroup.overlap_group.total_plots} thửa chồng lấn`}
        <div className="overlap-subtitle">
          Số tờ: {soTo} - Số thửa: {soThua} - Phường/Xã: {phuongXa}
        </div>
      </div>

      <div className="plot-list">
        <div className="plot-list-title">Danh sách phân loại đất:</div>
        {overlapGroup.features.map((feature, index) => {
          const properties = feature.properties || {};
          const subGeometries = feature.sub_geometries || [];

          return subGeometries.map((subGeom, subGeomIndex) => {
            // ✅ LUÔN tính màu từ ky_hieu_mdsd
            const landTypeColor = getColorByLandType(subGeom.ky_hieu_mdsd);

            // console.log(`📊 ${subGeom.ky_hieu_mdsd}: ${landTypeColor}`);

            return (
              <div
                key={`${properties.id || index}-${subGeomIndex}`}
                className="plot-item"
                style={{
                  borderLeft: `4px solid ${landTypeColor}`,
                }}
              >
                <div className="plot-type">
                  <span
                    className="color-badge"
                    style={{
                      backgroundColor: landTypeColor,
                    }}
                  ></span>
                  <strong>{subGeom.ky_hieu_mdsd || "Chưa xác định"}</strong>
                </div>
                <div className="plot-details">
                  <span className="plot-area">
                    {subGeom.dien_tich ? `${subGeom.dien_tich}m²` : "0m²"}
                  </span>
                  {properties.owner && (
                    <span className="plot-owner">{properties.owner}</span>
                  )}
                </div>

                {/* ✅ Hiển thị màu đang dùng để debug */}
                <div
                  className="debug-info"
                  style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}
                >
                  Màu: {landTypeColor}
                </div>

                {properties.area_percentages &&
                  properties.area_percentages[subGeomIndex] && (
                    <div className="area-percentage">
                      Tỷ lệ: {properties.area_percentages[subGeomIndex]}%
                    </div>
                  )}

                <div className="plot-meta">
                  <small>Thửa #{properties.display_order || index + 1}</small>
                </div>
              </div>
            );
          });
        })}
      </div>
      {overlapGroup.features.length > 1 && (
        <div className="overlap-actions">
          <button
            className="action-btn"
            onClick={() => {
              const nextIndex =
                (currentIndex + 1) % overlapGroup.features.length;
              setCurrentIndex(nextIndex);
            }}
          >
            🔄 Chuyển thửa ({currentIndex + 1}/{overlapGroup.features.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default OverLapHandler;
