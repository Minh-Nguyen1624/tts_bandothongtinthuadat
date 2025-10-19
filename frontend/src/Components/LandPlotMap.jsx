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

// Fix cho marker icon trong React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component để fit map vào bounds của polygon
const MapController = ({ bounds }) => {
  const map = useMap();

  React.useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, {
          padding: [20, 20],
          maxZoom: 18,
        });
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  }, [map, bounds]);

  return null;
};

// Hàm đọc số nguyên 32-bit từ hex với byte order

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

    // Trả về số với độ chính xác cao (15-17 chữ số thập phân)
    if (isNaN(result) || !isFinite(result)) {
      return NaN;
    }

    // Sử dụng Number để đảm bảo độ chính xác
    return Number(result.toPrecision(17));
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
            console.warn("⚠️ Not enough data for point");
            break;
          }

          // Đọc X (longitude) trước, Y (latitude) sau
          const lngHex = cleanHex.substring(offset, offset + 16);
          offset += 16;
          const latHex = cleanHex.substring(offset, offset + 16);
          offset += 16;

          const x = hexToDouble(lngHex, isLittleEndian); // longitude
          const y = hexToDouble(latHex, isLittleEndian); // latitude

          // Format tọa độ để có đủ 15 chữ số thập phân
          // const formattedLat = parseFloat(y.toPrecision(15));
          // const formattedLng = parseFloat(x.toPrecision(15));
          const formattedLat = parseFloat(y);
          const formattedLng = parseFloat(x);

          console.log(`📌 Point ${i}: raw(lat=${lat}, lng=${lng})`);
          console.log(
            `📌 Point ${i}: formatted(lat=${formattedLat}, lng=${formattedLng})`
          );

          if (
            !isNaN(formattedLat) &&
            !isNaN(formattedLng) &&
            Math.abs(formattedLat) <= 90 &&
            Math.abs(formattedLng) <= 180
          ) {
            polygonCoordinates.push([formattedLat, formattedLng]);
          } else {
            console.warn(
              `⚠️ Invalid coordinates: lat=${formattedLat}, lng=${formattedLng}`
            );
          }
        }

        if (polygonCoordinates.length >= 3) {
          allPolygons.push(polygonCoordinates);
          console.log(
            `✅ Added polygon with ${polygonCoordinates.length} points`
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

        // Skip sub-geometry header
        offset += 2; // byte order
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

            // Format tọa độ với độ chính xác cao
            // const formattedLat = Number(lat.toPrecision(15));
            // const formattedLng = Number(lng.toPrecision(15));
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

    console.log(`✅ Total polygons parsed: ${allPolygons.length}`);
    return allPolygons.length > 0 ? allPolygons : null;
  } catch (error) {
    console.error("❌ Lỗi parse EWKB:", error);
    return null;
  }
};

// Hàm parse geometry chính với độ chính xác cao
export const parseGeometry = (geomString) => {
  if (!geomString) {
    console.log("❌ Không có dữ liệu geometry");
    return null;
  }

  try {
    if (typeof geomString === "string" && geomString.startsWith("01")) {
      const polygons = parseEwkbSimple(geomString);

      if (polygons && polygons.length > 0) {
        const allPoints = polygons.flat();

        // Tính center từ tất cả các điểm với độ chính xác cao
        let sumLat = 0,
          sumLng = 0;
        let validPoints = 0;

        allPoints.forEach(([lat, lng]) => {
          if (!isNaN(lat) && !isNaN(lng)) {
            sumLat += lat;
            sumLng += lng;
            validPoints++;
          }
        });

        if (validPoints === 0) {
          console.log("❌ Không có điểm hợp lệ");
          return null;
        }

        // const centerLat = parseFloat((sumLat / validPoints).toPrecision(15));
        // const centerLng = parseFloat((sumLng / validPoints).toPrecision(15));
        const centerLat = parseFloat(sumLat / validPoints);
        const centerLng = parseFloat(sumLng / validPoints);
        const center = [centerLat, centerLng];

        console.log("✅ Parse geometry thành công, center:", center);
        console.log(`📊 Center precision: lat=${centerLat}, lng=${centerLng}`);

        return {
          coordinates: polygons,
          bounds: allPoints,
          center: center,
          stats: {
            validPoints: validPoints,
            invalidPoints: allPoints.length - validPoints,
            totalPolygons: polygons.length,
          },
        };
      }
    }
    console.log("❌ Không thể parse geometry");
    return null;
  } catch (error) {
    console.error("❌ Lỗi xử lý geometry:", error);
    return null;
  }
};

