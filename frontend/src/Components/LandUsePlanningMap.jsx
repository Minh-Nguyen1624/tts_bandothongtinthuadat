import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useDebugValue,
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
import OverLapHandler from "../Components/OverlapHandler";
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
const LoadingOverlay = React.memo(
  ({ isLoading }) =>
    isLoading && (
      <div className="loading-overlay">
        <div className="loading-content">
          <FaSpinner className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
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
    </div>
  );
};

// 🎨 Màu theo mã loại đất
const getColorByLoaiDat = (loai) => {
  if (!loai) return "#adb5bd";

  const colors = {
    CAN: "#ff0000",
    ONT: "#ff6b6b",
    // ODT: "#ff8787",
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
        if (!token) {
          setError("Vui lòng đăng nhập để tiếp tục.");
          return;
        }

        setIsLoading(true);
        setError(null);
        setShouldUpdateView(false);
        setOverlapData(null);

        const response = await axios.get(`${API_URL}/api/land_plots`, {
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
    [token, lastSearchTime]
  );

  // ✅ CALLBACK ĐỂ NHẬN DỮ LIỆU TỪ OVERLAPHANDLER
  const handleOverlapData = useCallback((data) => {
    console.log("📊 Overlap data received:", data);

    // ✅ KIỂM TRA CẤU TRÚC DỮ LIỆU
    if (data.features && data.features.length > 0) {
      data.features.forEach((feature, index) => {
        console.log(`Feature ${index}:`, feature);
        if (feature.sub_geometries) {
          feature.sub_geometries.forEach((subGeom, subIndex) => {
            console.log(`Sub-geometry ${subIndex}:`, {
              ky_hieu_mdsd: subGeom.ky_hieu_mdsd,
              color: subGeom.color,
              dien_tich: subGeom.dien_tich,
            });
          });
        }
      });
    }

    setOverlapData(data);

    if (data.overlap_group?.has_overlap) {
      setDisplayMode("alternating");
      setCurrentOverlapIndex(0);
    } else {
      setDisplayMode("single");
    }
  }, []);

  const handleSearch = () => {
    if (!phuongXa && !soTo && !soThua) {
      setError("Nhập ít nhất 1 thông tin để tra cứu.");
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

  // ✅ Render polygons với chế độ chồng lấn
  // Trong LandUsePlanningMap.js - phần renderedPolygons
  // ✅ Render polygons với chế độ chồng lấn - FIXED
  const renderedPolygons = useMemo(() => {
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
          return { opacity: 0.6, weight: 1.5, dashArray: null };
        case zoomLevel >= 10:
          return { opacity: 0.5, weight: 1, dashArray: "2,2" };
        case zoomLevel >= 8:
          return { opacity: 0.4, weight: 0.8, dashArray: "3,3" };
        default:
          return { opacity: 0.3, weight: 0.6, dashArray: "4,4" };
      }
    };

    const style = getStyleByZoom(zoomLevel);

    // Xử lý dữ liệu chồng lấn
    if (overlapData && overlapData.features && displayMode !== "single") {
      console.log("🎨 Rendering overlap data:", overlapData);

      return overlapData.features.flatMap((feature, featureIndex) => {
        const properties = feature.properties || {};
        const subGeometries = feature.sub_geometries || [];

        return subGeometries
          .map((subGeom, subIndex) => {
            const leafletCoords = convertGeoJSONToLeaflet(subGeom.geometry);
            if (!leafletCoords) return null;

            // ✅ QUAN TRỌNG: Luôn tính màu từ ky_hieu_mdsd
            const landTypeColor =
              subGeom.color || getColorByLoaiDat(subGeom.ky_hieu_mdsd);

            console.log(
              `🎨 Rendering ${subGeom.ky_hieu_mdsd} with color:`,
              landTypeColor
            );

            let featureOpacity = style.opacity;
            let featureWeight = style.weight;

            if (
              displayMode === "alternating" &&
              featureIndex !== currentOverlapIndex
            ) {
              featureOpacity = 0.2;
              featureWeight = 1;
            } else if (displayMode === "all") {
              featureOpacity = 0.5;
              featureWeight = 1;
            }

            if (zoomLevel < 12) {
              featureOpacity = Math.max(0.3, featureOpacity);
              featureWeight = Math.max(0.5, featureWeight);
            }

            return leafletCoords.map((polygonCoords, polyIndex) => (
              <Polygon
                key={`overlap-${
                  properties.id || featureIndex
                }-${subIndex}-${polyIndex}`}
                positions={polygonCoords}
                pathOptions={{
                  color: landTypeColor,
                  fillColor: landTypeColor,
                  fillOpacity: featureOpacity,
                  weight: featureWeight,
                  stroke: true,
                  lineJoin: "round",
                }}
              >
                <Popup>
                  <div style={{ minWidth: "280px" }}>
                    <strong style={{ color: landTypeColor }}>
                      Phân loại đất: {subGeom.ky_hieu_mdsd || "Chưa xác định"}
                    </strong>
                    <p>Số tờ: {properties.so_to}</p>
                    <p>Số thửa: {properties.so_thua}</p>
                    <p>
                      Diện tích:{" "}
                      {subGeom.dien_tich ? `${subGeom.dien_tich}m²` : "0m²"}
                    </p>
                    <p>
                      Màu hiển thị:
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          backgroundColor: landTypeColor,
                          marginLeft: "8px",
                          border: "1px solid #333",
                        }}
                      ></span>
                      {landTypeColor}
                    </p>
                    <p>Chủ sở hữu: {properties.owner || "Chưa có"}</p>
                    <p>Phường/Xã: {properties.phuong_xa}</p>

                    {properties.area_percentages &&
                      properties.area_percentages[subIndex] && (
                        <p>
                          Tỷ lệ diện tích:{" "}
                          {properties.area_percentages[subIndex]}%
                        </p>
                      )}
                  </div>
                </Popup>
              </Polygon>
            ));
          })
          .filter(Boolean);
      });
    }

    // Render dữ liệu không chồng lấn
    return landUseData.map((plot, index) => {
      if (!plot.geom) return null;

      const landUseTypes = plot.ky_hieu_mdsd
        ? plot.ky_hieu_mdsd.split("+").map((type) => type.trim())
        : [plot.ky_hieu_mdsd || "Chưa xác định"];
      const fillColor = getColorByLoaiDat(landUseTypes[0]);
      const plotStyle = getStyleByZoom();

      return plot.geom.map((polygonCoords, polyIndex) => (
        <Polygon
          key={`${plot.id || index}-${polyIndex}`}
          positions={polygonCoords}
          pathOptions={{
            color: fillColor,
            fillColor: fillColor,
            fillOpacity: plotStyle.opacity,
            weight: plotStyle.weight,
            stroke: true,
            lineJoin: "round",
            dashArray: zoomLevel < 14 ? "3,3" : null,
          }}
        >
          <Popup>
            <PlotInfo plot={plot} />
          </Popup>
        </Polygon>
      ));
    });
  }, [
    landUseData,
    overlapData,
    displayMode,
    currentOverlapIndex,
    zoomLevel,
    isLoading,
  ]);
  // Hàm xử lý khi lô đất được cập nhật thành công
  const handlePlotUpdated = (updatedPlot) => {
    setLandUseData((prevData) =>
      prevData.map((plot) =>
        plot.id === updatedPlot.id
          ? {
              ...plot,
              ...updatedPlot,
              geom: convertGeoJSONToLeaflet(
                processGeometryData(updatedPlot.geom)
              ),
            }
          : plot
      )
    );

    // Nếu bạn muốn map tự focus vào thửa đất vừa cập nhật
    if (updatedPlot.geom) {
      const processedGeom = processGeometryData(updatedPlot.geom);
      const leafletCoords = convertGeoJSONToLeaflet(processedGeom);
      if (leafletCoords?.[0]?.[0]) {
        const coords = leafletCoords[0][0];
        const lat =
          coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
        const lng =
          coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
        setMapCenter([lat, lng]);
        setSearchCenter([lat, lng]);
        setShouldUpdateView(true);
        setZoomLevel(18);
      }
    }
  };

  // ✅ Component để điều chỉnh map behavior
  const MapBehaviorHandler = ({ setZoomLevel }) => {
    const map = useMap();

    useEffect(() => {
      const handleZoom = () => {
        const currentZoom = map.getZoom();
        setZoomLevel(currentZoom);

        // Force re-render khi zoom thay đổi
        map.invalidateSize();
      };

      map.on("zoomend", handleZoom);
      map.on("moveend", handleZoom);

      // Khởi tạo giá trị
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

        {/* ✅ OverLapHandler Component */}
        <div
          style={{
            position: "absolute",
            top: "120px",
            right: "15px",
            zIndex: 1000,
            maxWidth: "320px",
          }}
        >
          <OverLapHandler
            soTo={soTo}
            soThua={soThua}
            phuongXa={phuongXa}
            onOverlapData={handleOverlapData}
            onPlotUpdated={handlePlotUpdated}
          />
        </div>

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
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={22}
            minZoom={8}
            noWrap={true}
            maxNativeZoom={19} // OpenStreetMap thường chỉ hỗ trợ đến 19
            // noWrap={true}
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
    </>
  );
};

export default LandUsePlanningMap;
