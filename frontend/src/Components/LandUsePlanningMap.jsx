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
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { FaSearch, FaSpinner } from "react-icons/fa";
import {
  processGeometryData,
  convertGeoJSONToLeaflet,
} from "../utils/geometryProcessor";
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
  position: "fixed",
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
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1]) &&
      Math.abs(center[0]) <= 90 &&
      Math.abs(center[1]) <= 180
    ) {
      // console.log("🗺️ Updating map view to:", center, zoom);
      map.setView(center, zoom);
    } else {
      console.warn("🗺️ Invalid center coordinates, skipping update:", center);
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

// ✅ Hiển thị thông tin popup chi tiết
const PlotInfo = ({ plot, detail }) => {
  const landUseTypes = plot.ky_hieu_mdsd || ["Chưa xác định"];

  const handleDirectionsClick = () => {
    if (!plot) {
      alert("Không có thông tin lô đất");
      return;
    }

    let destinationLat, destinationLng;

    // ✅ BƯỚC 1: Ưu tiên dùng plot.lat, plot.lng nếu có
    if (plot.lat && plot.lng && !isNaN(plot.lat) && !isNaN(plot.lng)) {
      destinationLat = parseFloat(plot.lat);
      destinationLng = parseFloat(plot.lng);
    }
    // ✅ BƯỚC 2: Nếu không có → lấy TÂM của geometry (bất kỳ detail nào)
    else {
      const geometry =
        detail?.leafletGeometry ||
        plot.geom?.[0] ||
        plot.land_use_details?.[0]?.leafletGeometry;

      if (geometry && Array.isArray(geometry) && geometry.length > 0) {
        const allCoords = geometry
          .flat(3)
          .filter(
            (coord) =>
              Array.isArray(coord) &&
              coord.length === 2 &&
              !isNaN(coord[0]) &&
              !isNaN(coord[1])
          );

        if (allCoords.length > 0) {
          const latSum = allCoords.reduce((sum, c) => sum + c[0], 0);
          const lngSum = allCoords.reduce((sum, c) => sum + c[1], 0);
          destinationLat = latSum / allCoords.length;
          destinationLng = lngSum / allCoords.length;
        }
      }
    }

    // ✅ BƯỚC 3: Kiểm tra tọa độ hợp lệ
    if (
      !destinationLat ||
      !destinationLng ||
      isNaN(destinationLat) ||
      isNaN(destinationLng) ||
      Math.abs(destinationLat) > 90 ||
      Math.abs(destinationLng) > 180
    ) {
      alert("Tọa độ lô đất không hợp lệ, không thể hướng dẫn đường đi.");
      return;
    }

    // ✅ Mở Google Maps
    const createGoogleMapsUrl = (origin = null) => {
      const baseUrl = "https://www.google.com/maps/dir/?api=1";
      const destination = `${destinationLat},${destinationLng}`;
      return origin
        ? `${baseUrl}&origin=${origin}&destination=${destination}&travelmode=driving`
        : `${baseUrl}&destination=${destination}&travelmode=driving`;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          window.open(createGoogleMapsUrl(origin), "_blank");
        },
        () => {
          window.open(createGoogleMapsUrl(), "_blank");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      window.open(createGoogleMapsUrl(), "_blank");
    }
  };

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

        <button
          onClick={handleDirectionsClick}
          style={{
            border: "none",
            background: "#007bff",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            marginTop: "10px",
            width: "100%",
          }}
        >
          🗺️ Hướng dẫn đường đi
        </button>
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

      <button
        onClick={handleDirectionsClick}
        style={{
          border: "none",
          background: "#007bff",
          color: "white",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          marginTop: "10px",
          width: "100%",
        }}
      >
        🗺️ Hướng dẫn đường đi
      </button>
    </div>
  );
};

