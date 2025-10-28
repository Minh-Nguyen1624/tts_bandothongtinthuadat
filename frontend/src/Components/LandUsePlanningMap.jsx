// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useMemo,
//   useRef,
// } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   Popup,
//   ZoomControl,
//   AttributionControl,
//   useMap,
//   LayersControl,
// } from "react-leaflet";
// import L from "leaflet";
// import axios from "axios";
// import { FaSearch, FaSpinner } from "react-icons/fa";
// import {
//   processGeometryData,
//   convertGeoJSONToLeaflet,
// } from "../utils/geometryProcessor";
// import LandPlotMapModal from "./LandPlotMapModal";
// import "leaflet/dist/leaflet.css";
// import "../css/LandUsePlanningMap.css";

// const API_URL = "http://127.0.0.1:8000";

// // Fix for default markers in react-leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
// });

// const containerStyle = {
//   width: "100%",
//   height: "calc(100vh - 120px)",
// };

// const { BaseLayer } = LayersControl;

// // const MapWithBaseLayer = () => {
// //   return (
// //     <MapContainer>
// //       <LayersControl>
// //         <BaseLayer name="🛰️ Esri Satellite">
// //           <TileLayer
// //             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
// //             attribution="Tiles © Esri"
// //           />
// //         </BaseLayer>

// //         {/* Base Map 3: Carto Light */}
// //         <BaseLayer name="🌍 Carto Light">
// //           <TileLayer
// //             url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
// //             attribution="&copy; CartoDB"
// //           />
// //         </BaseLayer>
// //       </LayersControl>
// //     </MapContainer>
// //   );
// // };

// // ✅ Component Loading
// const LoadingOverlay = React.memo(({ isLoading }) =>
//   isLoading ? (
//     <div className="loading-overlay">
//       <div className="loading-content">
//         <FaSpinner className="spinner" />
//         <p>Đang tải dữ liệu...</p>
//       </div>
//     </div>
//   ) : null
// );

// // ✅ Component cập nhật bản đồ
// const UpdateMapView = ({ center, zoom, shouldUpdate }) => {
//   const map = useMap();
//   useEffect(() => {
//     if (
//       shouldUpdate &&
//       center &&
//       Array.isArray(center) &&
//       center.length === 2
//     ) {
//       map.setView(center, zoom);
//     }
//   }, [map, center, zoom, shouldUpdate]);
//   return null;
// };

// // Custom hook to get current zoom level
// const MapZoomHandler = ({ setZoomLevel }) => {
//   const map = useMap();
//   useEffect(() => {
//     const handleZoom = () => setZoomLevel(map.getZoom());
//     map.on("zoomend", handleZoom);
//     setZoomLevel(map.getZoom());
//     return () => map.off("zoomend", handleZoom);
//   }, [map, setZoomLevel]);
//   return null;
// };

// // ✅ Hiển thị thông tin popup chi tiết
// const PlotInfo = ({ plot, detail }) => {
//   const landUseTypes = plot.ky_hieu_mdsd || ["Chưa xác định"];

//   // Nếu có detail riêng, hiển thị thông tin chi tiết
//   if (detail) {
//     const totalArea =
//       plot.land_use_details?.reduce(
//         (sum, d) => sum + parseFloat(d.dien_tich || 0),
//         0
//       ) || parseFloat(plot.dien_tich || 0);

//     const percentage =
//       totalArea > 0 ? (parseFloat(detail.dien_tich) / totalArea) * 100 : 0;

//     return (
//       <div style={{ minWidth: "280px" }}>
//         <strong
//           style={{
//             color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
//           }}
//         >
//           Phân loại đất: {detail.ky_hieu_mdsd.toString()}
//         </strong>
//         <p>Số tờ: {plot.so_to}</p>
//         <p>Số thửa: {plot.so_thua}</p>
//         <p>Diện tích: {parseFloat(detail.dien_tich).toLocaleString()} m²</p>
//         <p>Tỷ lệ: {percentage.toFixed(2)}%</p>
//         <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
//         <p>Phường/Xã: {plot.phuong_xa}</p>

//         <a
//           href={`https://www.google.com/maps/dir/?api=1&destination=${plot.geom[0][1]},${plot.geom[0][0]}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             border: "none",
//             background: "rgba(255, 255, 255, 0.5)",
//           }}
//         >
//           Hướng dẫn đường đi
//         </a>
//       </div>
//     );
//   }

//   // Hiển thị thông tin tổng quan của plot
//   const totalAreaFromDetails =
//     plot.land_use_details?.reduce(
//       (sum, detail) => sum + parseFloat(detail.dien_tich || 0),
//       0
//     ) || parseFloat(plot.dien_tich || 0);

//   return (
//     <div style={{ minWidth: "280px" }}>
//       <strong>Thông tin lô đất</strong>
//       <p>Số tờ: {plot.so_to}</p>
//       <p>Số thửa: {plot.so_thua}</p>
//       <p>Phường/Xã: {plot.phuong_xa}</p>

//       <div style={{ margin: "10px 0" }}>
//         <strong>Loại đất chính:</strong>
//         {landUseTypes.map((type, index) => (
//           <div
//             key={index}
//             style={{
//               display: "inline-block",
//               margin: "2px 5px 2px 0",
//               padding: "2px 8px",
//               backgroundColor: getColorByLoaiDat(type),
//               color: "white",
//               borderRadius: "3px",
//               fontSize: "12px",
//               fontWeight: "bold",
//             }}
//           >
//             {type}
//           </div>
//         ))}
//       </div>

