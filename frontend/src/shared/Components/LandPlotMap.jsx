// import React from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Polygon,
//   useMap,
//   Marker,
//   Popup,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // Sửa lỗi cho biểu tượng marker trong React-Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// // Component điều chỉnh bản đồ vào bounds
// const MapController = ({ bounds }) => {
//   const map = useMap();
//   React.useEffect(() => {
//     if (bounds && Array.isArray(bounds) && bounds.length > 0) {
//       try {
//         const latLngBounds = L.latLngBounds(bounds);
//         map.fitBounds(latLngBounds, { padding: [20, 20], maxZoom: 18 });
//       } catch (error) {
//         console.error("Lỗi điều chỉnh giới hạn:", error);
//       }
//     }
//   }, [map, bounds]);
//   return null;
// };

// // Đọc int32
// const readInt32 = (hex, offset, isLittleEndian = true) => {
//   const hexPart = hex.substring(offset, offset + 8);
//   if (isLittleEndian) {
//     let reversed = "";
//     for (let i = 0; i < 8; i += 2) {
//       reversed = hex.substring(offset + i, offset + i + 2) + reversed;
//     }
//     return parseInt(reversed, 16);
//   }
//   return parseInt(hexPart, 16);
// };

// // Hex → double
// const hexToDouble = (hex, isLittleEndian = true) => {
//   try {
//     if (hex.length !== 16) return NaN;
//     let bytes = hex;
//     if (isLittleEndian) {
//       let reversed = "";
//       for (let i = 0; i < 16; i += 2) {
//         reversed = hex.substring(i, i + 2) + reversed;
//       }
//       bytes = reversed;
//     }
//     const buffer = new ArrayBuffer(8);
//     const view = new DataView(buffer);
//     for (let i = 0; i < 8; i++) {
//       view.setUint8(i, parseInt(bytes.substring(i * 2, i * 2 + 2), 16));
//     }
//     const result = view.getFloat64(0, false);
//     return isNaN(result) || !isFinite(result)
//       ? NaN
//       : Number(result.toPrecision(17));
//   } catch (error) {
//     console.error("Lỗi chuyển hex sang double:", error);
//     return NaN;
//   }
// };

// // Parse EWKB → trả về [[ [lng, lat], ... ]]
// const parseEwkbSimple = (ewkbHex) => {
//   try {
//     const hex = ewkbHex.replace(/\s/g, "").toUpperCase();
//     if (hex.length < 44) return null;

//     let offset = 0;
//     const byteOrder = hex.substr(offset, 2);
//     offset += 2;
//     const isLittleEndian = byteOrder === "01";

//     const geomType = readInt32(hex, offset, isLittleEndian);
//     offset += 8;

//     const hasSrid = (geomType & 0x20000000) !== 0;
//     if (hasSrid) offset += 8;

//     const polygons = [];

//     if ((geomType & 0x1fffffff) === 3) {
//       const numRings = readInt32(hex, offset, isLittleEndian);
//       offset += 8;

//       for (let r = 0; r < numRings; r++) {
//         const numPoints = readInt32(hex, offset, isLittleEndian);
//         offset += 8;
//         const ring = [];

//         for (let i = 0; i < numPoints; i++) {
//           if (offset + 32 > hex.length) break;
//           const lngHex = hex.substr(offset, 16);
//           const latHex = hex.substr(offset + 16, 16);
//           offset += 32;

//           const lng = hexToDouble(lngHex, isLittleEndian);
//           const lat = hexToDouble(latHex, isLittleEndian);

//           if (!isNaN(lng) && !isNaN(lat)) {
//             ring.push([lng, lat]); // [lng, lat] — ĐÚNG
//           }
//         }
//         if (ring.length >= 4) polygons.push(ring);
//       }
//     }

//     return polygons.length > 0 ? polygons : null;
//   } catch (e) {
//     console.error("Parse EWKB error:", e);
//     return null;
//   }
// };