// 🧩 Hàm xử lý geometry LINH HOẠT - XỬ LÝ CẢ 2 TRƯỜNG HỢP
const processPlotGeometry = (plot) => {
  console.log(`🔄 Processing geometry for plot ${plot.id}:`, {
    geometrySource: plot.geometrySource,
    has_land_use_details: !!plot.land_use_details,
    land_use_details_count: plot.land_use_details?.length,
    has_geom: !!plot.geom,
    geom_type: plot.geom ? typeof plot.geom : "null",
  });

  const results = {
    geometries: [],
    source: "none",
    details: [],
  };

  // ✅ TRƯỜNG HỢP 1: CÓ land_use_details VỚI GEOMETRY
  if (
    plot.land_use_details &&
    Array.isArray(plot.land_use_details) &&
    plot.land_use_details.length > 0
  ) {
    const landUseGeometries = [];
    const validDetails = [];

    plot.land_use_details.forEach((detail, index) => {
      let leafletGeom = null;

      // Ưu tiên geometry đã được xử lý (leafletGeometry)
      if (detail.leafletGeometry) {
        leafletGeom = detail.leafletGeometry;
      }
      // Thử xử lý từ detail.geometry
      else if (detail.geometry) {
        try {
          const processedGeom = processGeometryData(detail.geometry);
          leafletGeom = processedGeom
            ? convertGeoJSONToLeaflet(processedGeom)
            : null;
        } catch (error) {
          console.error(
            `❌ Error processing detail geometry for ${detail.ky_hieu_mdsd}:`,
            error
          );
        }
      }

      if (leafletGeom) {
        landUseGeometries.push(leafletGeom);
        validDetails.push({
          ...detail,
          color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
          leafletGeometry: leafletGeom,
        });
      } else {
        console.warn(
          `⚠️ No valid geometry for land use detail: ${detail.ky_hieu_mdsd}`
        );
      }
    });

    if (landUseGeometries.length > 0) {
      console.log(
        `✅ Found ${landUseGeometries.length} valid land use geometries`
      );
      results.geometries = landUseGeometries;
      results.details = validDetails;
      results.source = "land_use_details";
      return results;
    }
  }

  // ✅ TRƯỜNG HỢP 2: CÓ geom CHÍNH
  if (plot.geom) {
    console.log("🔄 Processing main geom...");

    try {
      let leafletCoordinates = plot.geom;

      // Nếu geom chưa được xử lý (là GeoJSON string hoặc object), chuyển đổi
      if (
        typeof plot.geom === "string" ||
        (plot.geom && plot.geom.type === "FeatureCollection") ||
        (plot.geom && plot.geom.type === "MultiPolygon")
      ) {
        const processedGeom = processGeometryData(plot.geom);
        leafletCoordinates = processedGeom
          ? convertGeoJSONToLeaflet(processedGeom)
          : null;
      }

      if (leafletCoordinates && Array.isArray(leafletCoordinates)) {
        console.log(`✅ Successfully processed main geom`, {
          geometry_count: leafletCoordinates.length,
          first_coords_sample: leafletCoordinates[0]?.[0]?.[0],
        });

        // Tạo land_use_details từ geom chính nếu không có
        let details = [];
        if (plot.land_use_details && plot.land_use_details.length > 0) {
          // Có land_use_details nhưng không có geometry -> dùng geom chính cho tất cả
          details = plot.land_use_details.map((detail) => ({
            ...detail,
            color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
            leafletGeometry: leafletCoordinates,
          }));
        } else {
          // Không có land_use_details -> tạo mock detail từ thông tin chính
          const landTypes = Array.isArray(plot.ky_hieu_mdsd)
            ? plot.ky_hieu_mdsd
            : plot.ky_hieu_mdsd
            ? [plot.ky_hieu_mdsd]
            : ["UNKNOWN"];

          details = landTypes.map((landType) => ({
            ky_hieu_mdsd: landType,
            dien_tich: plot.dien_tich || "0",
            color: getColorByLoaiDat(landType),
            geometry: plot.originalGeom || plot.geom,
            leafletGeometry: leafletCoordinates,
          }));
        }

        results.geometries = [leafletCoordinates];
        results.details = details;
        results.source = "main_geom";
        return results;
      }
    } catch (error) {
      console.error("❌ Error processing main geom:", error);
    }
  }

  // ✅ TRƯỜNG HỢP 3: FALLBACK - TẠO GEOMETRY TỪ LAT/LNG
  if (plot.lat && plot.lng) {
    console.log("🔄 Creating fallback geometry from lat/lng");
    try {
      // Tạo một hình chữ nhật nhỏ xung quanh tọa độ
      const lat = parseFloat(plot.lat);
      const lng = parseFloat(plot.lng);
      const offset = 0.0001; // ~11 meters

      const fallbackGeometry = [
        [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset],
        ],
      ];

      const landTypes = Array.isArray(plot.ky_hieu_mdsd)
        ? plot.ky_hieu_mdsd
        : plot.ky_hieu_mdsd
        ? [plot.ky_hieu_mdsd]
        : ["UNKNOWN"];

      const details = landTypes.map((landType) => ({
        ky_hieu_mdsd: landType,
        dien_tich: plot.dien_tich || "0",
        color: getColorByLoaiDat(landType),
        leafletGeometry: fallbackGeometry,
      }));

      results.geometries = [fallbackGeometry];
      results.details = details;
      results.source = "fallback";
      return results;
    } catch (error) {
      console.error("❌ Error creating fallback geometry:", error);
    }
  }

  console.error("❌ No valid geometry found for plot", {
    id: plot.id,
    has_lat_lng: !!(plot.lat && plot.lng),
  });
  return null;
};

