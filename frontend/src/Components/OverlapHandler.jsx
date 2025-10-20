// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const API_URL = "http://127.0.0.1:8000";

// const OverLapHandler = ({ soTo, soThua, phuongXa, onViewLapData }) => {
//   const [overLapGroup, setOverLapGroup] = useState(null);
//   const [currentIndex, setCurrent] = useState(0);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const token = localStorage.getItem("token");

//   const navigate = useNavigate();

//   console.log(overLapGroup);
//   useEffect(() => {
//     if (soTo && soThua && phuongXa) {
//       checkOverLap(soTo, soThua, phuongXa);
//     }
//   }, [soTo, soThua, phuongXa]);

//   const checkOverLap = async (soTo, soThua, phuongXa) => {
//     if (!token) {
//       navigate("/login");
//       return setError("Vui lòng đăng nhập để tiếp tục.");
//     }
//     try {
//       const response = await axios.get(
//         `${API_URL}/api/land_plots/overlap-group`,
//         {
//           params: { so_to: soTo, so_thua: soThua, phuong_xa: phuongXa },
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           timeout: 10000,
//         }
//       );

//       console.log("check response", response.data);

//       if (response.data.success) {
//         // setOverLapGroup(response.data.data);
//         setOverLapGroup(response.data);

//         if (onViewLapData) {
//           onViewLapData(response.data.data);
//         }

//         setError(null);
//       } else {
//         setError(response.data.message || "Không tìm thấy dữ liệu chồng lấn.");
//       }
//     } catch (error) {
//       console.error("❌ Overlap group error:", error);
//       setError("Lỗi khi lấy thông tin chồng lấn.");
//     } finally {
//       setError(null);
//       setIsLoading(false);
//     }
//   };

//   const getColorByLandType = (landType) => {
//     const color = {
//       ONT: "#ff6b6b",
//       ODT: "#ff8787",
//       CLN: "#69db7c",
//       LUC: "#51cf66",
//       BHK: "#40c057",
//       DGT: "#4dabf7",
//       HCC: "#748ffc",
//       SONG: "#339af0",
//       NTS: "#20c997",
//     };
//     return color[landType] || "#000000";
//   };

//   if (!overLapGroup || !overLapGroup.overlap_group.has_overlap) {
//     return (
//       <div className="overlap-controls">
//         <div className="overlap-info">
//           ✅ {overLapGroup?.overlap_group?.message || "Không có chồng lấn"}
//           <div className="overlap-subtitle">
//             Số tờ: {soTo} - Số thửa: {soThua}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="overlap-controls">
//       <div className="overlap-warning">
//         ⚠️ {overLapGroup.overlap_group.message}
//         <div className="overlap-subtitle">
//           Số tờ: {soTo} - Số thửa: {soThua}
//         </div>
//       </div>

//       <div className="plot-list">
//         <div className="plot-list-title">Danh sách thửa:</div>
//         {overLapGroup.features.map((feature, index) => (
//           <div
//             key={feature.properties.id}
//             className="plot-item"
//             style={{
//               borderLeft: `4px solid ${feature.properties.primary_color}`,
//             }}
//           >
//             <div className="plot-type">
//               <span
//                 className="color-badge"
//                 style={{ backgroundColor: feature.properties.primary_color }}
//               ></span>
//               <strong>{feature.properties.land_type}</strong>
//             </div>
//             <div className="plot-details">
//               <span className="plot-area">{feature.properties.area}m²</span>
//               {feature.properties.owner && (
//                 <span className="plot-owner">{feature.properties.owner}</span>
//               )}
//             </div>
//             <div className="land-types">
//               {feature.properties.land_types.map((type, i) => (
//                 <span key={i} className="land-type-tag">
//                   {type}
//                 </span>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // export default React.memo(OverLapHandler);
// export default OverLapHandler;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/OverlapHandler.css";

const API_URL = "http://127.0.0.1:8000";

const OverLapHandler = ({ soTo, soThua, phuongXa, onOverlapData }) => {
  const [overlapGroup, setOverlapGroup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (soTo && soThua && phuongXa) {
      checkOverlap(soTo, soThua, phuongXa);
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
          params: {
            so_to: soTo,
            so_thua: soThua,
            phuong_xa: phuongXa,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Overlap group response:", response.data);

      if (response.data.success) {
        setOverlapGroup(response.data);

        // ✅ TRUYỀN DỮ LIỆU LÊN COMPONENT CHA
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
      ONT: "#ff6b6b",
      ODT: "#ff8787",
      CLN: "#69db7c",
      LUC: "#51cf66",
      BHK: "#40c057",
      DGT: "#4dabf7",
      HCC: "#748ffc",
      SONG: "#339af0",
      NTS: "#20c997",
    };
    return colors[landType] || "#868e96";
  };

  // ✅ HIỂN THỊ LOADING
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

  // ✅ HIỂN THỊ LỖI
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

  // ✅ NẾU KHÔNG CÓ SỐ TỜ, SỐ THỬA, PHƯỜNG/XÃ
  if (!soTo || !soThua || !phuongXa) {
    return null;
  }

  // ✅ NẾU CHƯA CÓ DỮ LIỆU
  if (!overlapGroup) {
    return null;
  }

  // ✅ KIỂM TRA CÓ CHỒNG LẤN HAY KHÔNG
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

  // ✅ RENDER KHI CÓ CHỒNG LẤN
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
        <div className="plot-list-title">Danh sách thửa:</div>
        {overlapGroup.features &&
          overlapGroup.features.map((feature, index) => (
            <div
              key={feature.properties?.id || index}
              className="plot-item"
              style={{
                borderLeft: `4px solid ${
                  feature.properties?.primary_color || "#868e96"
                }`,
              }}
            >
              <div className="plot-type">
                <span
                  className="color-badge"
                  style={{
                    backgroundColor:
                      feature.properties?.primary_color || "#868e96",
                  }}
                ></span>
                <strong>
                  {feature.properties?.land_type || "Chưa xác định"}
                </strong>
              </div>
              <div className="plot-details">
                <span className="plot-area">
                  {feature.properties?.area || 0}m²
                </span>
                {feature.properties?.owner && (
                  <span className="plot-owner">{feature.properties.owner}</span>
                )}
              </div>
              <div className="land-types">
                {feature.properties?.land_types &&
                  feature.properties.land_types.map((type, i) => (
                    <span
                      key={i}
                      className="land-type-tag"
                      style={{
                        backgroundColor: getColorByLandType(type),
                        color: "white",
                      }}
                    >
                      {type}
                    </span>
                  ))}
              </div>
              <div className="plot-meta">
                <small>
                  Thửa #{feature.properties?.display_order || index + 1}
                </small>
                {feature.properties?.organization_name && (
                  <small>Tổ chức: {feature.properties.organization_name}</small>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* ✅ THÊM CONTROLS ĐỂ CHUYỂN ĐỔI GIỮA CÁC THỬA */}
      {overlapGroup.features && overlapGroup.features.length > 1 && (
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