// // Parse geometry → trả về { coordinates, bounds, center: [lng, lat] }
// // const parseGeometry = (geomData) => {
// //   // 1. Ưu tiên: GeoJSON string (từ ST_AsGeoJSON::text)
// //   if (typeof geomData === "string" && geomData.trim().startsWith("{")) {
// //     try {
// //       const geojson = JSON.parse(geomData);
// //       if (geojson.type === "Polygon" && geojson.coordinates?.[0]?.length >= 4) {
// //         const ring = geojson.coordinates[0];
// //         const flat = ring.slice(0, -1); // loại bỏ điểm cuối trùng đầu
// //         const sum = flat.reduce(
// //           (a, [lng, lat]) => [a[0] + lng, a[1] + lat],
// //           [0, 0]
// //         );
// //         const center = [sum[0] / flat.length, sum[1] / flat.length]; // [lng, lat]
// //         return { coordinates: [ring], bounds: ring, center };
// //       }
// //     } catch (e) {
// //       console.error("GeoJSON parse error:", e);
// //     }
// //   }

// //   // 2. Fallback: EWKB hex
// //   if (typeof geomData === "string" && geomData.match(/^01[0-9A-Fa-f]+$/)) {
// //     const polygons = parseEwkbSimple(geomData);
// //     if (polygons && polygons.length > 0) {
// //       const flat = polygons.flat();
// //       const sum = flat.reduce(
// //         (a, [lng, lat]) => [a[0] + lng, a[1] + lat],
// //         [0, 0]
// //       );
// //       const center = [sum[0] / flat.length, sum[1] / flat.length]; // [lng, lat]
// //       return { coordinates: polygons, bounds: flat, center };
// //     }
// //   }

// //   return null;
// // };
// // const parseGeometry = (geomData) => {
// //   console.log("🔍 parseGeometry called with:", typeof geomData, geomData);

// //   if (!geomData) {
// //     console.log("❌ Không có dữ liệu geometry");
// //     return null;
// //   }

// //   // TRƯỜNG HỢP 1: Đã là GeoJSON object (backend đã xử lý)
// //   if (typeof geomData === "object" && geomData !== null) {
// //     console.log("✅ Đã là GeoJSON object từ backend", geomData);

// //     if (geomData.type === "Polygon" && Array.isArray(geomData.coordinates)) {
// //       const coordinates = geomData.coordinates;
// //       const exteriorRing = coordinates[0]; // Lấy ring đầu tiên

// //       // Tính center [lng, lat]
// //       const sum = exteriorRing.reduce(
// //         (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
// //         [0, 0]
// //       );
// //       const center = [
// //         sum[0] / exteriorRing.length,
// //         sum[1] / exteriorRing.length,
// //       ];

// //       console.log("✅ Parse GeoJSON object thành công", {
// //         center,
// //         pointsCount: exteriorRing.length,
// //       });

// //       return {
// //         coordinates: [coordinates], // Đảm bảo đúng format [[ring]]
// //         bounds: exteriorRing,
// //         center: center,
// //       };
// //     }
// //   }

// //   // TRƯỜNG HỢP 2: EWKB hex string (fallback)
// //   if (typeof geomData === "string" && geomData.startsWith("010")) {
// //     console.log("🔧 Parse EWKB hex string");
// //     const polygons = parseEwkbSimple(geomData);
// //     if (polygons && polygons.length > 0) {
// //       const flat = polygons.flat();
// //       const sum = flat.reduce(
// //         (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
// //         [0, 0]
// //       );
// //       const center = [sum[0] / flat.length, sum[1] / flat.length];

// //       return {
// //         coordinates: polygons,
// //         bounds: flat,
// //         center: center,
// //       };
// //     }
// //   }

// //   console.warn("⚠️ Không thể parse geometry data:", geomData);
// //   return null;
// // };
// // Hàm parse geometry chính
// const parseGeometry = (geomData) => {
//   if (!geomData) {
//     return null;
//   }

//   try {
//     // Nếu là GeoJSON object
//     if (typeof geomData === "object" && geomData !== null) {
//       if (isValidGeoJSON(geomData)) {
//         const allPoints = geomData.coordinates[0]; // Lấy ring đầu tiên [lng, lat]
//         let sumLng = 0,
//           sumLat = 0;
//         let validPoints = 0;

//         allPoints.forEach(([lng, lat]) => {
//           if (!isNaN(lat) && !isNaN(lng)) {
//             sumLng += lng;
//             sumLat += lat;
//             validPoints++;
//           }
//         });

//         if (validPoints === 0) return null;

//         const center = [sumLng / validPoints, sumLat / validPoints]; // [lng, lat]

