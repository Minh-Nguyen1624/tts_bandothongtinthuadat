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

// Sửa lỗi cho biểu tượng marker trong React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component để điều chỉnh bản đồ vào giới hạn của polygon
const MapController = ({ bounds }) => {
  const map = useMap();

  React.useEffect(() => {
    if (bounds && Array.isArray(bounds) && bounds.length > 0) {
      try {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, {
          padding: [20, 20],
          maxZoom: 18,
        });
      } catch (error) {
        console.error("Lỗi điều chỉnh giới hạn:", error);
      }
    }
  }, [map, bounds]);

  return null;
};

// Hàm đọc số nguyên 32-bit từ hex với thứ tự byte
const readInt32 = (hex, offset, isLittleEndian = true) => {
  const hexPart = hex.substring(offset, offset + 8);
  if (isLittleEndian) {
    let reversed = "";
    for (let i = 0; i < 8; i += 2) {
      reversed = hex.substring(offset + i, offset + i + 2) + reversed;
    }
    return parseInt(reversed, 16);
  }
  return parseInt(hexPart, 16);
};

// Hàm chuyển hex sang double với độ chính xác cao
const hexToDouble = (hex, isLittleEndian = true) => {
  try {
    if (hex.length !== 16) return NaN;

    let bytes = hex;
    if (isLittleEndian) {
      let reversed = "";
      for (let i = 0; i < 16; i += 2) {
        reversed = hex.substring(i, i + 2) + reversed;
      }
      bytes = reversed;
    }

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    for (let i = 0; i < 8; i++) {
      const byteValue = parseInt(bytes.substring(i * 2, i * 2 + 2), 16);
      view.setUint8(i, byteValue);
    }

    const result = view.getFloat64(0, false);
    return isNaN(result) || !isFinite(result)
      ? NaN
      : Number(result.toPrecision(17));
  } catch (error) {
    console.error("Lỗi chuyển hex sang double:", error);
    return NaN;
  }
};