// Hàm tính center từ geometry data
export const calculateCenterFromGeometry = (geometryData) => {
  conoole.log("🔍 Calculating center from geometry data...", geometryData);
  if (!geometryData?.coordinates?.length) {
    console.log("❌ Không có geometry data để tính center");
    return null;
  }

  try {
    const allPoints = geometryData.coordinates.flat();
    if (allPoints.length === 0) {
      console.log("❌ Không có points trong geometry");
      return null;
    }

    let sumLat = 0,
      sumLng = 0;
    allPoints.forEach(([lat, lng]) => {
      sumLat += lat;
      sumLng += lng;
    });

    const center = [sumLat / allPoints.length, sumLng / allPoints.length];
    console.log("✅ Calculated center from geometry:", center);
    return center;
  } catch (error) {
    console.error("❌ Lỗi tính center:", error);
    return null;
  }
};

// Hàm lấy center từ plot info (từ database)
const getCenterFromPlotInfo = (plotInfo) => {
  if (!plotInfo) {
    console.log("❌ Không có plot info");
    return null;
  }

  // Ưu tiên lấy từ geometry trước
  if (plotInfo.geom) {
    const geometryData = parseGeometry(plotInfo.geom);
    if (geometryData?.center) {
      console.log("✅ Sử dụng center từ geometry:", geometryData.center);
      return geometryData.center;
    }
  }

  // Sau đó lấy từ lat, lng trực tiếp
  if (plotInfo.lat && plotInfo.lng) {
    const lat = parseFloat(plotInfo.lat);
    const lng = parseFloat(plotInfo.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      console.log("✅ Sử dụng center từ lat/lng:", [lat, lng]);
      return [lat, lng];
    }
  }

  console.log("❌ Không thể lấy center từ plot info");
  return null;
};