//         return {
//           coordinates: [geomData.coordinates],
//           bounds: allPoints,
//           center: center, // [lng, lat]
//         };
//       }
//     }
//     // Nếu là GeoJSON string
//     else if (typeof geomData === "string" && geomData.trim().startsWith("{")) {
//       const parsed = JSON.parse(geomData);
//       if (isValidGeoJSON(parsed)) {
//         const allPoints = parsed.coordinates[0];
//         let sumLng = 0,
//           sumLat = 0;
//         let validPoints = 0;

//         allPoints.forEach(([lng, lat]) => {
//           if (!isNaN(lat) && !isNaN(lng)) {
//             sumLng += lng;
//             sumLat += lat;
//             validPoints++;
//           }
//         });

//         if (validPoints === 0) return null;

//         const center = [sumLng / validPoints, sumLat / validPoints]; // [lng, lat]

//         return {
//           coordinates: [parsed.coordinates],
//           bounds: allPoints,
//           center: center, // [lng, lat]
//         };
//       }
//     }
//     // Nếu là WKB hex string
//     else if (typeof geomData === "string" && geomData.startsWith("01")) {
//       const polygons = parseEwkbSimple(geomData);
//       if (polygons && polygons.length > 0) {
//         const allPoints = polygons.flat();
//         let sumLng = 0,
//           sumLat = 0;
//         let validPoints = 0;

//         allPoints.forEach(([lng, lat]) => {
//           if (!isNaN(lat) && !isNaN(lng)) {
//             sumLng += lng;
//             sumLat += lat;
//             validPoints++;
//           }
//         });

//         if (validPoints === 0) return null;

//         const center = [sumLng / validPoints, sumLat / validPoints]; // [lng, lat]

//         return {
//           coordinates: polygons,
//           bounds: allPoints,
//           center: center, // [lng, lat]
//         };
//       }
//     }

//     return null;
//   } catch (error) {
//     console.error("❌ Lỗi xử lý geometry:", error);
//     return null;
//   }
// };

// const LandPlotMap = ({ geom, plotInfo = {} }) => {
//   const [geometryData, setGeometryData] = React.useState(null);
//   const [mapCenter, setMapCenter] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);

//   // Trung tâm mặc định: [lat, lng]
//   const getDefaultCenter = React.useCallback(() => [10.8231, 106.6297], []);

//   // Fallback polygon: [[lat, lng], ...]
//   const getFallbackCoordinates = React.useCallback(() => {
//     const [lat, lng] = getDefaultCenter();
//     const o = 0.001;
//     return [
//       [lat - o, lng - o],
//       [lat - o, lng + o],
//       [lat + o, lng + o],
//       [lat + o, lng - o],
//       [lat - o, lng - o],
//     ];
//   }, [getDefaultCenter]);

//   React.useEffect(() => {
//     const process = () => {
//       setLoading(true);
//       try {
//         let center = null;
//         let parsed = null;

//         if (geom) {
//           parsed = parseGeometry(geom);
//           if (parsed) {
//             setGeometryData(parsed);
//             center = parsed.center; // [lng, lat]
//           }
//         }

//         if (!center) center = getDefaultCenter(); // [lat, lng]

//         // Chuyển [lng, lat] → [lat, lng] cho Leaflet
//         setMapCenter([center[1], center[0]]);
//       } catch (err) {
//         console.error("Lỗi xử lý:", err);
//         setMapCenter(getDefaultCenter());
//       } finally {
//         setLoading(false);
//       }
//     };
//     process();
//   }, [geom, getDefaultCenter]);

//   const displayData = React.useMemo(() => {
//     const hasRealData = !!geometryData && !!geom;

//     const coordinates = hasRealData
//       ? geometryData.coordinates // [[ [lng, lat], ... ]]
//       : [getFallbackCoordinates()];

//     const bounds = hasRealData
//       ? geometryData.bounds.map(([lng, lat]) => [lat, lng]) // → [lat, lng]
//       : getFallbackCoordinates();

//     const center = mapCenter || getDefaultCenter(); // [lat, lng]

//     return { coordinates, bounds, center, hasRealData };
//   }, [geometryData, geom, mapCenter, getFallbackCoordinates, getDefaultCenter]);