//       {/* Hiển thị chi tiết diện tích nếu có */}
//       {plot.land_use_details && plot.land_use_details.length > 0 && (
//         <div
//           style={{
//             margin: "10px 0",
//             padding: "10px",
//             background: "#f8f9fa",
//             borderRadius: "5px",
//           }}
//         >
//           <strong>Chi tiết diện tích:</strong>
//           {plot.land_use_details.map((detail, index) => {
//             const percentage =
//               totalAreaFromDetails > 0
//                 ? (
//                     (parseFloat(detail.dien_tich) / totalAreaFromDetails) *
//                     100
//                   ).toFixed(2)
//                 : "0";
//             return (
//               <div
//                 key={index}
//                 style={{
//                   margin: "5px 0",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                 }}
//               >
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <div
//                     style={{
//                       width: "12px",
//                       height: "12px",
//                       backgroundColor:
//                         detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
//                       marginRight: "8px",
//                       border: "1px solid #333",
//                     }}
//                   ></div>
//                   <span>{detail.ky_hieu_mdsd}:</span>
//                 </div>
//                 <div>
//                   <strong>
//                     {parseFloat(detail.dien_tich).toLocaleString()} m² (
//                     {percentage}%)
//                   </strong>
//                 </div>
//               </div>
//             );
//           })}
//           <div
//             style={{
//               marginTop: "5px",
//               paddingTop: "5px",
//               borderTop: "1px solid #ddd",
//               fontWeight: "bold",
//             }}
//           >
//             Tổng diện tích: {totalAreaFromDetails.toLocaleString()} m²
//           </div>
//         </div>
//       )}

//       <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
//     </div>
//   );
// };

// // 🎨 Màu theo mã loại đất
// const getColorByLoaiDat = (loai) => {
//   if (!loai) return "#adb5bd";

//   const loaiStr = typeof loai === "string" ? loai : String(loai);

//   const colors = {
//     CAN: "#e03804ec",
//     ONT: "#ff6b6b",
//     ODT: "#ff8787",
//     CLN: "#69db7c",
//     LUC: "#51cf66",
//     BHK: "#40c057",
//     RSX: "#2f9e44",
//     RPH: "#37b24d",
//     NTS: "#20c997",
//     DGT: "#4dabf7",
//     HCC: "#748ffc",
//     DHT: "#5c7cfa",
//     TMD: "#ffa94d",
//     SKC: "#fab005",
//     SKK: "#f59f00",
//     SKN: "#e67700",
//     BCD: "#adb5bd",
//     NCD: "#868e96",
//     SONG: "#339af0",
//     KNT: "#228be6",
//   };

//   const key = loaiStr.trim().toUpperCase();
//   return colors[key] || "#868e96";
// };

// // 🧩 Hàm xử lý geometry LINH HOẠT - ưu tiên land_use_details, fallback về geom
// const processPlotGeometry = (plot) => {
//   console.log(`🔄 Processing geometry for plot ${plot.id}:`, {
//     has_land_use_details: !!plot.land_use_details,
//     land_use_details_count: plot.land_use_details?.length,
//     has_geom: !!plot.geom,
//   });

//   // ✅ ƯU TIÊN 1: Xử lý từ land_use_details nếu có
//   if (
//     plot.land_use_details &&
//     Array.isArray(plot.land_use_details) &&
//     plot.land_use_details.length > 0
//   ) {
//     console.log("🎯 Using land_use_details for geometry");

//     const landUseGeometries = plot.land_use_details
//       .map((detail) => {
//         if (!detail.geometry) {
//           console.warn(`⚠️ No geometry for land use: ${detail.ky_hieu_mdsd}`);
//           return null;
//         }

//         try {
//           const processedGeom = processGeometryData(detail.geometry);
//           const leafletCoordinates = processedGeom
//             ? convertGeoJSONToLeaflet(processedGeom)
//             : null;

//           console.log(`📍 Land Use ${detail.ky_hieu_mdsd}:`, {
//             has_geometry: !!leafletCoordinates,
//             coordinates_count: leafletCoordinates?.[0]?.length || 0,
//           });

//           return leafletCoordinates;
//         } catch (error) {
//           console.error(
//             `❌ Error processing geometry for ${detail.ky_hieu_mdsd}:`,
//             error
//           );
//           return null;
//         }
//       })
//       .filter(Boolean);

//     if (landUseGeometries.length > 0) {
//       console.log(
//         `✅ Successfully processed ${landUseGeometries.length} land use geometries`
//       );
//       return {
//         geometries: landUseGeometries,
//         source: "land_use_details",
//         details: plot.land_use_details.map((detail, index) => ({
//           ...detail,
//           color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
//           leafletGeometry: landUseGeometries[index] || null,
//         })),
//       };
//     }
//   }

//   // ✅ FALLBACK 2: Xử lý từ geom chính nếu có
//   if (plot.geom) {
//     console.log("🔄 Using main geom as fallback");

//     try {
//       const processedGeom = processGeometryData(plot.geom);
//       const leafletCoordinates = processedGeom
//         ? convertGeoJSONToLeaflet(processedGeom)
//         : null;

//       if (leafletCoordinates) {
//         console.log(`✅ Successfully processed main geom:`, {
//           coordinates_count: leafletCoordinates[0]?.length || 0,
//         });