const LandPlotMap = ({ geom, plotInfo = {} }) => {
  const [geometryData, setGeometryData] = React.useState(null);
  const [mapCenter, setMapCenter] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log(
      "🔄 Cập nhật geometry/map center khi geom hoặc plotInfo thay đổi",
      {
        geom,
        plotInfo,
      }
    );

    if (geom) {
      console.log("🔍 Parsing geometry data from geom prop...");
      const parsedData = parseGeometry(geom);
      if (parsedData?.center) {
        const [lat, lng] = parsedData.center;
        console.log("✅ Parsed center from geom:", [lat, lng]);
      }

      if (parsedData?.bounds) {
        console.log("✅ Parsed bounds from geom:", parsedData.bounds);
      }
    }

    const processGeometry = () => {
      if (!geom && !plotInfo.lat && !plotInfo.lng) {
        setGeometryData(null);
        setError("Không có dữ liệu vị trí (geometry hoặc tọa độ)");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let center = null;

        // Ưu tiên parse geometry trước
        if (geom) {
          const parsedData = parseGeometry(geom);
          if (parsedData) {
            setGeometryData(parsedData);
            center = parsedData.center;
            console.log("🎯 Center từ geometry:", center);
          }
        }

        // Nếu không có geometry hoặc parse thất bại, thử lấy từ lat/lng
        if (!center && plotInfo.lat && plotInfo.lng) {
          const lat = parseFloat(plotInfo.lat);
          const lng = parseFloat(plotInfo.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            center = [lat, lng];
            console.log("🎯 Center từ lat/lng:", center);
          }
        }

        if (center) {
          setMapCenter(center);
        } else {
          setError("Không thể xác định vị trí từ dữ liệu hiện có");
          console.error("❌ Không thể xác định center từ dữ liệu:", {
            geom,
            plotInfo,
          });
        }
      } catch (err) {
        setError("Lỗi xử lý dữ liệu bản đồ");
        console.error("❌ Lỗi xử lý geometry:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(processGeometry, 100);
    return () => clearTimeout(timer);
  }, [geom, plotInfo]);

  // Tạo fallback coordinates từ geometry data hoặc plot info
  const getFallbackCoordinates = () => {
    // Nếu có geometry data, sử dụng bounds của nó
    if (geometryData?.bounds?.length > 0) {
      return geometryData.bounds;
    }

    // Nếu có center, tạo một polygon nhỏ xung quanh center
    if (mapCenter) {
      const [lat, lng] = mapCenter;
      const offset = 0.001; // ~100m
      return [
        [lat - offset, lng - offset],
        [lat - offset, lng + offset],
        [lat + offset, lng + offset],
        [lat + offset, lng - offset],
        [lat - offset, lng - offset],
      ];
    }

    // Fallback cuối cùng - KHÔNG HARDCODE
    console.error("❌ Không có dữ liệu để tạo fallback coordinates");
    return [];
  };

  // Xác định center cho map
  const determineMapCenter = () => {
    if (mapCenter) {
      console.log("🎯 Sử dụng mapCenter từ state:", mapCenter);
      return mapCenter;
    }

    // Thử các nguồn khác nhau
    if (geometryData?.center) return geometryData.center;

    // if (plotInfo.lat && plotInfo.lng) {
    if (plotInfo.lng && plotInfo.lat) {
      const lat = parseFloat(plotInfo.lat);
      const lng = parseFloat(plotInfo.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    // KHÔNG HARDCODE - trả về null nếu không có dữ liệu
    console.error("❌ Không thể xác định map center");
    return null;
  };

  const displayCoordinates =
    geometryData?.coordinates?.length > 0
      ? geometryData.coordinates
      : [getFallbackCoordinates()];

  const displayBounds = geometryData?.bounds || getFallbackCoordinates();
  const hasRealData = !!geometryData && !!geom;
  const centerPoint = determineMapCenter();
  const finalMapCenter = determineMapCenter();

  // Nếu không có center hợp lệ, không render map
  if (!finalMapCenter) {
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
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
          <div style={{ fontSize: "16px", fontWeight: "600" }}>
            Không có dữ liệu vị trí
          </div>
          <div style={{ fontSize: "14px", marginTop: "8px" }}>
            Thửa đất này không có thông tin tọa độ hoặc hình dạng
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
      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3388ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "16px",
            }}
          ></div>
          <div
            style={{
              fontSize: "16px",
              color: "#2d3748",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Đang tải dữ liệu
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#718096",
            }}
          >
            Vui lòng chờ trong giây lát...
          </div>
        </div>
      )}

      <MapContainer
        center={finalMapCenter}
        zoom={hasRealData ? 17 : 15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" style="color: #666; text-decoration: none;">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hiển thị polygon */}
        {displayCoordinates.length > 0 &&
          displayCoordinates[0].length > 0 &&
          displayCoordinates.map((polygonCoords, index) => (
            <Polygon
              key={index}
              positions={polygonCoords}
              pathOptions={{
                color: hasRealData ? "#2563eb" : "#f59e0b",
                fillColor: hasRealData
                  ? "rgba(37, 99, 235, 0.2)"
                  : "rgba(245, 158, 11, 0.2)",
                fillOpacity: 0.3,
                weight: hasRealData ? 3 : 2,
                opacity: 0.8,
              }}
            />
          ))}

        {/* Marker tại trung tâm khi có dữ liệu */}
        {centerPoint && (
          <Marker position={centerPoint}>
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
                  {centerPoint[0]}, {centerPoint[1]}
                </div>
                <div
                  style={{ fontSize: "10px", color: "#999", marginTop: "4px" }}
                >
                  {hasRealData
                    ? "(Từ hình dạng thực tế)"
                    : "(Từ tọa độ database)"}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {displayBounds.length > 0 && <MapController bounds={displayBounds} />}
      </MapContainer>

      {/* Information Panel */}
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
              background: hasRealData ? "#10b981" : "#f59e0b",
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
            {hasRealData ? "Hình dạng thực tế" : "Vị trí từ tọa độ"}
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
          {centerPoint && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  fontWeight: "500",
                }}
              >
                Tọa độ:
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#1e293b",
                  fontWeight: "600",
                }}
              >
                {centerPoint[0]}, {centerPoint[1]}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            background: hasRealData ? "#f0f9ff" : "#fffbeb",
            border: `1px solid ${hasRealData ? "#bae6fd" : "#fed7aa"}`,
            borderRadius: "8px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: hasRealData ? "#0369a1" : "#92400e",
              fontWeight: "500",
            }}
          >
            {hasRealData
              ? "✓ Dữ liệu hình học có sẵn"
              : "ℹ️ Sử dụng tọa độ từ database"}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && !loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(254, 226, 226, 0.95)",
            backdropFilter: "blur(10px)",
            color: "#dc2626",
            padding: "20px 24px",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            textAlign: "center",
            zIndex: 1000,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            maxWidth: "320px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            ⚠️
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Thông báo
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#7f1d1d",
              lineHeight: "1.4",
            }}
          >
            {error}
          </div>
        </div>
      )}

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