//   if (loading) {
//     return (
//       <div
//         style={{
//           height: "500px",
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           backgroundColor: "#f8f9fa",
//           borderRadius: "12px",
//           border: "1px solid #e1e5e9",
//         }}
//       >
//         <div style={{ textAlign: "center", color: "#6c757d" }}>
//           <div
//             style={{
//               width: "48px",
//               height: "48px",
//               border: "4px solid #f3f3f3",
//               borderTop: "4px solid #3388ff",
//               borderRadius: "50%",
//               animation: "spin 1s linear infinite",
//               margin: "0 auto 16px",
//             }}
//           ></div>
//           <div style={{ fontSize: "16px", fontWeight: "600" }}>
//             Đang tải bản đồ...
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         height: "500px",
//         width: "100%",
//         position: "relative",
//         borderRadius: "12px",
//         overflow: "hidden",
//         boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
//         border: "1px solid #e1e5e9",
//       }}
//     >
//       <MapContainer
//         center={displayData.center}
//         zoom={displayData.hasRealData ? 16 : 14}
//         style={{ height: "100%", width: "100%" }}
//         scrollWheelZoom={true}
//         zoomControl={true}
//         dragging={true}
//         key={displayData.center.join(",")}
//       >
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         {/* Polygon: [lng, lat] → [lat, lng]
//         {displayData.coordinates.map((ring, i) => (
//           <Polygon
//             key={i}
//             positions={ring.map(([lng, lat]) => [lat, lng])} // [lng, lat] → [lat, lng]
//             pathOptions={{
//               color: displayData.hasRealData ? "#2563eb" : "#f59e0b",
//               fillColor: displayData.hasRealData
//                 ? "rgba(37,99,235,0.2)"
//                 : "rgba(245,158,11,0.2)",
//               fillOpacity: 0.3,
//               weight: displayData.hasRealData ? 3 : 2,
//               opacity: 0.8,
//             }}
//           />
//         ))} */}
//         // TRONG phần render - sửa cách xử lý coordinates
//         {displayData.coordinates.map((polygonCoords, index) => {
//           // polygonCoords có thể là [[[lng,lat],...]] (GeoJSON) hoặc [[lng,lat],...] (EWKB)
//           let positions = [];

//           if (
//             Array.isArray(polygonCoords[0]) &&
//             Array.isArray(polygonCoords[0][0])
//           ) {
//             // Định dạng GeoJSON: [[[lng,lat],...]] - lấy ring đầu tiên
//             positions = polygonCoords[0].map(([lng, lat]) => [lat, lng]);
//           } else {
//             // Định dạng EWKB: [[lng,lat],...]
//             positions = polygonCoords.map(([lng, lat]) => [lat, lng]);
//           }

//           return (
//             <Polygon
//               key={index}
//               positions={positions}
//               pathOptions={{
//                 color: displayData.hasRealData ? "#2563eb" : "#f59e0b",
//                 fillColor: displayData.hasRealData
//                   ? "rgba(37,99,235,0.2)"
//                   : "rgba(245,158,11,0.2)",
//                 fillOpacity: 0.3,
//                 weight: displayData.hasRealData ? 3 : 2,
//                 opacity: 0.8,
//               }}
//             />
//           );
//         })}
//         {/* Marker tại trung tâm */}
//         <Marker position={displayData.center}>
//           <Popup>
//             <div style={{ padding: "8px", textAlign: "center" }}>
//               <div
//                 style={{
//                   fontWeight: "bold",
//                   color: "#2563eb",
//                   marginBottom: "4px",
//                 }}
//               >
//                 Vị trí trung tâm
//               </div>
//               <div style={{ fontSize: "12px", color: "#666" }}>
//                 {displayData.center[1].toFixed(6)},{" "}
//                 {displayData.center[0].toFixed(6)}
//               </div>
//               <div
//                 style={{ fontSize: "10px", color: "#999", marginTop: "4px" }}
//               >
//                 {displayData.hasRealData
//                   ? "(Từ hình dạng thực tế)"
//                   : "(Vị trí ước tính)"}
//               </div>
//             </div>
//           </Popup>
//         </Marker>
//         {/* Fit bounds */}
//         {displayData.bounds.length > 0 && (
//           <MapController bounds={displayData.bounds} />
//         )}
//       </MapContainer>