//         // Tạo mock land_use_details từ geom chính
//         const mockDetail = {
//           ky_hieu_mdsd: plot.ky_hieu_mdsd || "UNKNOWN",
//           dien_tich: plot.dien_tich || "0",
//           color: getColorByLoaiDat(plot.ky_hieu_mdsd),
//           geometry: plot.geom,
//         };

//         return {
//           geometries: [leafletCoordinates],
//           source: "main_geom",
//           details: [
//             {
//               ...mockDetail,
//               leafletGeometry: leafletCoordinates,
//             },
//           ],
//         };
//       }
//     } catch (error) {
//       console.error("❌ Error processing main geom:", error);
//     }
//   }

//   console.error("❌ No valid geometry found for plot");
//   return null;
// };

// const LandUsePlanningMap = () => {
//   const [phuongXa, setPhuongXa] = useState("");
//   const [soTo, setSoTo] = useState("");
//   const [soThua, setSoThua] = useState("");
//   const [landUseData, setLandUseData] = useState([]);
//   const [overlapData, setOverlapData] = useState(null);
//   const [mapCenter, setMapCenter] = useState([10.367, 106.345]);
//   const [searchCenter, setSearchCenter] = useState([10.367, 106.345]);
//   const [error, setError] = useState(null);
//   const [searchType, setSearchType] = useState("");
//   const [zoomLevel, setZoomLevel] = useState(15);
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastSearchTime, setLastSearchTime] = useState(0);
//   const [shouldUpdateView, setShouldUpdateView] = useState(false);
//   const [displayMode, setDisplayMode] = useState("single");
//   const [currentOverlapIndex, setCurrentOverlapIndex] = useState(0);

//   const token = localStorage.getItem("token");
//   const searchTimeoutRef = useRef(null);

//   // Debug chi tiết khi landUseData thay đổi
//   useEffect(() => {
//     if (landUseData.length > 0) {
//       console.log("=== DEBUG FINAL LAND USE DATA ===");
//       landUseData.forEach((plot, index) => {
//         console.log(`Plot ${plot.id} (${plot.so_to}/${plot.so_thua}):`, {
//           geometry_source: plot.geometrySource,
//           geometries_count: plot.geom?.length,
//           details_count: plot.land_use_details?.length,
//           has_valid_geometry: !!plot.geom && plot.geom.length > 0,
//         });
//       });
//     }
//   }, [landUseData]);

//   // Fetch API + xử lý geom LINH HOẠT
//   const fetchData = useCallback(
//     async (phuongXa = "", soTo = "", soThua = "") => {
//       const now = Date.now();
//       if (now - lastSearchTime < 1000) return;
//       setLastSearchTime(now);

//       if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

//       try {
//         if (!token) {
//           setError("Vui lòng đăng nhập để tiếp tục.");
//           return;
//         }

//         setIsLoading(true);
//         setError(null);
//         setShouldUpdateView(false);
//         setOverlapData(null);

//         // Gọi API land_plots
//         const landResponse = await axios.get(`${API_URL}/api/land_plots`, {
//           params: { phuong_xa: phuongXa, so_to: soTo, so_thua: soThua },
//           headers: { Authorization: `Bearer ${token}` },
//           timeout: 10000,
//         });

//         console.log("✅ Land API response:", landResponse.data);

//         if (landResponse.data.success) {
//           const data = landResponse.data.data
//             .map((plot) => {
//               console.log(`📊 Original plot ${plot.id}:`, {
//                 so_to: plot.so_to,
//                 so_thua: plot.so_thua,
//                 has_land_use_details: !!plot.land_use_details,
//                 land_use_details_count: plot.land_use_details?.length,
//                 has_geom: !!plot.geom,
//               });

//               // Xử lý geometry LINH HOẠT
//               const geometryResult = processPlotGeometry(plot);

//               if (!geometryResult) {
//                 console.warn(`⚠️ No valid geometry for plot ${plot.id}`);
//                 return null;
//               }

//               // Tạo plot mới với geometry đã xử lý
//               const processedPlot = {
//                 ...plot,
//                 geom: geometryResult.geometries,
//                 geometrySource: geometryResult.source,
//                 land_use_details: geometryResult.details,
//                 originalGeom: plot.geom,
//               };

//               console.log(`✅ Processed plot ${plot.id}:`, {
//                 source: processedPlot.geometrySource,
//                 geometries_count: processedPlot.geom.length,
//                 details_count: processedPlot.land_use_details.length,
//               });

//               return processedPlot;
//             })
//             .filter(Boolean);

//           console.log("✅ Final processed data:", data);

//           setLandUseData(data);
//           setSearchType(landResponse.data.search_type || "suggest");

//           // Cập nhật map center dựa trên geometries
//           if (data.length > 0) {
//             const firstPlot = data[0];
//             if (firstPlot.geom && firstPlot.geom.length > 0) {
//               // Lấy tất cả tọa độ từ tất cả geometries
//               const allCoords = firstPlot.geom
//                 .flat(3)
//                 .filter((coord) => Array.isArray(coord) && coord.length === 2);

//               if (allCoords.length > 0) {
//                 const latSum = allCoords.reduce(
//                   (sum, coord) => sum + coord[0],
//                   0
//                 );
//                 const lngSum = allCoords.reduce(
//                   (sum, coord) => sum + coord[1],
//                   0
//                 );

//                 const centerLat = latSum / allCoords.length;
//                 const centerLng = lngSum / allCoords.length;

//                 console.log("📍 Setting map center to:", [
//                   centerLat,
//                   centerLng,
//                 ]);