// ✅ MAPPING TÊN PHƯỜNG TỪ boundary SANG land_plots
const PHUONG_MAPPING = {
  "Phuong Trung An": "Phường Trung An",
  "Phuong Đạo Thạnh": "Phường Đạo Thạnh",
  "Phuong Mỹ Phong": "Phường Mỹ Phong",
  "Phuong Mỹ Thọ": "Phường Mỹ Thọ",
  "Phuong Thới Sơn": "Phường Thới Sơn",
};

const LandUsePlanningMap = () => {
  const [soTo, setSoTo] = useState("");
  const [soThua, setSoThua] = useState("");
  const [landUseData, setLandUseData] = useState([]);
  const [allPlotsData, setAllPlotsData] = useState([]); // ✅ STATE: Tất cả lô đất
  const [mapCenter, setMapCenter] = useState([10.367, 106.345]);
  const [searchCenter, setSearchCenter] = useState([10.367, 106.345]);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState("");
  const [zoomLevel, setZoomLevel] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [shouldUpdateView, setShouldUpdateView] = useState(false);

  const [phuongBoundary, setPhuongBoundary] = useState(null);
  const [selectedPhuong, setSelectedPhuong] = useState("");
  const [phuongList, setPhuongList] = useState([]);

  // ✅ STATE: Lô đất được chọn
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plotBoundary, setPlotBoundary] = useState(null);

  const token = localStorage.getItem("token");
  const searchTimeoutRef = useRef(null);

  // ✅ HÀM MAP TÊN PHƯỜNG
  const mapPhuongName = useCallback((boundaryName) => {
    return PHUONG_MAPPING[boundaryName] || boundaryName;
  }, []);

  // Lấy danh sách phường/xã
  const fetchPhuongList = useCallback(async () => {
    try {
      if (!token) {
        setError("Vui lòng đăng nhập để tiếp tục.");
        return;
      }
      setError(null);
      setIsLoading(true);

      const response = await axios.get(
        `${API_URL}/api/land_plots/phuong-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setPhuongList(response.data.data);
      } else {
        setPhuongList([]);
      }
    } catch (error) {
      console.error("Error fetching phuong list:", error);
      setPhuongList([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ✅ HÀM: Lấy TẤT CẢ lô đất khi component mount - XỬ LÝ LINH HOẠT
  const fetchAllPlots = useCallback(async () => {
    try {
      if (!token) {
        setError("Vui lòng đăng nhập để tiếp tục.");
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/land_plots`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      console.log("✅ ALL PLOTS RESPONSE:", response.data);

      if (response.data.success) {
        const data = response.data.data
          .map((plot) => {
            // Xác định geometry source thông minh
            let geometrySource = plot.geometrySource;

            if (!geometrySource) {
              // Nếu có land_use_details với geometry -> ưu tiên
              if (
                plot.land_use_details &&
                plot.land_use_details.length > 0 &&
                plot.land_use_details.some((detail) => detail.geometry)
              ) {
                geometrySource = "land_use_details";
              }
              // Nếu có geom chính -> dùng
              else if (plot.geom) {
                geometrySource = "main_geom";
              }
              // Nếu chỉ có lat/lng -> fallback
              else if (plot.lat && plot.lng) {
                geometrySource = "fallback";
              }
            }

            const plotWithSource = {
              ...plot,
              geometrySource: geometrySource,
            };

            console.log(`📊 Plot ${plot.id} geometry source:`, geometrySource);

            const geometryResult = processPlotGeometry(plotWithSource);
            if (!geometryResult) {
              console.warn(`⚠️ Skipping plot ${plot.id} - no geometry`);
              return null;
            }

            return {
              ...plotWithSource,
              geom: geometryResult.geometries,
              geometrySource: geometryResult.source,
              land_use_details: geometryResult.details,
              originalGeom: plot.geom,
            };
          })
          .filter(Boolean);

        console.log(`📈 Processed ${data.length} plots with geometry`);

        // Thống kê geometry sources
        const sourceStats = data.reduce((stats, plot) => {
          stats[plot.geometrySource] = (stats[plot.geometrySource] || 0) + 1;
          return stats;
        }, {});

        console.log("📊 Geometry source statistics:", sourceStats);

        setAllPlotsData(data);
        setLandUseData(data);
        setError(
          `✅ Đã tải ${data.length} lô đất (${JSON.stringify(sourceStats)})`
        );
      } else {
        setError("❌ Không có dữ liệu lô đất.");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error fetching all plots:", error);
      setError("❌ Lỗi khi tải dữ liệu lô đất.");
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPhuongList();
    fetchAllPlots(); // ✅ TẢI TẤT CẢ LÔ ĐẤT KHI MOUNT
  }, [fetchPhuongList, fetchAllPlots]);

  // Hàm fetch ranh giới phường/xã
  const fetchPhuongBoundary = useCallback(
    async (tenPhuong) => {
      try {
        setIsLoading(true);

        const response = await axios.get(
          `${API_URL}/api/land_plots/phuong-boundary`,
          {
            params: { ten_phuong_xa: tenPhuong },
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );

        // console.log("📡 Boundary API Response:", response.data);

        if (response.data && response.data.success) {
          const boundaryData = response.data.boundary;
          const leafletCoordinates = convertGeoJSONToLeaflet(boundaryData);

          setPhuongBoundary({
            coordinates: leafletCoordinates,
            name: response.data.phuong_xa,
            ma_hanh_chinh: response.data.ma_hanh_chinh,
          });

          // Cập nhật map center đến phường được chọn
          if (leafletCoordinates && leafletCoordinates.length > 0) {
            const allCoords = [];

            const flattenCoords = (arr) => {
              if (Array.isArray(arr)) {
                if (
                  arr.length === 2 &&
                  typeof arr[0] === "number" &&
                  typeof arr[1] === "number"
                ) {
                  allCoords.push(arr);
                } else {
                  arr.forEach((item) => flattenCoords(item));
                }
              }
            };

            flattenCoords(leafletCoordinates);

            if (allCoords.length > 0) {
              const validCoords = allCoords.filter(
                (coord) =>
                  !isNaN(coord[0]) &&
                  !isNaN(coord[1]) &&
                  coord[0] !== 0 &&
                  coord[1] !== 0
              );

              if (validCoords.length > 0) {
                const latSum = validCoords.reduce(
                  (sum, coord) => sum + coord[0],
                  0
                );
                const lngSum = validCoords.reduce(
                  (sum, coord) => sum + coord[1],
                  0
                );

                const centerLat = latSum / validCoords.length;
                const centerLng = lngSum / validCoords.length;

                if (
                  !isNaN(centerLat) &&
                  !isNaN(centerLng) &&
                  centerLat !== 0 &&
                  centerLng !== 0
                ) {
                  setSearchCenter([centerLat, centerLng]);
                  setMapCenter([centerLat, centerLng]);
                  setShouldUpdateView(true);
                  setZoomLevel(14);
                }
              }
            }
          }

          setError(null);
        } else {
          setPhuongBoundary(null);
          const debugInfo = response.data?.available_phuong
            ? `Các phường có sẵn: ${response.data.available_phuong.join(", ")}`
            : "";
          setError(
            `${
              response.data?.message || "Không tìm thấy ranh giới phường/xã"
            } ${debugInfo}`
          );
        }
      } catch (error) {
        console.error("Error fetching phuong boundary:", error);
        setError(
          "Không thể tải ranh giới phường/xã: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  // Xử lý khi chọn phường/xã
  const handlePhuongXaChange = useCallback(
    (e) => {
      const selectedValue = e.target.value;
      setSelectedPhuong(selectedValue);

      // Reset lô đất được chọn khi đổi phường
      setSelectedPlot(null);
      setPlotBoundary(null);
      setSoTo("");
      setSoThua("");

      if (selectedValue) {
        fetchPhuongBoundary(selectedValue);

        // ✅ Lọc lô đất theo phường được chọn - SO SÁNH TRỰC TIẾP
        const filteredPlots = allPlotsData.filter(
          (plot) => plot.phuong_xa === selectedValue // ✅ SO SÁNH TRỰC TIẾP
        );

        if (filteredPlots.length > 0) {
          setLandUseData(filteredPlots);
          setError(
            `✅ Hiển thị ${filteredPlots.length} lô đất trong ${selectedValue}`
          );
        } else {
          // Nếu không tìm thấy lô trong phường, vẫn hiển thị tất cả
          setLandUseData(allPlotsData);
          setError(
            `⚠️ Không tìm thấy lô đất trong ${selectedValue}, hiển thị tất cả lô đất`
          );
        }
      } else {
        setPhuongBoundary(null);
        setMapCenter([10.367, 106.345]);
        setZoomLevel(12);
        setShouldUpdateView(true);
        setError(null);
        // ✅ Khi bỏ chọn phường, hiển thị lại tất cả lô đất
        setLandUseData(allPlotsData);
      }
    },
    [fetchPhuongBoundary, allPlotsData] // ✅ LOẠI BỎ mapPhuongName
  );

  // ✅ HÀM TÌM LÔ ĐẤT CỤ THỂ - DEBUG CHI TIẾT
  const fetchPlotByNumber = useCallback(
    (phuongXa, soTo, soThua) => {
      try {
        setIsLoading(true);
        setError(null);
        setSelectedPlot(null);
        setPlotBoundary(null);

        console.log("🔍 SEARCHING SPECIFIC PLOT:", { phuongXa, soTo, soThua });

        // Tìm trong dữ liệu đã có
        let foundPlot = allPlotsData.find(
          (plot) =>
            plot.so_to == soTo &&
            plot.so_thua == soThua &&
            plot.phuong_xa === phuongXa
        );

        if (!foundPlot) {
          foundPlot = allPlotsData.find(
            (plot) =>
              plot.so_to == soTo &&
              plot.so_thua == soThua &&
              plot.phuong_xa &&
              (plot.phuong_xa === phuongXa ||
                plot.phuong_xa.includes(phuongXa) ||
                phuongXa.includes(plot.phuong_xa))
          );
        }

        if (foundPlot) {
          console.log("🎯 FOUND PLOT:", {
            id: foundPlot.id,
            geometrySource: foundPlot.geometrySource,
            hasGeom: !!foundPlot.geom,
            geomCount: foundPlot.geom ? foundPlot.geom.length : 0,
            landUseDetailsCount: foundPlot.land_use_details?.length,
            landUseDetailsWithGeometry: foundPlot.land_use_details?.filter(
              (d) => d.leafletGeometry
            )?.length,
          });

          // Sử dụng geometry đã được xử lý
          let plotGeometry = foundPlot.geom;

          if (!plotGeometry || plotGeometry.length === 0) {
            console.log("🔄 Reprocessing geometry for plot...");
            const reprocessed = processPlotGeometry(foundPlot);
            if (reprocessed) {
              plotGeometry = reprocessed.geometries;
              foundPlot = {
                ...foundPlot,
                geom: plotGeometry,
                geometrySource: reprocessed.source,
              };
            }
          }

          setSelectedPlot(foundPlot);
          setPlotBoundary(plotGeometry);

          // Cập nhật map center
          if (plotGeometry && plotGeometry.length > 0) {
            const allCoords = [];

            const flattenCoords = (arr) => {
              if (Array.isArray(arr)) {
                if (
                  arr.length === 2 &&
                  typeof arr[0] === "number" &&
                  typeof arr[1] === "number"
                ) {
                  allCoords.push(arr);
                } else {
                  arr.forEach((item) => flattenCoords(item));
                }
              }
            };

            plotGeometry.forEach((geom) => {
              if (Array.isArray(geom)) {
                flattenCoords(geom);
              }
            });

            if (allCoords.length > 0) {
              const validCoords = allCoords.filter(
                (coord) =>
                  !isNaN(coord[0]) &&
                  !isNaN(coord[1]) &&
                  coord[0] !== 0 &&
                  coord[1] !== 0
              );

              if (validCoords.length > 0) {
                const latSum = validCoords.reduce(
                  (sum, coord) => sum + coord[0],
                  0
                );
                const lngSum = validCoords.reduce(
                  (sum, coord) => sum + coord[1],
                  0
                );

                const centerLat = latSum / validCoords.length;
                const centerLng = lngSum / validCoords.length;

                console.log("📍 Setting plot center to:", [
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

          setError(
            `✅ Đã tìm thấy lô đất (${foundPlot.geometrySource}): ${foundPlot.so_to}/${foundPlot.so_thua}`
          );
        } else {
          console.warn("❌ PLOT NOT FOUND IN CACHE");
          setError(
            `❌ Không tìm thấy lô đất ${soTo}/${soThua} trong ${phuongXa}`
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error finding plot:", error);
        setError("❌ Lỗi khi tìm kiếm lô đất: " + error.message);
        setIsLoading(false);
      }
    },
    [allPlotsData]
  );

  // ✅ HÀM XỬ LÝ TÌM KIẾM
  const handleSearch = () => {
    if (!selectedPhuong) {
      setError("❌ Vui lòng chọn phường/xã trước.");
      return;
    }

    // Map tên phường từ boundary sang land_plots
    const mappedPhuong = mapPhuongName(selectedPhuong);

    // console.log("🔄 Searching plot:", {
    //   selected: selectedPhuong,
    //   mapped: mappedPhuong,
    //   soTo,
    //   soThua,
    // });

    // Nếu có đủ thông tin số tờ + số thửa, tìm lô đất cụ thể
    if (soTo && soThua) {
      fetchPlotByNumber(selectedPhuong, soTo, soThua);
    } else {
      // Nếu chỉ chọn phường, lọc lô đất theo phường
      const filteredPlots = allPlotsData.filter(
        (plot) =>
          // plot.phuong_xa &&
          // plot.phuong_xa.includes(mappedPhuong.replace("Phuong", "Phường")
          plot.phuong_xa === selectedPhuong // ✅ SO SÁNH TRỰC TIẾP
      );

      if (filteredPlots.length > 0) {
        setLandUseData(filteredPlots);
        setError(
          `✅ Hiển thị ${filteredPlots.length} lô đất trong ${selectedPhuong}`
        );

        // Zoom đến phường đã chọn
        if (phuongBoundary && phuongBoundary.coordinates) {
          const allCoords = phuongBoundary.coordinates
            .flat(3)
            .filter((coord) => Array.isArray(coord) && coord.length === 2);

          if (allCoords.length > 0) {
            const latSum = allCoords.reduce((sum, coord) => sum + coord[0], 0);
            const lngSum = allCoords.reduce((sum, coord) => sum + coord[1], 0);

            const centerLat = latSum / allCoords.length;
            const centerLng = lngSum / allCoords.length;

            setSearchCenter([centerLat, centerLng]);
            setMapCenter([centerLat, centerLng]);
            setShouldUpdateView(true);
            setZoomLevel(14);
          }
        }
      } else {
        setError(`❌ Không tìm thấy lô đất trong ${selectedPhuong}`);
      }
    }
  };

  // ✅ Auto-search khi có đủ thông tin
  useEffect(() => {
    if (selectedPhuong && soTo && soThua) {
      // console.log("🔍 Auto-searching plot:", { selectedPhuong, soTo, soThua });

      const autoSearchTimer = setTimeout(() => {
        fetchPlotByNumber(selectedPhuong, soTo, soThua);
      }, 800);

      return () => clearTimeout(autoSearchTimer);
    }
  }, [selectedPhuong, soTo, soThua, fetchPlotByNumber]);

  // Reset shouldUpdateView sau khi đã update xong
  useEffect(() => {
    if (shouldUpdateView) {
      const timer = setTimeout(() => setShouldUpdateView(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldUpdateView]);

  // ✅ Render ranh giới phường/xã
  const renderedPhuongBoundary = useMemo(() => {
    if (!phuongBoundary || !phuongBoundary.coordinates) return null;

    return phuongBoundary.coordinates.map((polygonCoords, index) => (
      <Polygon
        key={`phuong-boundary-${phuongBoundary.name}-${index}`}
        positions={polygonCoords}
        pathOptions={{
          color: "#ff0000",
          fillColor: "transparent",
          fillOpacity: 0,
          weight: 3,
          stroke: true,
          lineJoin: "round",
          dashArray: "5, 5",
          className: "phuong-boundary",
        }}
      >
        <Popup>
          <div style={{ minWidth: "200px" }}>
            <strong>Phường/Xã: {phuongBoundary.name}</strong>
            {phuongBoundary.ma_hanh_chinh && (
              <p>Mã hành chính: {phuongBoundary.ma_hanh_chinh}</p>
            )}
            <p>Ranh giới hành chính</p>
          </div>
        </Popup>
      </Polygon>
    ));
  }, [phuongBoundary]);

  // ✅ Render lô đất được chọn (nổi bật)
  const renderedSelectedPlot = useMemo(() => {
    if (!selectedPlot || !plotBoundary || isLoading) return null;

    // console.log(
    //   "🎨 Rendering selected plot:",
    //   selectedPlot.so_to,
    //   selectedPlot.so_thua
    // );

    return plotBoundary.map((polygonCoords, polyIndex) => (
      <Polygon
        key={`selected-plot-${selectedPlot.id}-${polyIndex}`}
        positions={polygonCoords}
        pathOptions={{
          color: "#ff0000",
          fillColor: "#ff0000",
          fillOpacity: 0.3,
          weight: 4,
          stroke: true,
          lineJoin: "round",
          className: "selected-plot-highlight",
        }}
      >
        <Popup>
          <div style={{ minWidth: "280px" }}>
            <strong style={{ color: "#ff0000" }}>📍 LÔ ĐẤT ĐƯỢC CHỌN</strong>
            <PlotInfo plot={selectedPlot} />
          </div>
        </Popup>
      </Polygon>
    ));
  }, [selectedPlot, plotBoundary, isLoading]);

  // ✅ Render polygons tổng quan (tất cả lô đất)
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
          return { opacity: 0.6, weight: 1.5, dashArray: "2,2" };
        case zoomLevel >= 10:
          return { opacity: 0.5, weight: 1, dashArray: "3,3" };
        default:
          return { opacity: 0.3, weight: 0.6, dashArray: "4,4" };
      }
    };

    const style = getStyleByZoom(zoomLevel);

    if (landUseData.length > 0) {
      // console.log(`🎨 Rendering ${landUseData.length} plots`);

      return landUseData
        .flatMap((plot, plotIndex) => {
          if (!plot.land_use_details || plot.land_use_details.length === 0) {
            return null;
          }

          return plot.land_use_details
            .map((detail, detailIndex) => {
              if (!detail.leafletGeometry) {
                return null;
              }

              const fillColor =
                detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd);

              return detail.leafletGeometry.map((polygonCoords, polyIndex) => (
                <Polygon
                  key={`${plot.id}-${detail.ky_hieu_mdsd}-${polyIndex}`}
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
            value={selectedPhuong}
            onChange={handlePhuongXaChange}
          >
            <option value="">--Chọn Phường/Xã--</option>
            {phuongList.map((phuong, index) => (
              <option key={index} value={phuong.ten_phuong_xa}>
                {phuong.ten_phuong_xa}
              </option>
            ))}
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

      {/* Hiển thị thông báo */}
      {/* {error && (
        <div
          className={`error-message ${
            error.includes("✅")
              ? "success"
              : error.includes("❌")
              ? "error"
              : "warning"
          }`}
        >
          {error}
        </div>
      )} */}

      <div style={containerStyle}>
        <LoadingOverlay isLoading={isLoading} />
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={containerStyle}
          zoomControl={false}
          maxZoom={22}
          minZoom={14}
          zoomSnap={0.5}
          zoomDelta={0.5}
        >
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
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🌙 Tối (Dark)">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🎨 Màu sắc">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={22}
                minZoom={8}
                noWrap={true}
                maxNativeZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="⚪ Trắng đơn giản">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={22}
                minZoom={8}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🌍 Google Satellite">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                attribution="&copy; Google"
                maxZoom={22}
                minZoom={8}
              />
            </LayersControl.BaseLayer>

            {/* Overlay layers (có thể bật/tắt cùng lúc với base layer) */}
            <LayersControl.Overlay checked name="🏘️ Ranh giới phường">
              {/* Thêm ranh giới phường ở đây nếu muốn */}
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="📍 Lô đất">
              {/* Thêm lô đất ở đây nếu muốn */}
            </LayersControl.Overlay>

            <LayersControl.BaseLayer name="🌆 Google Hybrid">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution="&copy; Google"
                maxZoom={22}
                minZoom={8}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer
              name="🌍 Google Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google"
              maxZoom={22}
              minZoom={8}
            />

            <LayersControl.BaseLayer name="🌍 Google Terrain">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                attribution="&copy; Google"
                maxZoom={22}
                minZoom={8}
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

          {/* Hiển thị ranh giới phường/xã */}
          {renderedPhuongBoundary}

          {/* ✅ HIỂN THỊ LÔ ĐẤT ĐƯỢC CHỌN (nổi bật) */}
          {renderedSelectedPlot}

          {/* ✅ HIỂN THỊ TẤT CẢ LÔ ĐẤT */}
          {renderedPolygons}
        </MapContainer>
      </div>
    </>
  );
};

export default LandUsePlanningMap;
