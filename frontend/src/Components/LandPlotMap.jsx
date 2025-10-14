// components/LandPlotMap.js
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

// Hàm chuyển hex sang double
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
    return isNaN(result) || !isFinite(result) ? NaN : result;
  } catch (error) {
    console.error("Lỗi chuyển hex sang double:", error);
    return NaN;
  }
};

// Hàm parse EWKB chính
const parseEwkbSimple = (ewkbHex) => {
  try {
    const cleanHex = ewkbHex.replace(/\s/g, "");

    if (cleanHex.length < 20) {
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

    if (hasSrid) {
      offset += 8; // Bỏ qua SRID
    }

    // Parse polygon coordinates đơn giản
    if (baseGeomType === 3 || baseGeomType === 6) {
      const numPolygons =
        baseGeomType === 6 ? readInt32(cleanHex, offset, isLittleEndian) : 1;
      offset += baseGeomType === 6 ? 8 : 0;

      const allPolygons = [];

      for (let polyIndex = 0; polyIndex < numPolygons; polyIndex++) {
        if (baseGeomType === 6) {
          offset += 10; // Bỏ qua byte order và type của polygon con
        }

        const numRings = readInt32(cleanHex, offset, isLittleEndian);
        offset += 8;

        if (numRings === 0) continue;

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

          if (!isNaN(lat) && !isNaN(lng)) {
            polygonCoordinates.push([lat, lng]);
          }
        }

        if (polygonCoordinates.length >= 3) {
          allPolygons.push(polygonCoordinates);
        }
      }

      return allPolygons.length > 0 ? allPolygons : null;
    }

    return null;
  } catch (error) {
    console.error("❌ Lỗi parse EWKB:", error);
    return null;
  }
};

// Hàm parse geometry chính
const parseGeometry = (geomString) => {
  if (!geomString) return null;

  try {
    if (typeof geomString === "string" && geomString.startsWith("01")) {
      const polygons = parseEwkbSimple(geomString);

      if (polygons && polygons.length > 0) {
        const allPoints = polygons.flat();
        return {
          coordinates: polygons,
          bounds: allPoints,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Lỗi xử lý geometry:", error);
    return null;
  }
};

// Hàm tính center
const calculateCenterFromGeometry = (geometryData) => {
  if (!geometryData?.coordinates?.length) {
    return [10.362, 106.36]; // Mỹ Tho
  }

  try {
    const allPoints = geometryData.coordinates.flat();
    if (allPoints.length === 0) return [10.362, 106.36];

    let sumLat = 0,
      sumLng = 0;
    allPoints.forEach(([lat, lng]) => {
      sumLat += lat;
      sumLng += lng;
    });

    return [sumLat / allPoints.length, sumLng / allPoints.length];
  } catch (error) {
    return [10.362, 106.36];
  }
};

const LandPlotMap = ({ geom, plotInfo = {} }) => {
  const [geometryData, setGeometryData] = React.useState(null);
  const [mapCenter, setMapCenter] = React.useState([10.362, 106.36]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const processGeometry = () => {
      if (!geom) {
        setGeometryData(null);
        setError("Không có dữ liệu hình học");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const parsedData = parseGeometry(geom);
        if (parsedData) {
          setGeometryData(parsedData);
          setMapCenter(calculateCenterFromGeometry(parsedData));
        } else {
          setError("Không thể đọc dữ liệu hình học");
        }
      } catch (err) {
        setError("Lỗi xử lý dữ liệu bản đồ");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(processGeometry, 100);
    return () => clearTimeout(timer);
  }, [geom]);

  // Fallback coordinates
  const getFallbackCoordinates = () => {
    return [
      [10.3615, 106.3595],
      [10.3615, 106.3605],
      [10.3625, 106.3605],
      [10.3625, 106.3595],
      [10.3615, 106.3595],
    ];
  };

  const displayCoordinates = geometryData?.coordinates || [
    getFallbackCoordinates(),
  ];
  const displayBounds = geometryData?.bounds || getFallbackCoordinates();
  const hasRealData = !!geometryData && !!geom;
  const centerPoint = geometryData
    ? calculateCenterFromGeometry(geometryData)
    : mapCenter;

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
        center={mapCenter}
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
        {displayCoordinates.map((polygonCoords, index) => (
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

        {/* Marker tại trung tâm khi có dữ liệu thực */}
        {hasRealData && (
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
                  {centerPoint[0].toFixed(6)}, {centerPoint[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        <MapController bounds={displayBounds} />
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
            {hasRealData ? "Hình dạng thực tế" : "Vị trí ước tính"}
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
              {plotInfo.so_to || "65"}
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
              {plotInfo.so_thua || "271"}
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
              {plotInfo.dien_tich ? `${plotInfo.dien_tich} m²` : "408.70 m²"}
            </span>
          </div>
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
              : "⚠ Đang tải dữ liệu..."}
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "8px",
          padding: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 500,
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            fontWeight: "500",
            padding: "4px 8px",
          }}
        >
          {hasRealData ? "Dữ liệu thực tế" : "Vị trí ước tính"}
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

      {/* <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style> */}
    </div>
  );
};

export default LandPlotMap;