//                 setSearchCenter([centerLat, centerLng]);
//                 setMapCenter([centerLat, centerLng]);
//                 setShouldUpdateView(true);
//                 setZoomLevel(18);
//               }
//             }
//           }

//           if (data.length === 0) {
//             setError("Không tìm thấy lô đất phù hợp.");
//           } else if (landResponse.data.search_type === "exact") {
//             setError(null);
//           } else {
//             setError(`Tìm thấy ${data.length} kết quả gợi ý.`);
//           }

//           // Gọi API overlap-group
//           try {
//             const overlapResponse = await axios.get(
//               `${API_URL}/api/land_plots/overlap-group`,
//               {
//                 params: { so_to: soTo, so_thua: soThua },
//                 headers: { Authorization: `Bearer ${token}` },
//                 timeout: 10000,
//               }
//             );

//             console.log("✅ Overlap API response:", overlapResponse.data);

//             if (overlapResponse.data.success && overlapResponse.data.features) {
//               const firstFeature = overlapResponse.data.features[0];
//               if (firstFeature) {
//                 setOverlapData(firstFeature);

//                 if (
//                   firstFeature.sub_geometries &&
//                   firstFeature.sub_geometries.length > 1
//                 ) {
//                   setDisplayMode("alternating");
//                   setCurrentOverlapIndex(0);
//                 } else {
//                   setDisplayMode("single");
//                 }
//               }
//             }
//           } catch (overlapError) {
//             console.log("ℹ️ Không thể lấy overlap data:", overlapError.message);
//           }
//         }

//         setIsLoading(false);
//       } catch (error) {
//         console.error("❌ Fetch error:", error.response?.data || error.message);
//         if (error.response?.status === 401) {
//           setError("Vui lòng đăng nhập để tiếp tục.");
//         } else {
//           setError("Lỗi khi lấy dữ liệu từ server.");
//         }
//         setLandUseData([]);
//         setOverlapData(null);
//         setIsLoading(false);
//       }
//     },
//     [token, lastSearchTime]
//   );

//   const handleSearch = () => {
//     if (!phuongXa && !soTo && !soThua) {
//       setError("Nhập ít nhất 1 thông tin để tra cứu.");
//       return;
//     }
//     fetchData(phuongXa, soTo, soThua);
//   };

//   // Reset shouldUpdateView sau khi đã update xong
//   useEffect(() => {
//     if (shouldUpdateView) {
//       const timer = setTimeout(() => setShouldUpdateView(false), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [shouldUpdateView]);

//   useEffect(() => {
//     fetchData("Trung An", "", "");
//   }, [fetchData]);

//   // ✅ Render polygons LINH HOẠT
//   const renderedPolygons = useMemo(() => {
//     console.log("🔍 Rendering polygons with landUseData:", landUseData);
//     if (isLoading) return null;

//     const getStyleByZoom = (zoom) => {
//       const zoomLevel = zoom || 15;
//       switch (true) {
//         case zoomLevel >= 20:
//           return { opacity: 0.9, weight: 4, dashArray: null };
//         case zoomLevel >= 18:
//           return { opacity: 0.85, weight: 3, dashArray: null };
//         case zoomLevel >= 16:
//           return { opacity: 0.8, weight: 2.5, dashArray: null };
//         case zoomLevel >= 14:
//           return { opacity: 0.7, weight: 2, dashArray: null };
//         case zoomLevel >= 12:
//           return { opacity: 0.6, weight: 1.5, dashArray: "2,2" };
//         case zoomLevel >= 10:
//           return { opacity: 0.5, weight: 1, dashArray: "3,3" };
//         default:
//           return { opacity: 0.3, weight: 0.6, dashArray: "4,4" };
//       }
//     };

//     const style = getStyleByZoom(zoomLevel);

//     // ✅ Render từ landUseData (linh hoạt cả land_use_details và main geom)
//     if (landUseData.length > 0) {
//       console.log(`🎨 Rendering ${landUseData.length} plots`);

//       return landUseData
//         .flatMap((plot, plotIndex) => {
//           if (!plot.land_use_details || plot.land_use_details.length === 0) {
//             console.warn(`⚠️ Plot ${plot.id} has no land_use_details`);
//             return null;
//           }

//           return plot.land_use_details
//             .map((detail, detailIndex) => {
//               if (!detail.leafletGeometry) {
//                 console.warn(
//                   `⚠️ Detail ${detail.ky_hieu_mdsd} has no geometry`
//                 );
//                 return null;
//               }

//               const fillColor =
//                 detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd);

//               console.log(
//                 `🎨 Rendering ${detail.ky_hieu_mdsd} (source: ${plot.geometrySource})`,
//                 {
//                   color: fillColor,
//                   geometry_type: Array.isArray(detail.leafletGeometry[0])
//                     ? "polygon"
//                     : "unknown",
//                 }
//               );

//               // Render từng polygon trong geometry
//               return detail.leafletGeometry.map((polygonCoords, polyIndex) => (
//                 <Polygon
//                   key={`${plot.id}-${detail.ky_hieu_mdsd}-${polyIndex}-${plot.geometrySource}`}
//                   positions={polygonCoords}
//                   pathOptions={{
//                     color: fillColor,
//                     fillColor: fillColor,
//                     fillOpacity: style.opacity,
//                     weight: style.weight,
//                     stroke: true,
//                     lineJoin: "round",
//                     dashArray: style.dashArray,
//                   }}
//                 >
//                   <Popup>
//                     <PlotInfo plot={plot} detail={detail} />
//                   </Popup>
//                 </Polygon>
//               ));
//             })
//             .filter(Boolean);
//         })
//         .filter(Boolean);
//     }

