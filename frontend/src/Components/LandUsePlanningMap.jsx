// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Marker,
//   Popup,
//   ZoomControl,
//   AttributionControl,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";
// import L from "leaflet";
// import axios from "axios";
// import { FaSearch } from "react-icons/fa";
// import { processGeometryData } from "../utils/geometryProcessor";
// import "leaflet/dist/leaflet.css";
// import "../css/LandUsePlanningMap.css";

// // API gốc
// const API_URL = "http://127.0.0.1:8000";

// // Icon marker
// const customIcon = new L.Icon({
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconAnchor: [12, 41],
//   iconSize: [25, 41],
// });

// const containerStyle = {
//   width: "100%",
//   height: "calc(100vh - 120px)",
// };

// // ✅ Component cập nhật bản đồ khi thay đổi tâm
// const UpdateMapView = ({ center, zoom }) => {
//   const map = useMap();
//   useEffect(() => {
//     if (center && Array.isArray(center) && center.length === 2) {
//       map.setView(center, zoom);
//     }
//   }, [map, center, zoom]);
//   return null;
// };

// // ✅ Lắng nghe sự kiện click bản đồ
// const MapEventHandler = ({ onClick }) => {
//   useMapEvents({
//     click(e) {
//       onClick(e);
//     },
//   });
//   return null;
// };

// // ✅ Hiển thị thông tin popup
// const PlotInfo = ({ plot }) => (
//   <div>
//     <strong>Thông tin lô đất</strong>
//     <p>Số tờ: {plot.so_to}</p>
//     <p>Số thửa: {plot.so_thua}</p>
//     <p>Phường/Xã: {plot.phuong_xa}</p>
//     {/* <p>Loại đất: {plot.loai_dat || "Chưa xác định"}</p> */}
//     <p>Loại đất: {plot.ky_hieu_mdsd || "Chưa xác định"}</p>
//     <p>Diện tích: {plot.dien_tich ? `${plot.dien_tich} m²` : "Không rõ"}</p>
//     <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
//   </div>
// );

// // 🎨 Màu theo mã loại đất thực tế (ONT, ODT, CLN, HCC, DGT, v.v.)
// export const getColorByLoaiDat = (loai) => {
//   if (!loai) return "#adb5bd"; // màu xám nhạt cho null

//   const colors = {
//     // --- Nhóm đất ở ---
//     ONT: "#ff6b6b", // Đất ở nông thôn
//     ODT: "#ff8787", // Đất ở đô thị
//     "ODT+ONT": "#ff6b81",
//     "ODT+ONT+CLN": "#fa5252",
//     "ONT+CLN": "#ff9e6b",
//     "ODT+DGT+HCC": "#e03131",

//     // --- Nhóm đất nông nghiệp / cây lâu năm ---
//     CLN: "#69db7c", // Cây lâu năm
//     LUC: "#51cf66", // Lúa
//     BHK: "#40c057", // Hàng năm khác

//     // --- Nhóm đất giao thông / hạ tầng / công trình ---
//     DGT: "#4dabf7", // Đất giao thông
//     HCC: "#748ffc", // Công cộng, hành chính
//     DHT: "#5c7cfa", // Hạ tầng kỹ thuật
//     TMD: "#ffa94d", // Thương mại dịch vụ
//     SKC: "#fab005", // Cơ sở sản xuất

//     // --- Nhóm đất đặc thù ---
//     NTS: "#20c997", // Nuôi trồng thủy sản
//     RPH: "#2f9e44", // Rừng phòng hộ
//     RSX: "#37b24d", // Rừng sản xuất
//     SONG: "#339af0", // Sông suối
//     "CLN+ODT": "#ff922b",
//     "ONT+ODT": "#f76707",

//     // --- Nhóm chưa xác định / hỗn hợp ---
//     "ODT+CLN": "#fab005",
//     "ODT+ONT+CLN": "#fd7e14",
//     "ODT+CLN+HCC": "#e8590c",
//     "CLN+ONT+ODT": "#ffa94d",
//   };

