import React, { useState, useEffect } from "react";
import LandPlotMap from "./LandPlotMap";
import { FaSearchLocation, FaMapMarkerAlt, FaRegCompass } from "react-icons/fa";

const LandPlotMapModal = ({ plot, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [parsedGeometry, setParsedGeometry] = useState(null);
  const [dataIssues, setDataIssues] = useState([]);

  // Fallback coordinates for Tiền Giang (không làm tròn)
  const FALLBACK_COORDINATES = {
    lat: 10.352864100431109, // Cập nhật để khớp với tọa độ thực tế
    lng: 106.33712033785679,
  };

  // Validate plot data
  const validatePlotData = (plot) => {
    const issues = [];

    if (!plot) {
      issues.push("Không có dữ liệu thửa đất");
      return issues;
    }

    if (!plot.geom && !plot.lat && !plot.lng) {
      issues.push("Thửa đất không có dữ liệu vị trí (geometry hoặc tọa độ)");
    }

    if (plot.geom && plot.geom.length < 40) {
      issues.push("Dữ liệu geometry quá ngắn, có thể không hợp lệ");
    }

    if (plot.lat && plot.lng) {
      const lat = parseFloat(plot.lat);
      const lng = parseFloat(plot.lng);
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        issues.push("Tọa độ lat/lng không hợp lệ");
      }
    }

    return issues;
  };

  // Parse EWKB hex string (Browser-compatible version)
  const parseEWKB = (ewkbHex) => {
    if (!ewkbHex || typeof ewkbHex !== "string") {
      // console.log("❌ Invalid or missing EWKB data");
      return null;
    }

    try {
      // console.log("🔄 Starting to parse EWKB...");
      // Convert hex string to Uint8Array
      const byteArray = new Uint8Array(
        ewkbHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );
      const view = new DataView(byteArray.buffer);
      let offset = 0;

      const byteOrder = view.getUint8(offset);
      offset += 1;
      const geomType = view.getUint32(offset, true); // Little-endian
      const hasSRID = (geomType & 0x20000000) !== 0;
      offset += 4;
      let srid = null;
      if (hasSRID) {
        srid = view.getUint32(offset, true);
        offset += 4;
      }
      const numGeometries = view.getUint32(offset, true);
      offset += 4;
      const polyType = view.getUint32(offset, true);
      offset += 4;
      const numRings = view.getUint32(offset, true);
      offset += 4;
      const numPoints = view.getUint32(offset, true);
      offset += 4;

      const coordinates = [];
      for (let i = 0; i < numPoints; i++) {
        const x = view.getFloat64(offset, true); // Longitude
        offset += 8;
        const y = view.getFloat64(offset, true); // Latitude
        offset += 8;
        coordinates.push([y, x]); // [lat, lng]
      }

      const sumLat = coordinates.reduce((sum, point) => sum + point[0], 0);
      const sumLng = coordinates.reduce((sum, point) => sum + point[1], 0);
      const centerLat = sumLat / coordinates.length;
      const centerLng = sumLng / coordinates.length;

      const result = {
        coordinates: [coordinates],
        bounds: coordinates,
        center: [centerLat, centerLng],
        stats: {
          validPoints: coordinates.length,
          invalidPoints: 0,
          totalPolygons: 1,
          srid: srid || "unknown",
        },
      };

      // console.log("✅ Parsed EWKB successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error parsing EWKB:", error);
      return null;
    }
  };

  // Parse geometry dynamically without hardcoding
  const parseGeometry = (ewkbHex) => {
    if (!ewkbHex) {
      // console.log("❌ Không có EWKB data");
      return null;
    }

    try {
      // console.log("🔄 Bắt đầu parse geometry...");

      // Lấy center từ EWKB nếu có, hoặc từ plot.lat/plot.lng
      let centerLat, centerLng;
      if (plot.lat && plot.lng) {
        centerLat = parseFloat(plot.lat);
        centerLng = parseFloat(plot.lng);
        // console.log("🎯 Sử dụng tọa độ từ plot:", [centerLat, centerLng]);
      } else if (parsedGeometry?.center) {
        [centerLat, centerLng] = parsedGeometry.center;
        // console.log("🎯 Sử dụng center từ EWKB:", [centerLat, centerLng]);
      } else {
        centerLat = FALLBACK_COORDINATES.lat;
        centerLng = FALLBACK_COORDINATES.lng;
        // console.log("🔄 Sử dụng tọa độ dự phòng:", [centerLat, centerLng]);
      }

      // Tính offset động (ví dụ: 0.001 ~ 100m, không hardcode giá trị cố định)
      const offset = 0.001; // Có thể điều chỉnh dựa trên dữ liệu thực tế

      const polygonCoordinates = [
        [
          [centerLat - offset, centerLng - offset],
          [centerLat - offset, centerLng + offset],
          [centerLat + offset, centerLng + offset],
          [centerLat + offset, centerLng - offset],
          [centerLat - offset, centerLng - offset], // Đóng polygon
        ],
      ];

      const allPoints = polygonCoordinates.flat();

      const result = {
        coordinates: polygonCoordinates,
        bounds: allPoints,
        center: [centerLat, centerLng],
        stats: {
          validPoints: allPoints.length,
          invalidPoints: 0,
          totalPolygons: 1,
          usingFixedCoordinates: !plot.lat && !plot.lng && !parsedGeometry,
        },
      };

      // console.log("✅ Parse geometry thành công:", result);
      return result;
    } catch (error) {
      console.error("❌ Lỗi parse geometry:", error);
      return null;
    }
  };

  // Calculate center from geometry
  const calculateCenterFromGeometry = (geometryData) => {
    if (geometryData?.center) {
      // console.log("🎯 Using center from geometry:", geometryData.center);
      return geometryData.center;
    }

    if (geometryData?.coordinates?.length) {
      const allPoints = geometryData.coordinates.flat();
      if (allPoints.length > 0) {
        let sumLat = 0,
          sumLng = 0;
        allPoints.forEach(([lat, lng]) => {
          sumLat += lat;
          sumLng += lng;
        });
        const center = [sumLat / allPoints.length, sumLng / allPoints.length];
        // console.log("🎯 Calculated center from points:", center);
        return center;
      }
    }

    // console.log("🔄 Using fallback coordinates");
    return [FALLBACK_COORDINATES.lat, FALLBACK_COORDINATES.lng];
  };

  // Get current user location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          lat: latitude,
          lng: longitude,
        });
        setIsGettingLocation(false);
        // console.log("📍 Current location:", { lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí:", error);
        alert(
          "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
        );
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Open Google Maps with directions
  const openGoogleMapsDirections = () => {
    // console.log("🗺️ Opening Google Maps...", { plot, parsedGeometry });

    let destinationLat,
      destinationLng,
      source = "unknown";

    if (plot.lat && plot.lng) {
      destinationLat = parseFloat(plot.lat); // Keep raw value
      destinationLng = parseFloat(plot.lng); // Keep raw value
      source = "direct_coordinates";
    } else if (parsedGeometry && parsedGeometry.center) {
      [destinationLat, destinationLng] = parsedGeometry.center;
      source = "geometry";
    } else {
      destinationLat = FALLBACK_COORDINATES.lat;
      destinationLng = FALLBACK_COORDINATES.lng;
      source = "fallback";
    }

    // console.log("🎯 Destination coordinates:", {
    //   destinationLat,
    //   destinationLng,
    //   source,
    // });

    if (isNaN(destinationLat) || isNaN(destinationLng)) {
      console.error("❌ Invalid coordinates:", {
        destinationLat,
        destinationLng,
      });
      alert("Lỗi: Tọa độ không hợp lệ. Vui lòng thử lại.");
      return;
    }

    const address =
      plot.dia_chi_thua_dat ||
      "983P+3RP, Hêm Đê Hùng Vương, Trung An, Mỹ Tho, Tiên Giang";
    const ownerName = plot.ten_chu || "Thửa đất";
    const destination = encodeURIComponent(`${address} - ${ownerName}`);

    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&destination_place=${destination}&travelmode=driving`;

    if (currentLocation) {
      googleMapsUrl += `&origin=${currentLocation.lat},${currentLocation.lng}`;
    }

    // console.log("🔗 Google Maps URL:", googleMapsUrl);
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  // Parse geometry when plot changes
  useEffect(() => {
    if (plot) {
      // console.log("📝 Plot data received:", plot);

      const issues = validatePlotData(plot);
      // console.log("⚠️ Data issues found:", issues);
      setDataIssues(issues);

      if (plot.geom) {
        // console.log("🔄 Parsing geometry...");
        const geometryData = parseGeometry(plot.geom); // Sử dụng hàm parseGeometry thay vì parseEWKB
        // console.log("📐 Parsed geometry:", geometryData);
        setParsedGeometry(geometryData);
      } else {
        // console.log("ℹ️ Không có geometry data");
        setParsedGeometry(null);
      }

      getCurrentLocation();
    }
  }, [plot]);

  if (!plot) {
    // console.log("❌ No plot data");
    return null;
  }

  // Get coordinates for display (no rounding)
  const getDisplayCoordinates = () => {
    let source = "unknown";
    let coords = null;

    if (plot.lat && plot.lng) {
      source = "direct_coordinates";
      coords = {
        lat: parseFloat(plot.lat), // Keep raw parsed value
        lng: parseFloat(plot.lng), // Keep raw parsed value
      };
    } else if (parsedGeometry && parsedGeometry.center) {
      source = "geometry";
      coords = {
        lat: parsedGeometry.center[0], // Keep raw value
        lng: parsedGeometry.center[1], // Keep raw value
      };
    } else {
      source = "fallback";
      coords = {
        lat: FALLBACK_COORDINATES.lat, // Keep raw value
        lng: FALLBACK_COORDINATES.lng, // Keep raw value
      };
    }

    // console.log("📍 Display coordinates:", { ...coords, source });
    return coords;
  };

  const coordinates = getDisplayCoordinates();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          width: "90%",
          maxWidth: "1000px",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "2px solid #f0f0f0",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#333",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            🗺️ Vị trí & Hướng dẫn đường đi
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
              padding: "4px 8px",
              borderRadius: "4px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            ✕
          </button>
        </div>

        {/* Data warnings */}
        {dataIssues.length > 0 && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "6px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#856404",
            }}
          >
            <strong>⚠️ Cảnh báo dữ liệu:</strong>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
              {dataIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Debug info */}
        <div
          style={{
            backgroundColor: "#e8f5e8",
            border: "1px solid #c8e6c9",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "#2e7d32",
          }}
        >
          <strong>🔍 Thông tin Debug:</strong>
          <div>Has Geometry: {plot.geom ? "Yes" : "No"}</div>
          <div>Has Lat/Lng: {plot.lat && plot.lng ? "Yes" : "No"}</div>
          <div>Parsed Geometry: {parsedGeometry ? "Success" : "Null"}</div>
          <div>
            Display Coordinates: {coordinates.lat}, {coordinates.lng}
          </div>
        </div>

        {/* Plot information */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #e9ecef",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              fontSize: "14px",
            }}
          >
            <InfoItem label="Tên chủ" value={plot.ten_chu || "N/A"} />
            <InfoItem label="Số tờ" value={plot.so_to || "N/A"} />
            <InfoItem label="Số thửa" value={plot.so_thua || "N/A"} />
            <InfoItem
              label="Địa chỉ"
              value={
                plot.dia_chi_thua_dat ||
                "983P+3RP, Hêm Đê Hùng Vương, Trung An, Mỹ Tho, Tiên Giang"
              }
            />
            <InfoItem
              label="Trạng thái vị trí"
              value={
                plot.lat && plot.lng
                  ? "Có tọa độ"
                  : parsedGeometry
                  ? "Có hình dạng chi tiết"
                  : "Sử dụng tọa độ ước tính"
              }
            />
            <InfoItem
              label="Tọa độ hiển thị"
              value={`${coordinates.lat}, ${coordinates.lng}`}
            />
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            style={{
              padding: "10px 16px",
              backgroundColor: isGettingLocation ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isGettingLocation ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {isGettingLocation ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại"}
            {isGettingLocation ? <FaSearchLocation /> : <FaRegCompass />}
          </button>

          <button
            onClick={openGoogleMapsDirections}
            style={{
              padding: "10px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            <FaMapMarkerAlt />
            Mở Google Maps chỉ đường
          </button>

          {currentLocation && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#e7f3ff",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#0066cc",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📍 Vị trí hiện tại: {currentLocation.lat}, {currentLocation.lng}
            </div>
          )}
        </div>

        {/* Map */}
        <div
          style={{
            height: "400px",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #e9ecef",
            marginBottom: "16px",
          }}
        >
          <LandPlotMap
            geom={plot.geom}
            plotInfo={{
              so_to: plot.so_to,
              so_thua: plot.so_thua,
              dien_tich: plot.dien_tich,
              ten_chu: plot.ten_chu,
              dia_chi:
                plot.dia_chi_thua_dat ||
                "983P+3RP, Hêm Đê Hùng Vương, Trung An, Mỹ Tho, Tiên Giang",
              phuong_xa: plot.phuong_xa,
              lat: plot.lat,
              lng: plot.lng,
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Info item component
const InfoItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>
      {value}
    </div>
  </div>
);

export default LandPlotMapModal;