//     return null;
//   }, [landUseData, zoomLevel, isLoading]);

//   // ✅ Component để điều chỉnh map behavior
//   const MapBehaviorHandler = ({ setZoomLevel }) => {
//     const map = useMap();
//     useEffect(() => {
//       const handleZoom = () => {
//         const currentZoom = map.getZoom();
//         setZoomLevel(currentZoom);
//         map.invalidateSize();
//       };
//       map.on("zoomend", handleZoom);
//       map.on("moveend", handleZoom);
//       setZoomLevel(map.getZoom());
//       return () => {
//         map.off("zoomend", handleZoom);
//         map.off("moveend", handleZoom);
//       };
//     }, [map, setZoomLevel]);
//     return null;
//   };

//   // ✅ Cleanup timeout khi component unmount
//   useEffect(() => {
//     return () => {
//       if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
//     };
//   }, []);

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
//           <button
//             className="btn-search"
//             onClick={handleSearch}
//             disabled={isLoading}
//           >
//             {isLoading ? (
//               <FaSpinner className="spinner" />
//             ) : (
//               <FaSearch style={{ marginRight: "5px" }} />
//             )}
//             {isLoading ? "Đang tải..." : "Tra cứu"}
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
//           className={`error-message ${
//             searchType === "suggest" ? "warning" : "error"
//           }`}
//         >
//           {error}
//         </div>
//       )}

//       <div style={containerStyle}>
//         <LoadingOverlay isLoading={isLoading} />
//         <MapContainer
//           center={mapCenter}
//           zoom={zoomLevel}
//           style={containerStyle}
//           zoomControl={false}
//           maxZoom={22}
//           minZoom={10}
//           zoomSnap={0.5}
//           zoomDelta={0.5}
//         >
//           <TileLayer
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//             maxZoom={22}
//             minZoom={8}
//             subdomains={["a", "b", "c", "d"]}
//             noWrap={true}
//             maxNativeZoom={19}
//           />
//           <ZoomControl position="topright" />
//           <AttributionControl position="bottomright" />
//           <UpdateMapView
//             center={searchCenter}
//             zoom={zoomLevel}
//             shouldUpdate={shouldUpdateView}
//           />
//           <MapZoomHandler setZoomLevel={setZoomLevel} />
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
  useContext,
} from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  ZoomControl,
  AttributionControl,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { FaSearch, FaSpinner } from "react-icons/fa";
import {
  processGeometryData,
  convertGeoJSONToLeaflet,
} from "../utils/geometryProcessor";
import LandPlotMapModal from "./LandPlotMapModal";
import "leaflet/dist/leaflet.css";
import "../css/LandUsePlanningMap.css";

const API_URL = "http://127.0.0.1:8000";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 120px)",
};

// ✅ Component Loading
const LoadingOverlay = React.memo(({ isLoading }) =>
  isLoading ? (
    <div className="loading-overlay">
      <div className="loading-content">
        <FaSpinner className="spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  ) : null
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
const PlotInfo = ({ plot, detail }) => {
  const landUseTypes = plot.ky_hieu_mdsd || ["Chưa xác định"];

  // Nếu có detail riêng, hiển thị thông tin chi tiết
  if (detail) {
    const totalArea =
      plot.land_use_details?.reduce(
        (sum, d) => sum + parseFloat(d.dien_tich || 0),
        0
      ) || parseFloat(plot.dien_tich || 0);

    const percentage =
      totalArea > 0 ? (parseFloat(detail.dien_tich) / totalArea) * 100 : 0;

    return (
      <div style={{ minWidth: "280px" }}>
        <strong
          style={{
            color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
          }}
        >
          Phân loại đất: {detail.ky_hieu_mdsd.toString()}
        </strong>
        <p>Số tờ: {plot.so_to}</p>
        <p>Số thửa: {plot.so_thua}</p>
        <p>Diện tích: {parseFloat(detail.dien_tich).toLocaleString()} m²</p>
        <p>Tỷ lệ: {percentage.toFixed(2)}%</p>
        <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
        <p>Phường/Xã: {plot.phuong_xa}</p>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${plot.geom[0][1]},${plot.geom[0][0]}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: "none",
            background: "rgba(255, 255, 255, 0.5)",
          }}
        >
          Hướng dẫn đường đi
        </a>
      </div>
    );
  }

  // Hiển thị thông tin tổng quan của plot
  const totalAreaFromDetails =
    plot.land_use_details?.reduce(
      (sum, detail) => sum + parseFloat(detail.dien_tich || 0),
      0
    ) || parseFloat(plot.dien_tich || 0);

  return (
    <div style={{ minWidth: "280px" }}>
      <strong>Thông tin lô đất</strong>
      <p>Số tờ: {plot.so_to}</p>
      <p>Số thửa: {plot.so_thua}</p>
      <p>Phường/Xã: {plot.phuong_xa}</p>

      <div style={{ margin: "10px 0" }}>
        <strong>Loại đất chính:</strong>
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
            {type}
          </div>
        ))}
      </div>

      {/* Hiển thị chi tiết diện tích nếu có */}
      {plot.land_use_details && plot.land_use_details.length > 0 && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#f8f9fa",
            borderRadius: "5px",
          }}
        >
          <strong>Chi tiết diện tích:</strong>
          {plot.land_use_details.map((detail, index) => {
            const percentage =
              totalAreaFromDetails > 0
                ? (
                    (parseFloat(detail.dien_tich) / totalAreaFromDetails) *
                    100
                  ).toFixed(2)
                : "0";
            return (
              <div
                key={index}
                style={{
                  margin: "5px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor:
                        detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
                      marginRight: "8px",
                      border: "1px solid #333",
                    }}
                  ></div>
                  <span>{detail.ky_hieu_mdsd}:</span>
                </div>
                <div>
                  <strong>
                    {parseFloat(detail.dien_tich).toLocaleString()} m² (
                    {percentage}%)
                  </strong>
                </div>
              </div>
            );
          })}
          <div
            style={{
              marginTop: "5px",
              paddingTop: "5px",
              borderTop: "1px solid #ddd",
              fontWeight: "bold",
            }}
          >
            Tổng diện tích: {totalAreaFromDetails.toLocaleString()} m²
          </div>
        </div>
      )}

      <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
    </div>
  );
};