//   // Chuẩn hóa key để khớp (loại bỏ khoảng trắng, viết hoa)
//   const key = loai.trim().toUpperCase();

//   // Trả màu tương ứng hoặc mặc định xám
//   return colors[key] || "#868e96";
// };

// // 🎨 Hàm chuyển đổi tọa độ từ GeoJSON sang Leaflet format
// const convertGeoJSONToLeaflet = (geometry) => {
//   if (!geometry) {
//     console.log("convertGeoJSONToLeaflet: No geometry provided");
//     return null;
//   }

//   console.log("convertGeoJSONToLeaflet input:", geometry);

//   if (geometry.type === "Point") {
//     const [lng, lat] = geometry.coordinates;
//     return [[lat, lng]];
//   }

//   if (geometry.type === "MultiPoint") {
//     return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
//   }

//   if (geometry.type === "Polygon") {
//     return geometry.coordinates.map((ring) =>
//       ring.map(([lng, lat]) => [lat, lng])
//     );
//   }

//   if (geometry.type === "MultiPolygon") {
//     return geometry.coordinates.map((polygon) =>
//       polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng]))
//     );
//   }

//   if (geometry.type === "LineString") {
//     return [geometry.coordinates.map(([lng, lat]) => [lat, lng])];
//   }

//   console.log(
//     "convertGeoJSONToLeaflet: Unsupported geometry type:",
//     geometry.type
//   );
//   return null;
// };

// // Custom hook to get current zoom level
// const MapZoomHandler = ({ setZoomLevel }) => {
//   const map = useMap();
//   useEffect(() => {
//     const handleZoom = () => setZoomLevel(map.getZoom());
//     map.on("zoomend", handleZoom);
//     setZoomLevel(map.getZoom()); // Set initial zoom level
//     return () => map.off("zoomend", handleZoom);
//   }, [map, setZoomLevel]);
//   return null;
// };

// const LandUsePlanningMap = () => {
//   const [phuongXa, setPhuongXa] = useState("");
//   const [soTo, setSoTo] = useState("");
//   const [soThua, setSoThua] = useState("");
//   const [landUseData, setLandUseData] = useState([]);
//   const [center, setCenter] = useState([10.367, 106.345]);
//   const [error, setError] = useState(null);
//   const [searchType, setSearchType] = useState("");
//   const [zoomLevel, setZoomLevel] = useState(30); // Track zoom level

//   const token = localStorage.getItem("token");

//   // 📡 Fetch API + xử lý geom
//   const fetchLandUseData = useCallback(
//     async (phuongXa = "", soTo = "", soThua = "") => {
//       try {
//         if (!token) {
//           setError("Vui lòng đăng nhập để tiếp tục.");
//           return;
//         }

//         setError(null);

//         const response = await axios.get(`${API_URL}/api/land_plots/`, {
//           params: {
//             phuong_xa: phuongXa,
//             so_to: soTo,
//             so_thua: soThua,
//           },
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         console.log("API Response:", response.data);

//         if (response.data.success) {
//           const data = response.data.data
//             .map((plot, index) => {
//               console.log(
//                 `Plot ${index} geom:`,
//                 plot.geom,
//                 "Type:",
//                 typeof plot.geom
//               );

//               const processedGeom = processGeometryData(plot.geom);
//               let leafletCoordinates = null;

//               if (processedGeom) {
//                 leafletCoordinates = convertGeoJSONToLeaflet(processedGeom);
//               } else {
//                 console.warn(
//                   `Failed to process geometry for plot ${index}:`,
//                   plot.geom
//                 );
//                 leafletCoordinates = null;
//               }

//               console.log(`Plot ${index} processed:`, {
//                 raw: plot.geom,
//                 processed: processedGeom,
//                 leaflet: leafletCoordinates,
//                 leafletLength: leafletCoordinates
//                   ? leafletCoordinates.length
//                   : 0,
//                 firstPolygon: leafletCoordinates ? leafletCoordinates[0] : null,
//                 firstRing:
//                   leafletCoordinates && leafletCoordinates[0]
//                     ? leafletCoordinates[0][0]
//                     : null,
//               });

