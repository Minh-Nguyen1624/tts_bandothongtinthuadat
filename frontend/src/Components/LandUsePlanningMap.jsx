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

// ✅ Hiển thị thông tin popup chi tiết - ĐÃ SỬA
// ✅ Hiển thị thông tin popup chi tiết - CẬP NHẬT
const PlotInfo = ({ plot }) => {
  const landUseTypes = plot.ky_hieu_mdsd || ["Chưa xác định"];

  // Tính tổng diện tích từ land_plot_details nếu có
  const totalAreaFromDetails =
    plot.land_plot_details?.reduce(
      (sum, detail) => sum + parseFloat(detail.dien_tich || 0),
      0
    ) || 0;

  return (
    <div style={{ minWidth: "280px" }}>
      <strong>Thông tin lô đất</strong>
      <p>Số tờ: {plot.so_to}</p>
      <p>Số thửa: {plot.so_thua}</p>
      <p>Phường/Xã: {plot.phuong_xa}</p>

      {/* Hiển thị phân loại đất chính */}
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
      {plot.land_plot_details && plot.land_plot_details.length > 0 && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#f8f9fa",
            borderRadius: "5px",
          }}
        >
          <strong>Chi tiết diện tích:</strong>
          {plot.land_plot_details.map((detail, index) => {
            const percentage =
              totalAreaFromDetails > 0
                ? ((detail.dien_tich / totalAreaFromDetails) * 100).toFixed(2)
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
                    {detail.dien_tich} m² ({percentage}%)
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
            Tổng diện tích: {totalAreaFromDetails || plot.dien_tich} m²
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

  const colors = {
    CAN: "#e03804ec", // Cập nhật theo dữ liệu API
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

  // 📡 Fetch API + xử lý geom - ĐÃ SỬA
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
              const processedGeom = processGeometryData(plot.geom);
              const leafletCoordinates = processedGeom
                ? convertGeoJSONToLeaflet(processedGeom)
                : null;

              // ✅ LOG để kiểm tra dữ liệu
              console.log(`📊 Plot ${plot.id}:`, {
                so_to: plot.soTo,
                so_thua: plot.soThua,
                ky_hieu_mdsd: plot.ky_hieu_mdsd,
                ky_hieu_mdsd_array: plot.ky_hieu_mdsd_array,
                land_use_details: plot.land_use_details,
              });

              return leafletCoordinates
                ? { ...plot, geom: leafletCoordinates, originalGeom: plot.geom }
                : null;
            })
            .filter(Boolean);

          setLandUseData(data);
          setSearchType(landResponse.data.search_type || "suggest");

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
                params: { so_to: soTo || "64", so_thua: soThua || "87" },
                // params: { so_to: soTo, so_thua: soThua },
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
              }
            );

            console.log(
              "✅ Overlap API response:",
              overlapResponse.data?.features?.sub_geometries
            );

            if (overlapResponse.data.success) {
              overlapResponse.data.features.forEach((feature) => {
                console.log("Check feature:", feature);
                // setOverlapData(overlapResponse.data);
                setOverlapData(feature);
              });
              if (overlapResponse.data.overlap_group?.has_overlap) {
                setDisplayMode("alternating");
                setCurrentOverlapIndex(0);
              } else {
                setDisplayMode("single");
              }
            }
          } catch (overlapError) {
            console.log("ℹ️ Không thể lấy overlap data:", overlapError.message);
            // Không set error vì đây không phải lỗi nghiêm trọng
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

  // ✅ Render polygons với chế độ chồng lấn - ĐÃ SỬA
  const renderedPolygons = useMemo(() => {
    console.log("🔍 Rendering polygons with overlapData:", overlapData);
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

    // ✅ ƯU TIÊN: Render từ sub_geometries nếu có (geometry phân chia thực tế)
    if (
      overlapData &&
      overlapData.sub_geometries &&
      overlapData.sub_geometries.length > 0
    ) {
      console.log(
        "🎨 Rendering from sub_geometries:",
        overlapData.sub_geometries
      );

      return overlapData.sub_geometries
        .map((subGeom, index) => {
          // Chuyển đổi geometry từ sub_geometries
          const leafletCoords = convertGeoJSONToLeaflet(subGeom.geometry);
          console.log("check leafletCoords: ", leafletCoords);
          if (!leafletCoords) {
            console.warn(
              `⚠️ Cannot convert geometry for sub_geometry ${index}`
            );
            return null;
          }

          const fillColor =
            subGeom.color || getColorByLoaiDat(subGeom.ky_hieu_mdsd);
          const percentage =
            overlapData.properties?.total_area > 0
              ? (subGeom.dien_tich / overlapData.properties.total_area) * 100
              : 0;

          console.log(
            `🎨 Rendering sub_geometry ${index}: ${subGeom.ky_hieu_mdsd}`,
            {
              color: fillColor,
              area: subGeom.dien_tich,
              percentage: percentage.toFixed(2) + "%",
              coordinates: leafletCoords,
            }
          );

          return leafletCoords.map((polygonCoords, polyIndex) => (
            <Polygon
              key={`subgeom-${
                overlapData.properties?.id || "feature"
              }-${index}-${polyIndex}`}
              positions={polygonCoords}
              pathOptions={{
                color: fillColor,
                fillColor: fillColor,
                fillOpacity: style.opacity,
                weight: style.weight,
                stroke: true,
                lineJoin: "round",
                dashArray: zoomLevel < 14 ? "3,3" : null,
              }}
            >
              <Popup>
                <div style={{ minWidth: "280px" }}>
                  <strong style={{ color: fillColor }}>
                    Phân loại đất: {subGeom.ky_hieu_mdsd}
                  </strong>
                  <p>Số tờ: {overlapData.properties?.so_to || "Không rõ"}</p>
                  <p>
                    Số thửa: {overlapData.properties?.so_thua || "Không rõ"}
                  </p>
                  <p>Diện tích: {subGeom.dien_tich} m²</p>
                  <p>Tỷ lệ: {percentage.toFixed(2)}%</p>
                  <p>
                    Chủ sở hữu: {overlapData.properties?.owner || "Chưa có"}
                  </p>
                  <p>
                    Phường/Xã: {overlapData.properties?.phuong_xa || "Không rõ"}
                  </p>
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "5px",
                      background: "#f5f5f5",
                      borderRadius: "3px",
                    }}
                  >
                    <small>
                      <strong>Màu sắc:</strong>
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          backgroundColor: fillColor,
                          margin: "0 5px",
                          border: "1px solid #333",
                        }}
                      ></span>
                      {fillColor}
                    </small>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ));
        })
        .filter(Boolean);
    }

    // Render overlapping details từ features (fallback cũ)
    if (overlapData && overlapData.features && displayMode !== "single") {
      return overlapData.features.flatMap((feature, featureIndex) => {
        const properties = feature.properties || {};
        const subGeometries = feature.sub_geometries || [];
        const { areas, colors, area_percentages } = properties;

        const baseGeometry = convertGeoJSONToLeaflet(feature.geometry);
        if (!baseGeometry) return null;

        // Use areas, colors, and percentages if provided, otherwise fallback to ky_hieu_mdsd
        const landTypes =
          areas && colors && area_percentages
            ? Array(areas.length)
                .fill()
                .map((_, i) => getLandTypeFromIndex(i))
            : (properties.land_types &&
                properties.land_types[0]
                  ?.split(",")
                  ?.map((t) => t.trim().replace("{", "").replace("}", ""))) ||
              [];

        return landTypes.map((landType, index) => {
          const leafletCoords = baseGeometry;
          if (!leafletCoords) return null;

          const landTypeColor = colors?.[index] || getColorByLoaiDat(landType);
          const area = areas?.[index] || 0;
          const percentage = area_percentages?.[index] || 0;

          let featureOpacity = style.opacity;
          let featureWeight = style.weight;

          if (displayMode === "alternating" && index !== currentOverlapIndex) {
            featureOpacity = 0.2;
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
              }-${index}-${polyIndex}`}
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
                    Phân loại đất: {landType || "Chưa xác định"}
                  </strong>
                  <p>Số tờ: {properties.so_to || "Không rõ"}</p>
                  <p>Số thửa: {properties.so_thua || "Không rõ"}</p>
                  <p>Diện tích: {area ? `${area} m²` : "0 m²"}</p>
                  <p>Tỷ lệ: {percentage}%</p>
                  <p>Chủ sở hữu: {properties.owner || "Chưa có"}</p>
                  <p>Phường/Xã: {properties.phuong_xa || "Không rõ"}</p>
                </div>
              </Popup>
            </Polygon>
          ));
        });
      });
    }

    // Fallback: Render từ land_plot_details nếu có geometry riêng
    return landUseData.map((plot, plotIndex) => {
      if (!plot.geom) return null;

      const plotStyle = getStyleByZoom();

      // Nếu có land_plot_details với geometry riêng, render từng phần thực tế
      if (plot.land_plot_details && plot.land_plot_details.length > 0) {
        const hasDetailGeometry = plot.land_plot_details.some(
          (detail) => detail.geometry
        );

        if (hasDetailGeometry) {
          console.log(`📊 Plot ${plot.id} has land_plot_details with geometry`);

          return plot.land_plot_details
            .map((detail, detailIndex) => {
              if (!detail.geometry) return null;

              const leafletCoords = convertGeoJSONToLeaflet(detail.geometry);
              if (!leafletCoords) return null;

              const fillColor =
                detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd);
              const percentage =
                plot.total_area > 0
                  ? (detail.dien_tich / plot.total_area) * 100
                  : 0;

              return leafletCoords.map((polygonCoords, polyIndex) => (
                <Polygon
                  key={`${plot.id}-detail-${detail.id}-${polyIndex}`}
                  positions={polygonCoords}
                  pathOptions={{
                    color: fillColor,
                    fillColor: fillColor,
                    fillOpacity: style.opacity,
                    weight: plotStyle.weight,
                    stroke: true,
                    lineJoin: "round",
                    dashArray: zoomLevel < 14 ? "3,3" : null,
                  }}
                >
                  <Popup>
                    <PlotInfo plot={plot} detail={detail} />
                  </Popup>
                </Polygon>
              ));
            })
            .filter(Boolean);
        }
      }

      // Fallback cuối cùng: Render theo geom chính và ky_hieu_mdsd
      const landUseTypes = Array.isArray(plot.ky_hieu_mdsd)
        ? plot.ky_hieu_mdsd
        : typeof plot.ky_hieu_mdsd === "string"
        ? plot.ky_hieu_mdsd.split("+")
        : ["Chưa xác định"];

      return landUseTypes.map((landType, typeIndex) => {
        const leafletCoords = plot.geom;
        if (!leafletCoords) return null;

        const fillColor = getColorByLoaiDat(landType);

        return leafletCoords.map((polygonCoords, polyIndex) => (
          <Polygon
            key={`${plot.id}-main-${typeIndex}-${polyIndex}`}
            positions={polygonCoords}
            pathOptions={{
              color: fillColor,
              fillColor: fillColor,
              fillOpacity: plotStyle.opacity * (1 - typeIndex * 0.1),
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
            maxNativeZoom={19}
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