// 🎨 Màu theo mã loại đất
const getColorByLoaiDat = (loai) => {
  if (!loai) return "#adb5bd";

  const loaiStr = typeof loai === "string" ? loai : String(loai);

  const colors = {
    CAN: "#e03804ec",
    ONT: "#ff6b6b",
    ODT: "#ff8787",
    CLN: "#69db7c",
    LUC: "#51cf66",
    BHK: "#40c057",
    RSX: "#2f9e44",
    RPH: "#37b24d",
    NTS: "#20c997",
    DGT: "#4dabf7",
    HCC: "#748ffc",
    DHT: "#5c7cfa",
    TMD: "#ffa94d",
    SKC: "#fab005",
    SKK: "#f59f00",
    SKN: "#e67700",
    BCD: "#adb5bd",
    NCD: "#868e96",
    SONG: "#339af0",
    KNT: "#228be6",
  };

  const key = loaiStr.trim().toUpperCase();
  return colors[key] || "#868e96";
};

// 🧩 Hàm xử lý geometry LINH HOẠT - ưu tiên land_use_details, fallback về geom
const processPlotGeometry = (plot) => {
  console.log(`🔄 Processing geometry for plot ${plot.id}:`, {
    has_land_use_details: !!plot.land_use_details,
    land_use_details_count: plot.land_use_details?.length,
    has_geom: !!plot.geom,
  });

  // ✅ ƯU TIÊN 1: Xử lý từ land_use_details nếu có
  if (
    plot.land_use_details &&
    Array.isArray(plot.land_use_details) &&
    plot.land_use_details.length > 0
  ) {
    console.log("🎯 Using land_use_details for geometry");

    const landUseGeometries = plot.land_use_details
      .map((detail) => {
        if (!detail.geometry) {
          console.warn(`⚠️ No geometry for land use: ${detail.ky_hieu_mdsd}`);
          return null;
        }

        try {
          const processedGeom = processGeometryData(detail.geometry);
          const leafletCoordinates = processedGeom
            ? convertGeoJSONToLeaflet(processedGeom)
            : null;

          console.log(`📍 Land Use ${detail.ky_hieu_mdsd}:`, {
            has_geometry: !!leafletCoordinates,
            coordinates_count: leafletCoordinates?.[0]?.length || 0,
          });

          return leafletCoordinates;
        } catch (error) {
          console.error(
            `❌ Error processing geometry for ${detail.ky_hieu_mdsd}:`,
            error
          );
          return null;
        }
      })
      .filter(Boolean);

    if (landUseGeometries.length > 0) {
      console.log(
        `✅ Successfully processed ${landUseGeometries.length} land use geometries`
      );
      return {
        geometries: landUseGeometries,
        source: "land_use_details",
        details: plot.land_use_details.map((detail, index) => ({
          ...detail,
          color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
          leafletGeometry: landUseGeometries[index] || null,
        })),
      };
    }
  }

  // ✅ FALLBACK 2: Xử lý từ geom chính nếu có
  if (plot.geom) {
    console.log("🔄 Using main geom as fallback");

    try {
      const processedGeom = processGeometryData(plot.geom);
      const leafletCoordinates = processedGeom
        ? convertGeoJSONToLeaflet(processedGeom)
        : null;

      if (leafletCoordinates) {
        console.log(`✅ Successfully processed main geom:`, {
          coordinates_count: leafletCoordinates[0]?.length || 0,
        });

        // Tạo mock land_use_details từ geom chính
        const mockDetail = {
          ky_hieu_mdsd: plot.ky_hieu_mdsd || "UNKNOWN",
          dien_tich: plot.dien_tich || "0",
          color: getColorByLoaiDat(plot.ky_hieu_mdsd),
          geometry: plot.geom,
        };

        return {
          geometries: [leafletCoordinates],
          source: "main_geom",
          details: [
            {
              ...mockDetail,
              leafletGeometry: leafletCoordinates,
            },
          ],
        };
      }
    } catch (error) {
      console.error("❌ Error processing main geom:", error);
    }
  }

  console.error("❌ No valid geometry found for plot");
  return null;
};