//               return {
//                 ...plot,
//                 geom: leafletCoordinates,
//                 originalGeom: plot.geom,
//               };
//             })
//             .filter((plot) => plot.geom !== null);

//           console.log("Processed data with valid geometries:", data);

//           setLandUseData(data);
//           setSearchType(response.data.search_type || "suggest");

//           const validPlot = data.find(
//             (plot) => plot.geom && plot.geom.length > 0
//           );
//           if (validPlot && validPlot.geom) {
//             const firstPolygon = validPlot.geom[0];
//             if (firstPolygon && firstPolygon[0]) {
//               const coords = firstPolygon[0];
//               const lat =
//                 coords.reduce((sum, coord) => sum + coord[0], 0) /
//                 coords.length;
//               const lng =
//                 coords.reduce((sum, coord) => sum + coord[1], 0) /
//                 coords.length;
//               setCenter([lat, lng]);
//             }
//           }

//           if (data.length === 0) {
//             setError(
//               "Không tìm thấy lô đất phù hợp hoặc không có dữ liệu hình học."
//             );
//           } else if (response.data.search_type === "exact") {
//             setError(null);
//           } else {
//             setError(
//               `Tìm thấy ${data.length} kết quả gợi ý. Vui lòng chọn lô đất phù hợp.`
//             );
//           }
//         } else {
//           setError(response.data.message || "Không tìm thấy dữ liệu.");
//           setLandUseData([]);
//         }
//       } catch (error) {
//         console.error("Error fetching land use data:", error);
//         if (error.response?.status === 400) {
//           setError(
//             error.response.data.message || "Vui lòng nhập đầy đủ thông tin."
//           );
//         } else if (error.response?.status === 401) {
//           setError("Vui lòng đăng nhập để tiếp tục.");
//         } else {
//           setError("Lỗi khi lấy dữ liệu từ server.");
//         }
//         setLandUseData([]);
//       }
//     },
//     [token]
//   );

//   const handleSearch = () => {
//     if (!phuongXa && !soTo && !soThua) {
//       setError("Nhập ít nhất 1 thông tin để tra cứu.");
//       return;
//     }
//     fetchLandUseData(phuongXa, soTo, soThua);
//   };

//   const handleMapClick = (e) => {
//     console.log("Clicked at:", e.latlng);
//   };

//   useEffect(() => {
//     fetchLandUseData("Trung An", "", "");
//   }, [fetchLandUseData]);

//   const renderedPolygons = useMemo(
//     () =>
//       landUseData.map((plot, index) => {
//         if (!plot.geom) {
//           return (
//             <Marker
//               key={`marker-${index}`}
//               position={center}
//               icon={customIcon}
//               eventHandlers={{
//                 click: () => console.log("Plot clicked:", plot),
//               }}
//             >
//               <Popup>
//                 <PlotInfo plot={plot} />
//                 <div style={{ color: "orange", marginTop: "10px" }}>
//                   <small>⚠️ Không có dữ liệu hình học cho lô đất này</small>
//                 </div>
//               </Popup>
//             </Marker>
//           );
//         }

//         // const fillColor = getColorByLoaiDat(plot.loai_dat);
//         const fillColor = getColorByLoaiDat(plot.ky_hieu_mdsd);

//         // Render polygons only when zoomed in (e.g., zoom level >= 15)
//         if (zoomLevel < 15) return null;