//       {/* Info Panel */}
//       <div
//         style={{
//           position: "absolute",
//           top: "16px",
//           right: "16px",
//           background: "rgba(255,255,255,0.95)",
//           backdropFilter: "blur(10px)",
//           borderRadius: "12px",
//           padding: "20px",
//           minWidth: "280px",
//           boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
//           border: "1px solid rgba(255,255,255,0.2)",
//           zIndex: 500,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             marginBottom: "16px",
//             paddingBottom: "12px",
//             borderBottom: "1px solid #f1f5f9",
//           }}
//         >
//           <div
//             style={{
//               width: "8px",
//               height: "8px",
//               borderRadius: "50%",
//               background: displayData.hasRealData ? "#10b981" : "#f59e0b",
//               marginRight: "10px",
//             }}
//           ></div>
//           <h3
//             style={{
//               margin: 0,
//               fontSize: "16px",
//               fontWeight: "700",
//               color: "#1e293b",
//             }}
//           >
//             {displayData.hasRealData ? "Hình dạng thực tế" : "Vị trí ước tính"}
//           </h3>
//         </div>

//         <div style={{ marginBottom: "16px" }}>
//           {["so_to", "so_thua", "dien_tich"].map((key) => (
//             <div
//               key={key}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "8px",
//               }}
//             >
//               <span
//                 style={{
//                   fontSize: "13px",
//                   color: "#64748b",
//                   fontWeight: "500",
//                 }}
//               >
//                 {key === "so_to"
//                   ? "Số tờ"
//                   : key === "so_thua"
//                   ? "Số thửa"
//                   : "Diện tích"}
//                 :
//               </span>
//               <span
//                 style={{
//                   fontSize: "13px",
//                   color: "#1e293b",
//                   fontWeight: "600",
//                 }}
//               >
//                 {key === "dien_tich"
//                   ? plotInfo[key]
//                     ? `${plotInfo[key]} m²`
//                     : "N/A"
//                   : plotInfo[key] || "N/A"}
//               </span>
//             </div>
//           ))}
//         </div>

//         <div
//           style={{
//             background: displayData.hasRealData ? "#f0f9ff" : "#fffbeb",
//             border: `1px solid ${
//               displayData.hasRealData ? "#bae6fd" : "#fed7aa"
//             }`,
//             borderRadius: "8px",
//             padding: "12px",
//             textAlign: "center",
//           }}
//         >
//           <div
//             style={{
//               fontSize: "12px",
//               color: displayData.hasRealData ? "#0369a1" : "#92400e",
//               fontWeight: "500",
//             }}
//           >
//             {displayData.hasRealData
//               ? "Dữ liệu hình học có sẵn"
//               : "Sử dụng vị trí ước tính"}
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default LandPlotMap;

import React from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  useMap,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Sửa lỗi icon mặc định
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// === MAP CONTROLLER ===
const MapController = ({ bounds }) => {
  const map = useMap();
  React.useEffect(() => {
    if (bounds && Array.isArray(bounds) && bounds.length >= 3) {
      try {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, {
          padding: [50, 50],
          maxZoom: 18,
        });
      } catch (error) {
        console.error("Lỗi fitBounds:", error);
      }
    }
  }, [map, bounds]);
  return null;
};

// === PARSE EWKB - FIXED VERSION ===
const parseEwkbSimple = (ewkbHex) => {
  if (!ewkbHex || typeof ewkbHex !== "string") return null;

  try {
    // Loại bỏ tiền tố "01" nếu có (chỉ quan tâm phần geometry)
    let hex = ewkbHex.startsWith("01") ? ewkbHex.substring(2) : ewkbHex;

    // EWKB cho MULTIPOLYGON (010600...) hoặc POLYGON (010300...)
    if (hex.startsWith("000000000600") || hex.startsWith("000000000300")) {
      // Đọc số polygon
      const numPolygonsHex = hex.substring(12, 20);
      const numPolygons = parseInt(numPolygonsHex, 16);

      const polygons = [];
      let offset = 20;

      for (let p = 0; p < numPolygons; p++) {
        // Đọc số ring (thường là 1 ring ngoài)
        const numRingsHex = hex.substring(offset, offset + 8);
        const numRings = parseInt(numRingsHex, 16);
        offset += 8;

        for (let r = 0; r < numRings; r++) {
          // Đọc số điểm
          const numPointsHex = hex.substring(offset, offset + 8);
          const numPoints = parseInt(numPointsHex, 16);
          offset += 8;

          const ring = [];
          for (let i = 0; i < numPoints; i++) {
            // Đọc tọa độ (little-endian double)
            const lngHex = hex.substring(offset, offset + 16);
            const latHex = hex.substring(offset + 16, offset + 32);

            const lng = hexToDouble(lngHex);
            const lat = hexToDouble(latHex);

            ring.push([lat, lng]); // [lat, lng] cho Leaflet
            offset += 32;
          }
          polygons.push(ring);
        }
      }

      return polygons;
    }

    return null;
  } catch (error) {
    console.error("Lỗi parse EWKB:", error);
    return null;
  }
};