// Hàm parse EWKB chính
const parseEwkbSimple = (ewkbHex) => {
  try {
    const cleanHex = ewkbHex.replace(/\s/g, "");

    if (cleanHex.length < 40) {
      console.error("EWKB quá ngắn");
      return null;
    }

    let offset = 0;
    const byteOrder = parseInt(cleanHex.substring(offset, offset + 2), 16);
    offset += 2;
    const isLittleEndian = byteOrder === 1;

    const geomType = readInt32(cleanHex, offset, isLittleEndian);
    offset += 8;

    const hasSrid = (geomType & 0x20000000) !== 0;
    const baseGeomType = geomType & 0x1fffffff;

    console.log(`📊 EWKB Type: ${baseGeomType}, SRID: ${hasSrid}`);

    if (hasSrid) {
      offset += 8; // Bỏ qua SRID
    }

    const allPolygons = [];

    // Parse POLYGON
    if (baseGeomType === 3) {
      const numRings = readInt32(cleanHex, offset, isLittleEndian);
      offset += 8;

      if (numRings > 0) {
        const numPoints = readInt32(cleanHex, offset, isLittleEndian);
        offset += 8;

        console.log(`📊 Polygon - Rings: ${numRings}, Points: ${numPoints}`);

        const polygonCoordinates = [];

        for (let i = 0; i < numPoints; i++) {
          if (offset + 32 > cleanHex.length) {
            console.warn("⚠️ Không đủ dữ liệu cho điểm");
            break;
          }

          // Đọc X (kinh độ) trước, Y (vĩ độ) sau
          const lngHex = cleanHex.substring(offset, offset + 16);
          offset += 16;
          const latHex = cleanHex.substring(offset, offset + 16);
          offset += 16;

          const x = hexToDouble(lngHex, isLittleEndian); // kinh độ
          const y = hexToDouble(latHex, isLittleEndian); // vĩ độ

          const formattedLat = parseFloat(y);
          const formattedLng = parseFloat(x);

          console.log(
            `📌 Điểm ${i}: formatted(lat=${formattedLat}, lng=${formattedLng})`
          );

          if (
            !isNaN(formattedLat) &&
            !isNaN(formattedLng) &&
            Math.abs(formattedLat) <= 90 &&
            Math.abs(formattedLng) <= 180
          ) {
            // polygonCoordinates.push([formattedLat, formattedLng]);
            polygonCoordinates.push([formattedLng, formattedLat]);
          } else {
            console.warn(
              `⚠️ Tọa độ không hợp lệ: lat=${formattedLat}, lng=${formattedLng}`
            );
          }
        }

        if (polygonCoordinates.length >= 3) {
          allPolygons.push(polygonCoordinates);
          console.log(
            `✅ Đã thêm polygon với ${polygonCoordinates.length} điểm`
          );
        }
      }
    }
    // Parse MULTIPOLYGON
    else if (baseGeomType === 6) {
      const numPolygons = readInt32(cleanHex, offset, isLittleEndian);
      offset += 8;

      console.log(`📊 MultiPolygon count: ${numPolygons}`);

      for (let polyIndex = 0; polyIndex < numPolygons; polyIndex++) {
        if (offset + 10 > cleanHex.length) break;

        // Bỏ qua header của sub-geometry
        offset += 2; // thứ tự byte
        const subType = readInt32(cleanHex, offset, isLittleEndian);
        offset += 8;

        const numRings = readInt32(cleanHex, offset, isLittleEndian);
        offset += 8;

        if (numRings > 0) {
          const numPoints = readInt32(cleanHex, offset, isLittleEndian);
          offset += 8;

          const polygonCoordinates = [];

          for (let i = 0; i < numPoints; i++) {
            if (offset + 32 > cleanHex.length) break;

            const lngHex = cleanHex.substring(offset, offset + 16);
            offset += 16;
            const latHex = cleanHex.substring(offset, offset + 16);
            offset += 16;

            const lng = hexToDouble(lngHex, isLittleEndian);
            const lat = hexToDouble(latHex, isLittleEndian);

            const formattedLat = Number(lat);
            const formattedLng = Number(lng);

            if (
              !isNaN(formattedLat) &&
              !isNaN(formattedLng) &&
              Math.abs(formattedLat) <= 90 &&
              Math.abs(formattedLng) <= 180
            ) {
              polygonCoordinates.push([formattedLat, formattedLng]);
            }
          }

          if (polygonCoordinates.length >= 3) {
            allPolygons.push(polygonCoordinates);
          }
        }
      }
    }

    console.log(`✅ Tổng số polygon đã parse: ${allPolygons.length}`);
    return allPolygons.length > 0 ? allPolygons : null;
  } catch (error) {
    console.error("❌ Lỗi parse EWKB:", error);
    return null;
  }
};

// Hàm kiểm tra GeoJSON hợp lệ
const isValidGeoJSON = (geojson) => {
  if (!geojson || typeof geojson !== "object") return false;
  if (!geojson.type) return false;

  if (geojson.type === "Polygon") {
    if (!Array.isArray(geojson.coordinates)) return false;
    if (geojson.coordinates.length === 0) return false;

    const exteriorRing = geojson.coordinates[0];
    if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) return false;

    const first = exteriorRing[0];
    const last = exteriorRing[exteriorRing.length - 1];
    return first[0] === last[0] && first[1] === last[1];
  }

  return false;
};

// Hàm parse geometry chính
// const parseGeometry = (geomData) => {
//   if (!geomData) {
//     console.log("❌ Không có dữ liệu geometry");
//     return null;
//   }

//   console.log("🔍 Đang phân tích dữ liệu geometry:", typeof geomData, geomData);

//   try {
//     // Nếu là GeoJSON object (như dữ liệu bạn cung cấp)
//     if (typeof geomData === "object" && geomData !== null) {
//       if (isValidGeoJSON(geomData)) {
//         const allPoints = geomData.coordinates[0]; // Lấy ring đầu tiên
//         let sumLat = 0,
//           sumLng = 0;
//         let validPoints = 0;

//         allPoints.forEach(([lng, lat]) => {
//           if (!isNaN(lat) && !isNaN(lng)) {
//             sumLat += lat;
//             sumLng += lng;
//             validPoints++;
//           }
//         });

//         if (validPoints === 0) {
//           console.log("❌ Không có điểm hợp lệ");
//           return null;
//         }

//         const center = [sumLat / validPoints, sumLng / validPoints];

//         console.log("✅ Parse GeoJSON object thành công", {
//           center,
//           pointsCount: validPoints,
//           bounds: allPoints.length,
//         });