//         return plot.geom.map((polygonCoords, polyIndex) => (
//           <Polygon
//             key={`${index}-${polyIndex}`}
//             positions={polygonCoords}
//             pathOptions={{
//               color: fillColor,
//               fillColor: fillColor,
//               fillOpacity: 0.6,
//               weight: 2,
//             }}
//             eventHandlers={{
//               click: () => console.log("Plot clicked:", plot),
//               mouseover: (e) => {
//                 e.target.setStyle({ fillOpacity: 0.8, weight: 3 });
//               },
//               mouseout: (e) => {
//                 e.target.setStyle({ fillOpacity: 0.6, weight: 2 });
//               },
//             }}
//           >
//             <Popup>
//               <PlotInfo plot={plot} />
//               <div
//                 style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}
//               >
//                 <strong>Debug info:</strong>
//                 <div>Số polygon: {plot.geom.length}</div>
//                 <div>Loại đất: {plot.ky_hieu_mdsd || "Chưa xác định"}</div>
//                 <div>Màu: {fillColor}</div>
//               </div>
//             </Popup>
//           </Polygon>
//         ));
//       }),
//     [landUseData, center, zoomLevel]
//   );

//   return (
//     <>
//       <div className="title">
//         <span>Bản đồ quy hoạch sử dụng đất</span>
//       </div>

//       <div className="header">
//         <div>
//           <select
//             className="select_xa"
//             value={phuongXa}
//             onChange={(e) => setPhuongXa(e.target.value)}
//           >
//             <option value="">--Chọn Phường/Xã--</option>
//             <option value="Trung An">Trung An</option>
//             <option value="Tân Long">Tân Long</option>
//             <option value="Mỹ Phong">Mỹ Phong</option>
//           </select>
//           <input
//             type="number"
//             className="so_to"
//             placeholder="Số Tờ"
//             value={soTo}
//             onChange={(e) => setSoTo(e.target.value)}
//           />
//           <input
//             type="number"
//             className="so_thua"
//             placeholder="Số Thửa"
//             value={soThua}
//             onChange={(e) => setSoThua(e.target.value)}
//           />
//           <button className="btn-search" onClick={handleSearch}>
//             <FaSearch style={{ marginRight: "5px" }} /> Tra cứu
//           </button>
//         </div>
//         <select className="select_qh">
//           <option value="">Chọn quy hoạch</option>
//           <option value="Đất ở">Đất ở</option>
//           <option value="Đất công cộng">Đất công cộng</option>
//           <option value="Đất nông nghiệp">Đất nông nghiệp</option>
//         </select>
//       </div>

//       {error && (
//         <div
//           style={{
//             padding: "10px",
//             color: searchType === "suggest" ? "orange" : "red",
//             textAlign: "center",
//             backgroundColor: searchType === "suggest" ? "#fff3cd" : "#f8d7da",
//             border: `1px solid ${
//               searchType === "suggest" ? "#ffeaa7" : "#f5c6cb"
//             }`,
//             margin: "10px",
//             borderRadius: "5px",
//           }}
//         >
//           {error}
//         </div>
//       )}

//       <div style={containerStyle}>
//         <MapContainer
//           center={center}
//           // maxZoom={30}
//           // minZoom={20}
//           maxZoom={22}
//           minZoom={13}
//           style={containerStyle}
//           zoomControl={false}
//         >
//           <TileLayer
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           />
//           <ZoomControl position="topright" />
//           <AttributionControl position="bottomright" />
//           <UpdateMapView center={center} zoom={13} />
//           <MapEventHandler onClick={handleMapClick} />
//           <MapZoomHandler setZoomLevel={setZoomLevel} />{" "}
//           {/* Track zoom level */}
//           {renderedPolygons}
//         </MapContainer>
//       </div>
//     </>
//   );
// };

// export default LandUsePlanningMap;

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  ZoomControl,
  AttributionControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { FaSearch, FaSpinner } from "react-icons/fa";
import { processGeometryData } from "../utils/geometryProcessor";
import "leaflet/dist/leaflet.css";
import "../css/LandUsePlanningMap.css";

const API_URL = "http://127.0.0.1:8000";

// Icon marker
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconAnchor: [12, 41],
  iconSize: [25, 41],
});

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 120px)",
};