// Helper function để chuyển hex sang double (little-endian)
const hexToDouble = (hex) => {
  if (!hex || hex.length !== 16) return 0;

  let littleEndianHex = "";
  for (let i = 0; i < 16; i += 2) {
    littleEndianHex = hex.substring(i, i + 2) + littleEndianHex;
  }

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  for (let i = 0; i < 8; i++) {
    view.setUint8(i, parseInt(littleEndianHex.substring(i * 2, i * 2 + 2), 16));
  }

  return view.getFloat64(0, false); // big-endian
};

// === PARSE GEOMETRY CHÍNH - FIXED ===
const parseGeometry = (geomData) => {
  if (!geomData) return null;

  try {
    let geojson = null;

    // 1. GeoJSON string (ưu tiên cao nhất)
    if (typeof geomData === "string" && geomData.trim().startsWith("{")) {
      try {
        geojson = JSON.parse(geomData);
      } catch (e) {
        console.warn("GeoJSON string parse thất bại:", e);
      }
    }
    // 2. GeoJSON object
    else if (typeof geomData === "object" && geomData.type) {
      geojson = geomData;
    }

    // Xử lý GeoJSON hợp lệ
    if (geojson) {
      if (geojson.type === "Polygon" && geojson.coordinates?.[0]?.length >= 4) {
        const ring = geojson.coordinates[0];
        const points = ring.slice(0, -1); // loại bỏ điểm cuối trùng đầu

        // Tính trung tâm và bounds
        const sum = points.reduce(
          (a, [lng, lat]) => [a[0] + lng, a[1] + lat],
          [0, 0]
        );
        const center = [sum[1] / points.length, sum[0] / points.length]; // [lat, lng]

        const bounds = points.map(([lng, lat]) => [lat, lng]);

        return {
          coordinates: [ring.map(([lng, lat]) => [lat, lng])], // [[lat, lng], ...]
          bounds: bounds,
          center: center,
        };
      } else if (geojson.type === "MultiPolygon") {
        // Xử lý MultiPolygon
        const allPoints = [];
        const polygons = geojson.coordinates.map((polygon) =>
          polygon[0].map(([lng, lat]) => {
            allPoints.push([lng, lat]);
            return [lat, lng];
          })
        );

        if (allPoints.length > 0) {
          const sum = allPoints.reduce(
            (a, [lng, lat]) => [a[0] + lng, a[1] + lat],
            [0, 0]
          );
          const center = [sum[1] / allPoints.length, sum[0] / allPoints.length];
          const bounds = allPoints.map(([lng, lat]) => [lat, lng]);

          return {
            coordinates: polygons,
            bounds: bounds,
            center: center,
          };
        }
      }
    }

    // 3. Fallback: EWKB hex (sửa lỗi chính ở đây)
    if (typeof geomData === "string" && geomData.match(/^01[0-9A-Fa-f]+$/)) {
      console.log("Parsing EWKB:", geomData.substring(0, 50) + "...");
      const polygons = parseEwkbSimple(geomData);

      if (polygons && polygons.length > 0) {
        const allPoints = polygons.flat();
        const sum = allPoints.reduce(
          (a, [lat, lng]) => [a[0] + lat, a[1] + lng],
          [0, 0]
        );
        const center = [sum[0] / allPoints.length, sum[1] / allPoints.length];
        const bounds = allPoints;

        return {
          coordinates: polygons,
          bounds: bounds,
          center: center,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Lỗi parse geometry:", error);
    return null;
  }
};

// === COMPONENT CHÍNH ===
const LandPlotMap = ({ geom, plotInfo = {} }) => {
  const [geometryData, setGeometryData] = React.useState(null);
  const [mapCenter, setMapCenter] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const getDefaultCenter = React.useCallback(() => [10.8231, 106.6297], []);

  const getFallbackCoordinates = React.useCallback(() => {
    const [lat, lng] = getDefaultCenter();
    const o = 0.001;
    return [
      [lat - o, lng - o],
      [lat - o, lng + o],
      [lat + o, lng + o],
      [lat + o, lng - o],
      [lat - o, lng - o],
    ];
  }, [getDefaultCenter]);

  // === XỬ LÝ GEOMETRY ===
  React.useEffect(() => {
    const process = () => {
      setLoading(true);
      try {
        console.log("Original geom:", geom);
        const parsed = geom ? parseGeometry(geom) : null;
        console.log("Parsed geometry:", parsed);

        setGeometryData(parsed);
        const center = parsed?.center || getDefaultCenter();
        setMapCenter(center);
      } catch (err) {
        console.error("Lỗi xử lý geometry:", err);
        setMapCenter(getDefaultCenter());
      } finally {
        setLoading(false);
      }
    };
    process();
  }, [geom, getDefaultCenter]);

  // === DỮ LIỆU HIỂN THỊ ===
  const displayData = React.useMemo(() => {
    const hasRealData = !!geometryData;
    return {
      coordinates: hasRealData
        ? geometryData.coordinates
        : [getFallbackCoordinates()],
      bounds: hasRealData ? geometryData.bounds : getFallbackCoordinates(),
      center: mapCenter || getDefaultCenter(),
      hasRealData,
    };
  }, [geometryData, mapCenter, getFallbackCoordinates, getDefaultCenter]);

  if (loading) {
    return (
      <div
        style={{
          height: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f9fa",
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3388ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <div style={{ fontWeight: 600 }}>Đang tải bản đồ...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 500,
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <MapContainer
        center={displayData.center}
        zoom={displayData.hasRealData ? 17 : 14}
        style={{ height: "100%", width: "100%" }}
        key={displayData.center.join(",")}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {/* VẼ POLYGON */}
        {displayData.coordinates.map((ring, i) => (
          <Polygon
            key={i}
            positions={ring}
            pathOptions={{
              color: displayData.hasRealData ? "#2563eb" : "#f59e0b",
              fillColor: displayData.hasRealData
                ? "rgba(37,99,235,0.2)"
                : "rgba(245,158,11,0.2)",
              weight: displayData.hasRealData ? 3 : 2,
              opacity: 0.8,
              fillOpacity: 0.3,
            }}
          />
        ))}

        {/* MARKER TRUNG TÂM */}
        <Marker position={displayData.center}>
          <Popup>
            <div style={{ textAlign: "center", fontSize: 12 }}>
              <strong style={{ color: "#2563eb" }}>Trung tâm thửa đất</strong>
              <br />
              {displayData.center[0].toFixed(6)},{" "}
              {displayData.center[1].toFixed(6)}
              <br />
              <small style={{ color: "#666" }}>
                {displayData.hasRealData ? "Từ dữ liệu thực tế" : "Ước tính"}
              </small>
            </div>
          </Popup>
        </Marker>

        {/* ZOOM VÀO THỬA ĐẤT */}
        {displayData.hasRealData && (
          <MapController bounds={displayData.bounds} />
        )}
      </MapContainer>

      {/* BẢNG THÔNG TIN */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          minWidth: 260,
          zIndex: 500,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: "1px solid #eee",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: displayData.hasRealData ? "#10b981" : "#f59e0b",
              marginRight: 8,
            }}
          ></div>
          <strong>
            {displayData.hasRealData ? "Hình dạng thực" : "Ước tính"}
          </strong>
        </div>
        {["so_to", "so_thua", "dien_tich"].map((key) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 13,
            }}
          >
            <span style={{ color: "#64748b" }}>
              {key === "so_to"
                ? "Số tờ"
                : key === "so_thua"
                ? "Số thửa"
                : "Diện tích"}
            </span>
            <strong>
              {plotInfo[key]
                ? key === "dien_tich"
                  ? `${plotInfo[key]} m²`
                  : plotInfo[key]
                : "N/A"}
            </strong>
          </div>
        ))}
        <div
          style={{
            marginTop: 12,
            padding: 8,
            borderRadius: 8,
            textAlign: "center",
            fontSize: 11,
            background: displayData.hasRealData ? "#f0f9ff" : "#fffbeb",
            border: `1px solid ${
              displayData.hasRealData ? "#bae6fd" : "#fed7aa"
            }`,
            color: displayData.hasRealData ? "#0369a1" : "#92400e",
          }}
        >
          {displayData.hasRealData
            ? "Dữ liệu hình học chính xác"
            : "Chưa có dữ liệu hình học"}
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LandPlotMap;