//         return {
//           coordinates: [geomData.coordinates],
//           bounds: allPoints,
//           center: center,
//         };
//       }
//     }
//     // Nếu là GeoJSON string
//     else if (typeof geomData === "string" && geomData.trim().startsWith("{")) {
//       const parsed = JSON.parse(geomData);
//       if (isValidGeoJSON(parsed)) {
//         const allPoints = parsed.coordinates[0];
//         let sumLat = 0,
//           sumLng = 0;
//         let validPoints = 0;

//         allPoints.forEach(([lng, lat]) => {
//           if (!isNaN(lat) && !isNaN(lng)) {
//             sumLat += lat;
//             sumLng += lng;
//             validPoints++;
//           }
//         });

//         if (validPoints === 0) return null;

//         const center = [sumLat / validPoints, sumLng / validPoints];

//         console.log("✅ Parse GeoJSON string thành công", {
//           center,
//           pointsCount: validPoints,
//         });

//         return {
//           coordinates: [parsed.coordinates],
//           bounds: allPoints,
//           center: center,
//         };
//       }
//     }
//     // Nếu là WKB hex string
//     else if (typeof geomData === "string" && geomData.startsWith("01")) {
//       console.log("🔍 Phát hiện WKB geometry, đang phân tích...");
//       const polygons = parseEwkbSimple(geomData);
//       if (polygons && polygons.length > 0) {
//         const allPoints = polygons.flat();
//         let sumLat = 0,
//           sumLng = 0;
//         let validPoints = 0;

//         allPoints.forEach(([lat, lng]) => {
//           if (!isNaN(lat) && !isNaN(lng)) {
//             sumLat += lat;
//             sumLng += lng;
//             validPoints++;
//           }
//         });

//         if (validPoints === 0) return null;

//         const center = [sumLat / validPoints, sumLng / validPoints];

//         console.log("✅ Parse WKB geometry thành công", {
//           center,
//           pointsCount: validPoints,
//         });

//         return {
//           coordinates: polygons,
//           bounds: allPoints,
//           center: center,
//         };
//       }
//     }