// ✅ Component Loading
const LoadingOverlay = ({ isLoading }) =>
  isLoading && (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(255,255,255,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <FaSpinner
          className="spinner"
          style={{ fontSize: "2em", color: "#007bff" }}
        />
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  );

// ✅ Component cập nhật bản đồ
const UpdateMapView = ({ center, zoom, shouldUpdate }) => {
  const map = useMap();
  useEffect(() => {
    if (
      shouldUpdate &&
      center &&
      Array.isArray(center) &&
      center.length === 2
    ) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, shouldUpdate]);
  return null;
};

// Custom hook to get current zoom level
const MapZoomHandler = ({ setZoomLevel }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => setZoomLevel(map.getZoom());
    map.on("zoomend", handleZoom);
    setZoomLevel(map.getZoom());
    return () => map.off("zoomend", handleZoom);
  }, [map, setZoomLevel]);
  return null;
};

// ✅ Hiển thị thông tin popup chi tiết
const PlotInfo = ({ plot }) => {
  const landUseTypes = plot.ky_hieu_mdsd
    ? plot.ky_hieu_mdsd.split("+")
    : [plot.ky_hieu_mdsd || "Chưa xác định"];

  return (
    <div style={{ minWidth: "250px" }}>
      <strong>Thông tin lô đất</strong>
      <p>Số tờ: {plot.so_to}</p>
      <p>Số thửa: {plot.so_thua}</p>
      <p>Phường/Xã: {plot.phuong_xa}</p>

      <div style={{ margin: "10px 0" }}>
        <strong>Loại đất:</strong>
        {landUseTypes.map((type, index) => (
          <div
            key={index}
            style={{
              display: "inline-block",
              margin: "2px 5px 2px 0",
              padding: "2px 8px",
              backgroundColor: getColorByLoaiDat(type),
              color: "white",
              borderRadius: "3px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {type.trim()}
          </div>
        ))}
      </div>

      <p>Diện tích: {plot.dien_tich ? `${plot.dien_tich} m²` : "Không rõ"}</p>
      <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>

      {/* Hiển thị thông tin phân khu nếu có */}
      {plot.multiple_land_use && (
        <div
          style={{
            marginTop: "10px",
            borderTop: "1px solid #ccc",
            paddingTop: "10px",
          }}
        >
          <strong>Phân khu chi tiết:</strong>
          {plot.multiple_land_use.map((landUse, index) => (
            <div
              key={index}
              style={{
                marginTop: "5px",
                padding: "5px",
                backgroundColor: getColorByLoaiDat(landUse.loai_dat) + "20",
                borderLeft: `3px solid ${getColorByLoaiDat(landUse.loai_dat)}`,
              }}
            >
              <div>
                <strong>{landUse.loai_dat}</strong> - {landUse.dien_tich} m²
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Tỷ lệ: {landUse.ty_le}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 🎨 Màu theo mã loại đất
export const getColorByLoaiDat = (loai) => {
  if (!loai) return "#adb5bd";

  const colors = {
    ONT: "#ff6b6b",
    ODT: "#ff8787",
    CLN: "#69db7c",
    LUC: "#51cf66",
    BHK: "#40c057",
    DGT: "#4dabf7",
    HCC: "#748ffc",
    DHT: "#5c7cfa",
    TMD: "#ffa94d",
    SKC: "#fab005",
    NTS: "#20c997",
    SONG: "#339af0",
    "ODT+CLN": "#ff922b",
    "ONT+CLN": "#ff9e6b",
    "ODT+ONT": "#ff6b81",
    "ODT+ONT+CLN": "#ff9e6b",
  };

  const key = loai.trim().toUpperCase();
  return colors[key] || "#868e96";
};

// 🎨 Hàm chuyển đổi tọa độ
const convertGeoJSONToLeaflet = (geometry) => {
  if (!geometry) return null;

  try {
    if (geometry.type === "Point") {
      const [lng, lat] = geometry.coordinates;
      return [[lat, lng]];
    }

    if (geometry.type === "Polygon") {
      return geometry.coordinates.map((ring) =>
        ring.map(([lng, lat]) => [lat, lng])
      );
    }

    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.map((polygon) =>
        polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng]))
      );
    }
  } catch (error) {
    console.error("Error converting geometry:", error);
    return null;
  }

  return null;
};

// 🎨 TẠO DỮ LIỆU MẪU VỚI 2 MÀU
const createSampleMultiColorPlot = () => {
  const baseLat = 10.367;
  const baseLng = 106.345;

  // Tạo 2 polygon với màu khác nhau trong cùng 1 lô đất
  return {
    so_to: "5",
    so_thua: "9",
    phuong_xa: "Trung An",
    ky_hieu_mdsd: "ONT+CLN",
    dien_tich: 1020.4,
    ten_chu: "Nguyễn Văn A",
    multiple_land_use: [
      {
        loai_dat: "ONT",
        dien_tich: 924.79,
        ty_le: 90.6,
        geom: {
          type: "Polygon",
          coordinates: [
            [
              [baseLng + 0.001, baseLat + 0.001],
              [baseLng + 0.002, baseLat + 0.001],
              [baseLng + 0.002, baseLat + 0.002],
              [baseLng + 0.001, baseLat + 0.002],
              [baseLng + 0.001, baseLat + 0.001], // Đóng ring
            ],
          ],
        },
      },
      {
        loai_dat: "CLN",
        dien_tich: 95.62,
        ty_le: 9.4,
        geom: {
          type: "Polygon",
          coordinates: [
            [
              [baseLng + 0.002, baseLat + 0.001],
              [baseLng + 0.003, baseLat + 0.001],
              [baseLng + 0.003, baseLat + 0.002],
              [baseLng + 0.002, baseLat + 0.002],
              [baseLng + 0.002, baseLat + 0.001], // Đóng ring
            ],
          ],
        },
      },
    ],
  };
};

const LandUsePlanningMap = () => {
  const [phuongXa, setPhuongXa] = useState("");
  const [soTo, setSoTo] = useState("");
  const [soThua, setSoThua] = useState("");
  const [landUseData, setLandUseData] = useState([]);
  const [mapCenter, setMapCenter] = useState([10.367, 106.345]);
  const [searchCenter, setSearchCenter] = useState([10.367, 106.345]);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState("");
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [shouldUpdateView, setShouldUpdateView] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false); // Thêm state cho dữ liệu mẫu

  const token = localStorage.getItem("token");
  const searchTimeoutRef = useRef(null);

  // 📡 Fetch API + xử lý geom
  const fetchLandUseData = useCallback(
    async (phuongXa = "", soTo = "", soThua = "") => {
      const now = Date.now();
      if (now - lastSearchTime < 1000) return;
      setLastSearchTime(now);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      try {
        if (!token && !useSampleData) {
          setError("Vui lòng đăng nhập để tiếp tục.");
          return;
        }

        setIsLoading(true);
        setError(null);
        setShouldUpdateView(false);

        // Nếu dùng dữ liệu mẫu
        if (useSampleData) {
          searchTimeoutRef.current = setTimeout(() => {
            const samplePlot = createSampleMultiColorPlot();

            // Xử lý geometry cho từng phân khu
            const processedPlot = {
              ...samplePlot,
              multiple_land_use: samplePlot.multiple_land_use.map(
                (landUse) => ({
                  ...landUse,
                  leafletCoords: convertGeoJSONToLeaflet(landUse.geom),
                })
              ),
            };

            setLandUseData([processedPlot]);
            setSearchType("exact");
            setSearchCenter([10.367, 106.345]);
            setMapCenter([10.367, 106.345]);
            setShouldUpdateView(true);
            setZoomLevel(18);
            setIsLoading(false);
          }, 100);
          return;
        }

        // Fetch từ API thật
        const response = await axios.get(`${API_URL}/api/land_plots/`, {
          params: { phuong_xa: phuongXa, so_to: soTo, so_thua: soThua },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });

        if (response.data.success) {
          searchTimeoutRef.current = setTimeout(() => {
            const data = response.data.data
              .map((plot) => {
                const processedGeom = processGeometryData(plot.geom);
                const leafletCoordinates = processedGeom
                  ? convertGeoJSONToLeaflet(processedGeom)
                  : null;

                return leafletCoordinates
                  ? {
                      ...plot,
                      geom: leafletCoordinates,
                      originalGeom: plot.geom,
                    }
                  : null;
              })
              .filter(Boolean);

            setLandUseData(data);
            setSearchType(response.data.search_type || "suggest");

            if (data.length > 0) {
              const validPlot = data.find(
                (plot) => plot.geom && plot.geom.length > 0
              );
              if (validPlot?.geom?.[0]?.[0]) {
                const coords = validPlot.geom[0][0];
                const lat =
                  coords.reduce((sum, coord) => sum + coord[0], 0) /
                  coords.length;
                const lng =
                  coords.reduce((sum, coord) => sum + coord[1], 0) /
                  coords.length;
                setSearchCenter([lat, lng]);
                setMapCenter([lat, lng]);
                setShouldUpdateView(true);
                setZoomLevel(18);
              }
            }

            if (data.length === 0) {
              setError("Không tìm thấy lô đất phù hợp.");
            } else if (response.data.search_type === "exact") {
              setError(null);
            } else {
              setError(`Tìm thấy ${data.length} kết quả gợi ý.`);
            }

            setIsLoading(false);
          }, 100);
        } else {
          setError(response.data.message || "Không tìm thấy dữ liệu.");
          setLandUseData([]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching land use data:", error);
        if (error.response?.status === 401) {
          setError("Vui lòng đăng nhập để tiếp tục.");
        } else {
          setError("Lỗi khi lấy dữ liệu từ server.");
        }
        setLandUseData([]);
        setIsLoading(false);
      }
    },
    [token, lastSearchTime, useSampleData]
  );

  const handleSearch = () => {
    if (!phuongXa && !soTo && !soThua && !useSampleData) {
      setError("Nhập ít nhất 1 thông tin để tra cứu hoặc chọn dữ liệu mẫu.");
      return;
    }
    fetchLandUseData(phuongXa, soTo, soThua);
  };

  // Reset shouldUpdateView sau khi đã update xong
  useEffect(() => {
    if (shouldUpdateView) {
      const timer = setTimeout(() => {
        setShouldUpdateView(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldUpdateView]);

  useEffect(() => {
    fetchLandUseData("Trung An", "", "");
  }, [fetchLandUseData]);

  // ✅ Render polygons với nhiều màu
  const renderedPolygons = useMemo(() => {
    if (isLoading) return null;

    return landUseData.map((plot, index) => {
      // Nếu plot có multiple_land_use, render từng phân khu
      if (plot.multiple_land_use && plot.multiple_land_use.length > 0) {
        return plot.multiple_land_use.map((landUse, landUseIndex) => {
          if (!landUse.leafletCoords) return null;

          const fillColor = getColorByLoaiDat(landUse.loai_dat);
          const opacity = zoomLevel >= 16 ? 0.7 : 0.4;
          const weight = zoomLevel >= 16 ? 2 : 1;

          return landUse.leafletCoords.map((polygonCoords, polyIndex) => (
            <Polygon
              key={`${index}-${landUseIndex}-${polyIndex}`}
              positions={polygonCoords}
              pathOptions={{
                color: fillColor,
                fillColor: fillColor,
                fillOpacity: opacity,
                weight: weight,
              }}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.setStyle({
                    fillOpacity: Math.min(opacity + 0.2, 0.9),
                    weight: weight + 1,
                  });
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    fillOpacity: opacity,
                    weight: weight,
                  });
                },
              }}
            >
              <Popup>
                <PlotInfo plot={plot} />
              </Popup>
            </Polygon>
          ));
        });
      }

      // Xử lý plot thông thường (không có multiple_land_use)
      if (!plot.geom) {
        return (
          <Marker
            key={`marker-${index}`}
            position={mapCenter}
            icon={customIcon}
          >
            <Popup>
              <PlotInfo plot={plot} />
              <div style={{ color: "orange", marginTop: "10px" }}>
                <small>⚠️ Không có dữ liệu hình học</small>
              </div>
            </Popup>
          </Marker>
        );
      }

      const landUseTypes = plot.ky_hieu_mdsd
        ? plot.ky_hieu_mdsd.split("+").map((type) => type.trim())
        : [plot.ky_hieu_mdsd];
      const fillColor = getColorByLoaiDat(landUseTypes[0]);
      const opacity = zoomLevel >= 16 ? 0.7 : 0.4;
      const weight = zoomLevel >= 16 ? 2 : 1;

      return plot.geom.map((polygonCoords, polyIndex) => (
        <Polygon
          key={`${index}-${polyIndex}`}
          positions={polygonCoords}
          pathOptions={{
            color: fillColor,
            fillColor: fillColor,
            fillOpacity: opacity,
            weight: weight,
          }}
        >
          <Popup>
            <PlotInfo plot={plot} />
          </Popup>
        </Polygon>
      ));
    });
  }, [landUseData, mapCenter, zoomLevel, isLoading]);

  // ✅ Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="title">
        <span>Bản đồ quy hoạch sử dụng đất</span>
      </div>

      <div className="header">
        <div>
          <select
            className="select_xa"
            value={phuongXa}
            onChange={(e) => setPhuongXa(e.target.value)}
          >
            <option value="">--Chọn Phường/Xã--</option>
            <option value="Trung An">Trung An</option>
            <option value="Tân Long">Tân Long</option>
            <option value="Mỹ Phong">Mỹ Phong</option>
          </select>
          <input
            type="number"
            className="so_to"
            placeholder="Số Tờ"
            value={soTo}
            onChange={(e) => setSoTo(e.target.value)}
          />
          <input
            type="number"
            className="so_thua"
            placeholder="Số Thửa"
            value={soThua}
            onChange={(e) => setSoThua(e.target.value)}
          />
          <button
            className="btn-search"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <FaSpinner className="spinner" />
            ) : (
              <FaSearch style={{ marginRight: "5px" }} />
            )}
            {isLoading ? "Đang tải..." : "Tra cứu"}
          </button>

          {/* ✅ Nút để test dữ liệu mẫu với 2 màu */}
          <button
            className="btn-sample"
            onClick={() => setUseSampleData(true)}
            style={{
              marginLeft: "10px",
              padding: "8px 15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            📊 Dữ liệu mẫu 2 màu
          </button>
        </div>
        <select className="select_qh">
          <option value="">Chọn quy hoạch</option>
          <option value="Đất ở">Đất ở</option>
          <option value="Đất công cộng">Đất công cộng</option>
          <option value="Đất nông nghiệp">Đất nông nghiệp</option>
        </select>
      </div>

      {error && (
        <div
          style={{
            padding: "10px",
            color: searchType === "suggest" ? "orange" : "red",
            textAlign: "center",
            backgroundColor: searchType === "suggest" ? "#fff3cd" : "#f8d7da",
            border: `1px solid ${
              searchType === "suggest" ? "#ffeaa7" : "#f5c6cb"
            }`,
            margin: "10px",
            borderRadius: "5px",
          }}
        >
          {error}
        </div>
      )}

      {useSampleData && (
        <div
          style={{
            padding: "10px",
            color: "green",
            textAlign: "center",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            margin: "10px",
            borderRadius: "5px",
          }}
        >
          🎨 Đang hiển thị dữ liệu mẫu với 2 màu (ĐẤT Ở + CÂY LÂU NĂM)
        </div>
      )}

      <div style={containerStyle}>
        <LoadingOverlay isLoading={isLoading} />
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={containerStyle}
          zoomControl={false}
          maxZoom={22}
          minZoom={10}
          wheelPxPerZoomLevel={60}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={22}
          />
          <ZoomControl position="topright" />
          <AttributionControl position="bottomright" />
          <UpdateMapView
            center={searchCenter}
            zoom={zoomLevel}
            shouldUpdate={shouldUpdateView}
          />
          <MapZoomHandler setZoomLevel={setZoomLevel} />
          {renderedPolygons}
        </MapContainer>
      </div>

      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default LandUsePlanningMap;