const LandUsePlanningMap = () => {
  const [phuongXa, setPhuongXa] = useState("");
  const [soTo, setSoTo] = useState("");
  const [soThua, setSoThua] = useState("");
  const [landUseData, setLandUseData] = useState([]);
  const [overlapData, setOverlapData] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.367, 106.345]);
  const [searchCenter, setSearchCenter] = useState([10.367, 106.345]);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState("");
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [shouldUpdateView, setShouldUpdateView] = useState(false);
  const [displayMode, setDisplayMode] = useState("single");
  const [currentOverlapIndex, setCurrentOverlapIndex] = useState(0);

  const token = localStorage.getItem("token");
  const searchTimeoutRef = useRef(null);

  // Debug chi tiết khi landUseData thay đổi
  useEffect(() => {
    if (landUseData.length > 0) {
      console.log("=== DEBUG FINAL LAND USE DATA ===");
      landUseData.forEach((plot, index) => {
        console.log(`Plot ${plot.id} (${plot.so_to}/${plot.so_thua}):`, {
          geometry_source: plot.geometrySource,
          geometries_count: plot.geom?.length,
          details_count: plot.land_use_details?.length,
          has_valid_geometry: !!plot.geom && plot.geom.length > 0,
        });
      });
    }
  }, [landUseData]);

  // Fetch API + xử lý geom LINH HOẠT
  const fetchData = useCallback(
    async (phuongXa = "", soTo = "", soThua = "") => {
      const now = Date.now();
      if (now - lastSearchTime < 1000) return;
      setLastSearchTime(now);

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      try {
        if (!token) {
          setError("Vui lòng đăng nhập để tiếp tục.");
          return;
        }

        setIsLoading(true);
        setError(null);
        setShouldUpdateView(false);
        setOverlapData(null);

        // Gọi API land_plots
        const landResponse = await axios.get(`${API_URL}/api/land_plots`, {
          params: { phuong_xa: phuongXa, so_to: soTo, so_thua: soThua },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });

        console.log("✅ Land API response:", landResponse.data);

        if (landResponse.data.success) {
          const data = landResponse.data.data
            .map((plot) => {
              console.log(`📊 Original plot ${plot.id}:`, {
                so_to: plot.so_to,
                so_thua: plot.so_thua,
                has_land_use_details: !!plot.land_use_details,
                land_use_details_count: plot.land_use_details?.length,
                has_geom: !!plot.geom,
              });

              // Xử lý geometry LINH HOẠT
              const geometryResult = processPlotGeometry(plot);

              if (!geometryResult) {
                console.warn(`⚠️ No valid geometry for plot ${plot.id}`);
                return null;
              }

              // Tạo plot mới với geometry đã xử lý
              const processedPlot = {
                ...plot,
                geom: geometryResult.geometries,
                geometrySource: geometryResult.source,
                land_use_details: geometryResult.details,
                originalGeom: plot.geom,
              };

              console.log(`✅ Processed plot ${plot.id}:`, {
                source: processedPlot.geometrySource,
                geometries_count: processedPlot.geom.length,
                details_count: processedPlot.land_use_details.length,
              });

              return processedPlot;
            })
            .filter(Boolean);

          console.log("✅ Final processed data:", data);

          setLandUseData(data);
          setSearchType(landResponse.data.search_type || "suggest");

          // Cập nhật map center dựa trên geometries
          if (data.length > 0) {
            const firstPlot = data[0];
            if (firstPlot.geom && firstPlot.geom.length > 0) {
              // Lấy tất cả tọa độ từ tất cả geometries
              const allCoords = firstPlot.geom
                .flat(3)
                .filter((coord) => Array.isArray(coord) && coord.length === 2);

              if (allCoords.length > 0) {
                const latSum = allCoords.reduce(
                  (sum, coord) => sum + coord[0],
                  0
                );
                const lngSum = allCoords.reduce(
                  (sum, coord) => sum + coord[1],
                  0
                );

                const centerLat = latSum / allCoords.length;
                const centerLng = lngSum / allCoords.length;

                console.log("📍 Setting map center to:", [
                  centerLat,
                  centerLng,
                ]);

                setSearchCenter([centerLat, centerLng]);
                setMapCenter([centerLat, centerLng]);
                setShouldUpdateView(true);
                setZoomLevel(18);
              }
            }
          }

          if (data.length === 0) {
            setError("Không tìm thấy lô đất phù hợp.");
          } else if (landResponse.data.search_type === "exact") {
            setError(null);
          } else {
            setError(`Tìm thấy ${data.length} kết quả gợi ý.`);
          }

          // Gọi API overlap-group
          try {
            const overlapResponse = await axios.get(
              `${API_URL}/api/land_plots/overlap-group`,
              {
                params: { so_to: soTo, so_thua: soThua },
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
              }
            );

            console.log("✅ Overlap API response:", overlapResponse.data);

            if (overlapResponse.data.success && overlapResponse.data.features) {
              const firstFeature = overlapResponse.data.features[0];
              if (firstFeature) {
                setOverlapData(firstFeature);

                if (
                  firstFeature.sub_geometries &&
                  firstFeature.sub_geometries.length > 1
                ) {
                  setDisplayMode("alternating");
                  setCurrentOverlapIndex(0);
                } else {
                  setDisplayMode("single");
                }
              }
            }
          } catch (overlapError) {
            console.log("ℹ️ Không thể lấy overlap data:", overlapError.message);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ Fetch error:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          setError("Vui lòng đăng nhập để tiếp tục.");
        } else {
          setError("Lỗi khi lấy dữ liệu từ server.");
        }
        setLandUseData([]);
        setOverlapData(null);
        setIsLoading(false);
      }
    },
    [token, lastSearchTime]
  );

  const handleSearch = () => {
    if (!phuongXa && !soTo && !soThua) {
      setError("Nhập ít nhất 1 thông tin để tra cứu.");
      return;
    }
    fetchData(phuongXa, soTo, soThua);
  };

  // Reset shouldUpdateView sau khi đã update xong
  useEffect(() => {
    if (shouldUpdateView) {
      const timer = setTimeout(() => setShouldUpdateView(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldUpdateView]);

  useEffect(() => {
    fetchData("Trung An", "", "");
  }, [fetchData]);

  // ✅ Render polygons LINH HOẠT
  const renderedPolygons = useMemo(() => {
    console.log("🔍 Rendering polygons with landUseData:", landUseData);
    if (isLoading) return null;

    const getStyleByZoom = (zoom) => {
      const zoomLevel = zoom || 15;
      switch (true) {
        case zoomLevel >= 20:
          return { opacity: 0.9, weight: 4, dashArray: null };
        case zoomLevel >= 18:
          return { opacity: 0.85, weight: 3, dashArray: null };
        case zoomLevel >= 16:
          return { opacity: 0.8, weight: 2.5, dashArray: null };
        case zoomLevel >= 14:
          return { opacity: 0.7, weight: 2, dashArray: null };
        case zoomLevel >= 12:
          return { opacity: 0.6, weight: 1.5, dashArray: "2,2" };
        case zoomLevel >= 10:
          return { opacity: 0.5, weight: 1, dashArray: "3,3" };
        default:
          return { opacity: 0.3, weight: 0.6, dashArray: "4,4" };
      }
    };

    const style = getStyleByZoom(zoomLevel);

    // ✅ Render từ landUseData (linh hoạt cả land_use_details và main geom)
    if (landUseData.length > 0) {
      console.log(`🎨 Rendering ${landUseData.length} plots`);

      return landUseData
        .flatMap((plot, plotIndex) => {
          if (!plot.land_use_details || plot.land_use_details.length === 0) {
            console.warn(`⚠️ Plot ${plot.id} has no land_use_details`);
            return null;
          }

          return plot.land_use_details
            .map((detail, detailIndex) => {
              if (!detail.leafletGeometry) {
                console.warn(
                  `⚠️ Detail ${detail.ky_hieu_mdsd} has no geometry`
                );
                return null;
              }

              const fillColor =
                detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd);

              console.log(
                `🎨 Rendering ${detail.ky_hieu_mdsd} (source: ${plot.geometrySource})`,
                {
                  color: fillColor,
                  geometry_type: Array.isArray(detail.leafletGeometry[0])
                    ? "polygon"
                    : "unknown",
                }
              );

              // Render từng polygon trong geometry
              return detail.leafletGeometry.map((polygonCoords, polyIndex) => (
                <Polygon
                  key={`${plot.id}-${detail.ky_hieu_mdsd}-${polyIndex}-${plot.geometrySource}`}
                  positions={polygonCoords}
                  pathOptions={{
                    color: fillColor,
                    fillColor: fillColor,
                    fillOpacity: style.opacity,
                    weight: style.weight,
                    stroke: true,
                    lineJoin: "round",
                    dashArray: style.dashArray,
                  }}
                >
                  <Popup>
                    <PlotInfo plot={plot} detail={detail} />
                  </Popup>
                </Polygon>
              ));
            })
            .filter(Boolean);
        })
        .filter(Boolean);
    }

    return null;
  }, [landUseData, zoomLevel, isLoading]);

  // ✅ Component để điều chỉnh map behavior
  const MapBehaviorHandler = ({ setZoomLevel }) => {
    const map = useMap();
    useEffect(() => {
      const handleZoom = () => {
        const currentZoom = map.getZoom();
        setZoomLevel(currentZoom);
        map.invalidateSize();
      };
      map.on("zoomend", handleZoom);
      map.on("moveend", handleZoom);
      setZoomLevel(map.getZoom());
      return () => {
        map.off("zoomend", handleZoom);
        map.off("moveend", handleZoom);
      };
    }, [map, setZoomLevel]);
    return null;
  };

  // ✅ Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
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
            value={landUseData.length > 0 ? landUseData.phuong_xa : ""}
            onChange={(e) => setPhuongXa(e.target.value)}
          >
            <option value="">--Chọn Phường/Xã--</option>
            {landUseData.length > 0 ? (
              landUseData.map((plot, index) => (
                <option key={index} value={plot.phuong_xa}>
                  {plot.phuong_xa || "Không có tên Phường/Xã nào"}
                </option>
              ))
            ) : (
              <option value="" disabled>
                Không có danh sách nào
              </option>
            )}
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
          className={`error-message ${
            searchType === "suggest" ? "warning" : "error"
          }`}
        >
          {error}
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
          zoomSnap={0.5}
          zoomDelta={0.5}
        >
          {/* SỬ DỤNG LAYERS CONTROL ĐỂ ĐỔI BẢN ĐỒ NỀN VỚI SUBDOMAINS */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="🗺️ OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                subdomains={["a", "b", "c"]}
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🛰️ Vệ tinh">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
                subdomains={["a", "b", "c", "d"]}
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🌍 CartoDB Light">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; CartoDB"
                subdomains={["a", "b", "c", "d"]}
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🌃 CartoDB Dark">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; CartoDB"
                subdomains={["a", "b", "c", "d"]}
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="⛰️ Địa hình">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenTopoMap"
                subdomains={["a", "b", "c"]}
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={17}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

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
    </>
  );
};

export default LandUsePlanningMap;