//     console.log("❌ Không thể parse geometry - không đúng định dạng");
//     return null;
//   } catch (error) {
//     console.error("❌ Lỗi xử lý geometry:", error);
//     return null;
//   }
// };
const parseGeometry = (geomData) => {
  if (!geomData) {
    console.log("❌ Không có dữ liệu geometry");
    return null;
  }

  console.log(
    "🔍 Đang phân tích geom:",
    typeof geomData,
    geomData.substring(0, 50) + (geomData.length > 50 ? "..." : "")
  );

  try {
    // GeoJSON object
    if (typeof geomData === "object" && geomData !== null) {
      if (isValidGeoJSON(geomData)) {
        const allPoints = geomData.coordinates[0];
        let sumLng = 0,
          sumLat = 0;
        let validPoints = 0;

        allPoints.forEach(([lng, lat]) => {
          if (
            !isNaN(lat) &&
            !isNaN(lng) &&
            Math.abs(lat) <= 90 &&
            Math.abs(lng) <= 180
          ) {
            sumLng += lng;
            sumLat += lat;
            validPoints++;
          }
        });

        if (validPoints === 0) {
          console.log("❌ Không có điểm hợp lệ trong GeoJSON object");
          return null;
        }

        const center = [sumLat / validPoints, sumLng / validPoints]; // [lat, lng] cho react-leaflet
        return {
          coordinates: [allPoints.map(([lng, lat]) => [lat, lng])], // Chuyển [lng, lat] thành [lat, lng]
          bounds: allPoints.map(([lng, lat]) => [lat, lng]), // Chuyển [lng, lat] thành [lat, lng]
          center: center,
        };
      } else {
        console.warn("⚠️ GeoJSON object không hợp lệ, thử sửa điểm đóng vòng");
        const allPoints = geomData.coordinates[0];
        if (
          allPoints.length >= 3 &&
          (allPoints[0][0] !== allPoints[allPoints.length - 1][0] ||
            allPoints[0][1] !== allPoints[allPoints.length - 1][1])
        ) {
          allPoints.push([...allPoints[0]]); // Đóng vòng
          return parseGeometry({ ...geomData, coordinates: [allPoints] });
        }
      }
    }
    // GeoJSON string
    else if (typeof geomData === "string" && geomData.trim().startsWith("{")) {
      const parsed = JSON.parse(geomData);
      if (isValidGeoJSON(parsed)) {
        const allPoints = parsed.coordinates[0];
        let sumLng = 0,
          sumLat = 0;
        let validPoints = 0;

        allPoints.forEach(([lng, lat]) => {
          if (!isNaN(lat) && !isNaN(lng)) {
            sumLng += lng;
            sumLat += lat;
            validPoints++;
          }
        });

        if (validPoints === 0) return null;

        const center = [sumLat / validPoints, sumLng / validPoints];
        return {
          coordinates: [allPoints.map(([lng, lat]) => [lat, lng])],
          bounds: allPoints.map(([lng, lat]) => [lat, lng]),
          center: center,
        };
      }
    }
    // WKB hex string
    else if (typeof geomData === "string" && geomData.startsWith("01")) {
      console.log("🔍 Phát hiện WKB, đang phân tích...");
      const polygons = parseEwkbSimple(geomData);
      if (polygons && polygons.length > 0) {
        const allPoints = polygons.flat();
        let sumLng = 0,
          sumLat = 0;
        let validPoints = 0;

        allPoints.forEach(([lat, lng]) => {
          if (
            !isNaN(lat) &&
            !isNaN(lng) &&
            Math.abs(lat) <= 90 &&
            Math.abs(lng) <= 180
          ) {
            sumLng += lng; // Giữ nguyên lng
            sumLat += lat; // Giữ nguyên lat
            validPoints++;
          }
        });

        if (validPoints === 0) return null;

        const center = [sumLat / validPoints, sumLng / validPoints];
        return {
          coordinates: [allPoints.map(([lat, lng]) => [lat, lng])], // Giữ [lat, lng] từ WKB
          bounds: allPoints.map(([lat, lng]) => [lat, lng]),
          center: center,
        };
      }
    }

    console.log("❌ Không thể parse geometry - không đúng định dạng");
    return null;
  } catch (error) {
    console.error("❌ Lỗi xử lý geometry:", error);
    return null;
  }
};
const LandPlotMap = ({ geom, plotInfo = {} }) => {
  const [geometryData, setGeometryData] = React.useState(null);
  const [mapCenter, setMapCenter] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Hàm lấy trung tâm mặc định AN TOÀN
  const getDefaultCenter = React.useCallback(() => {
    console.log("🛡️ Đang lấy trung tâm mặc định...");
    return [10.8231, 106.6297]; // TP.HCM
  }, []);

  // Hàm tạo tọa độ fallback AN TOÀN
  const getFallbackCoordinates = React.useCallback(() => {
    const center = getDefaultCenter();
    const [lat, lng] = center;
    const offset = 0.001;

    return [
      [lat - offset, lng - offset],
      [lat - offset, lng + offset],
      [lat + offset, lng + offset],
      [lat + offset, lng - offset],
      [lat - offset, lng - offset],
    ];
  }, [getDefaultCenter]);

  // React.useEffect(() => {
  //   console.log("🔄 LandPlotMap useEffect triggered", {
  //     geom: geom
  //       ? `Type: ${typeof geom}, length: ${
  //           typeof geom === "string" ? geom.length : "object"
  //         }`
  //       : "null",
  //     plotInfo,
  //   });

  //   const processGeometry = () => {
  //     setLoading(true);
  //     setError(null);

  //     try {
  //       let center = null;
  //       let parsedData = null;

  //       // Ưu tiên parse geometry trước
  //       if (geom) {
  //         console.log("🔍 Đang phân tích dữ liệu geometry từ geom");
  //         parsedData = parseGeometry(geom);
  //         if (parsedData) {
  //           setGeometryData(parsedData);
  //           center = parsedData.center;
  //           console.log("✅ Đã parse trung tâm từ geom:", center);
  //         } else {
  //           console.log("⚠️ Parse geom thất bại hoặc không có geometry hợp lệ");
  //         }
  //       }

  //       // Nếu không có geometry hoặc parse thất bại, sử dụng trung tâm mặc định
  //       if (!center) {
  //         console.log("🛡️ Sử dụng trung tâm mặc định");
  //         center = getDefaultCenter();
  //       }

  //       // LUÔN ĐẢM BẢO CÓ CENTER
  //       setMapCenter(center);
  //     } catch (err) {
  //       console.error("❌ Lỗi xử lý geometry:", err);
  //       setError("Lỗi xử lý dữ liệu bản đồ");
  //       // LUÔN CÓ FALLBACK AN TOÀN
  //       setMapCenter(getDefaultCenter());
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   processGeometry();
  // }, [geom, plotInfo, getDefaultCenter]);

  // Xác định dữ liệu để hiển thị - ĐẢM BẢO LUÔN CÓ DỮ LIỆU HỢP LỆ
  React.useEffect(() => {
    console.log("🔄 LandPlotMap useEffect triggered", {
      geom: geom
        ? `Type: ${typeof geom}, Value: ${JSON.stringify(geom).substring(
            0,
            50
          )}${geom.length > 50 ? "..." : ""}`
        : "null",
    });

    const processGeometry = () => {
      setLoading(true);
      setError(null);

      try {
        let center = null;
        let parsedData = null;

        if (geom) {
          console.log("🔍 Geom trước khi parse:", geom);
          parsedData = parseGeometry(geom);
          if (parsedData) {
            setGeometryData(parsedData);
            center = parsedData.center;
            console.log("✅ Parsed center:", center);
            console.log("✅ Parsed coordinates:", parsedData.coordinates);
          } else {
            console.warn("⚠️ Không parse được geom, dùng fallback");
          }
        }

        if (!center) {
          center = getDefaultCenter();
          console.log("🛡️ Sử dụng trung tâm mặc định:", center);
        }

        setMapCenter(center);
      } catch (err) {
        console.error("❌ Lỗi xử lý geometry:", err);
        setError("Lỗi xử lý dữ liệu bản đồ");
        setMapCenter(getDefaultCenter());
      } finally {
        setLoading(false);
      }
    };

    processGeometry();
  }, [geom, getDefaultCenter]);
  // const displayData = React.useMemo(() => {
  //   const hasRealData = !!geometryData && !!geom;

  //   // ĐẢM BẢO coordinates luôn có giá trị hợp lệ
  //   const coordinates =
  //     hasRealData &&
  //     geometryData.coordinates &&
  //     Array.isArray(geometryData.coordinates) &&
  //     geometryData.coordinates.length > 0
  //       ? geometryData.coordinates
  //       : [getFallbackCoordinates()];

  //   // ĐẢM BẢO bounds luôn có giá trị hợp lệ
  //   const bounds =
  //     hasRealData &&
  //     geometryData.bounds &&
  //     Array.isArray(geometryData.bounds) &&
  //     geometryData.bounds.length > 0
  //       ? geometryData.bounds
  //       : getFallbackCoordinates();

  //   // ĐẢM BẢO center luôn có giá trị hợp lệ
  //   const center =
  //     mapCenter && Array.isArray(mapCenter) && mapCenter.length === 2
  //       ? mapCenter
  //       : getDefaultCenter();

  //   return {
  //     coordinates,
  //     bounds,
  //     center,
  //     hasRealData,
  //   };
  // }, [geometryData, geom, mapCenter, getFallbackCoordinates, getDefaultCenter]);

  const displayData = React.useMemo(() => {
    const hasRealData = !!geometryData && !!geom;

    const coordinates =
      hasRealData &&
      geometryData.coordinates &&
      Array.isArray(geometryData.coordinates) &&
      geometryData.coordinates.length > 0
        ? geometryData.coordinates // Đã là [lng, lat]
        : [getFallbackCoordinates()];

    const bounds =
      hasRealData &&
      geometryData.bounds &&
      Array.isArray(geometryData.bounds) &&
      geometryData.bounds.length > 0
        ? geometryData.bounds // Đã là [lng, lat]
        : getFallbackCoordinates();

    const center =
      mapCenter && Array.isArray(mapCenter) && mapCenter.length === 2
        ? mapCenter // [lat, lng] cho react-leaflet
        : getDefaultCenter();

    return {
      coordinates,
      bounds,
      center,
      hasRealData,
    };
  }, [geometryData, geom, mapCenter, getFallbackCoordinates, getDefaultCenter]);

  console.log("🎯 Dữ liệu bản đồ cuối cùng:", {
    center: displayData.center,
    hasRealData: displayData.hasRealData,
    coordinatesLength: displayData.coordinates.length,
    boundsLength: displayData.bounds.length,
  });

  // Nếu đang tải, hiển thị trạng thái tải
  if (loading) {
    return (
      <div
        style={{
          height: "500px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "1px solid #e1e5e9",
        }}
      >
        <div style={{ textAlign: "center", color: "#6c757d" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3388ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <div style={{ fontSize: "16px", fontWeight: "600" }}>
            Đang tải bản đồ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="land-plot-map-container"
      style={{
        height: "500px",
        width: "100%",
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        border: "1px solid #e1e5e9",
      }}
    >
      <MapContainer
        center={displayData.center}
        zoom={displayData.hasRealData ? 16 : 14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
        dragging={true}
        key={`map-${displayData.center[0]}-${displayData.center[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hiển thị polygon */}
        {/* {displayData.coordinates.map((polygonCoords, index) => (
          <Polygon
            key={index}
            positions={polygonCoords}
            pathOptions={{
              color: displayData.hasRealData ? "#2563eb" : "#f59e0b",
              fillColor: displayData.hasRealData
                ? "rgba(37, 99, 235, 0.2)"
                : "rgba(245, 158, 11, 0.2)",
              fillOpacity: 0.3,
              weight: displayData.hasRealData ? 3 : 2,
              opacity: 0.8,
            }}
          />
        ))} */}
        {displayData.coordinates.map((polygonCoords, index) => (
          <Polygon
            key={index}
            positions={polygonCoords.map((coord) => [coord[0], coord[1]])} // Đảm bảo [lat, lng]
            pathOptions={{
              color: displayData.hasRealData ? "#2563eb" : "#f59e0b",
              fillColor: displayData.hasRealData
                ? "rgba(37, 99, 235, 0.2)"
                : "rgba(245, 158, 11, 0.2)",
              fillOpacity: 0.3,
              weight: displayData.hasRealData ? 3 : 2,
              opacity: 0.8,
            }}
          />
        ))}

        {/* Marker tại trung tâm */}
        <Marker position={displayData.center}>
          <Popup>
            <div style={{ padding: "8px", textAlign: "center" }}>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#2563eb",
                  marginBottom: "4px",
                }}
              >
                Vị trí trung tâm
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {displayData.center[0].toFixed(6)},{" "}
                {displayData.center[1].toFixed(6)}
              </div>
              <div
                style={{ fontSize: "10px", color: "#999", marginTop: "4px" }}
              >
                {displayData.hasRealData
                  ? "(Từ hình dạng thực tế)"
                  : "(Vị trí ước tính)"}
              </div>
            </div>
          </Popup>
        </Marker>

        {displayData.bounds && displayData.bounds.length > 0 && (
          <MapController bounds={displayData.bounds} />
        )}
      </MapContainer>

      {/* Bảng thông tin */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          minWidth: "280px",
          zIndex: 500,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: displayData.hasRealData ? "#10b981" : "#f59e0b",
              marginRight: "10px",
            }}
          ></div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            {displayData.hasRealData ? "Hình dạng thực tế" : "Vị trí ước tính"}
          </h3>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}
            >
              Số tờ:
            </span>
            <span
              style={{ fontSize: "13px", color: "#1e293b", fontWeight: "600" }}
            >
              {plotInfo.so_to || "N/A"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}
            >
              Số thửa:
            </span>
            <span
              style={{ fontSize: "13px", color: "#1e293b", fontWeight: "600" }}
            >
              {plotInfo.so_thua || "N/A"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}
            >
              Diện tích:
            </span>
            <span
              style={{ fontSize: "13px", color: "#1e293b", fontWeight: "600" }}
            >
              {plotInfo.dien_tich ? `${plotInfo.dien_tich} m²` : "N/A"}
            </span>
          </div>
        </div>

        <div
          style={{
            background: displayData.hasRealData ? "#f0f9ff" : "#fffbeb",
            border: `1px solid ${
              displayData.hasRealData ? "#bae6fd" : "#fed7aa"
            }`,
            borderRadius: "8px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: displayData.hasRealData ? "#0369a1" : "#92400e",
              fontWeight: "500",
            }}
          >
            {displayData.hasRealData
              ? "✓ Dữ liệu hình học có sẵn"
              : "ℹ️ Sử dụng vị trí ước tính"}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LandPlotMap;
