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
      console.log("🗺️ Updating map view to:", center, zoom);
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

  // ✅ HÀM: Lấy TẤT CẢ lô đất khi component mount
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
            const geometryResult = processPlotGeometry(plot);
            if (!geometryResult) return null;

            return {
              ...plot,
              geom: geometryResult.geometries,
              geometrySource: geometryResult.source,
              land_use_details: geometryResult.details,
              originalGeom: plot.geom,
            };
          })
          .filter(Boolean);

        setAllPlotsData(data);
        setLandUseData(data); // ✅ HIỂN THỊ TẤT CẢ LÊN MAP NGAY LẬP TỨC
        setError(`✅ Đã tải ${data.length} lô đất`);
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

        console.log("📡 Boundary API Response:", response.data);

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

        // ✅ Lọc lô đất theo phường được chọn
        const mappedPhuong = mapPhuongName(selectedValue);
        const filteredPlots = allPlotsData.filter(
          (plot) =>
            plot.phuong_xa &&
            plot.phuong_xa.includes(mappedPhuong.replace("Phuong", "Phường"))
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
    [fetchPhuongBoundary, mapPhuongName, allPlotsData]
  );

  // ✅ HÀM TÌM LÔ ĐẤT CỤ THỂ
  const fetchPlotByNumber = useCallback(
    (phuongXa, soTo, soThua) => {
      try {
        setIsLoading(true);
        setError(null);
        setSelectedPlot(null);
        setPlotBoundary(null);

        console.log("🔍 SEARCHING SPECIFIC PLOT:", { phuongXa, soTo, soThua });

        // Tìm trong dữ liệu đã có
        const mappedPhuong = mapPhuongName(phuongXa);
        const foundPlot = allPlotsData.find(
          (plot) =>
            plot.so_to == soTo &&
            plot.so_thua == soThua &&
            plot.phuong_xa &&
            plot.phuong_xa.includes(mappedPhuong.replace("Phuong", "Phường"))
        );

        if (foundPlot) {
          console.log("🎯 FOUND PLOT IN CACHE:", foundPlot);

          setSelectedPlot(foundPlot);
          setPlotBoundary(foundPlot.geom);

          // Cập nhật map center đến lô đất
          if (foundPlot.geom && foundPlot.geom.length > 0) {
            const allCoords = foundPlot.geom
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

              console.log("📍 Setting plot center to:", [centerLat, centerLng]);

              setSearchCenter([centerLat, centerLng]);
              setMapCenter([centerLat, centerLng]);
              setShouldUpdateView(true);
              setZoomLevel(18); // Zoom sát vào lô đất
            }
          }

          setError(
            `✅ Đã tìm thấy và zoom đến lô đất: ${foundPlot.so_to}/${foundPlot.so_thua}`
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
    [allPlotsData, mapPhuongName]
  );

  // ✅ HÀM XỬ LÝ TÌM KIẾM
  const handleSearch = () => {
    if (!selectedPhuong) {
      setError("❌ Vui lòng chọn phường/xã trước.");
      return;
    }

    // Map tên phường từ boundary sang land_plots
    const mappedPhuong = mapPhuongName(selectedPhuong);

    console.log("🔄 Searching plot:", {
      selected: selectedPhuong,
      mapped: mappedPhuong,
      soTo,
      soThua,
    });

    // Nếu có đủ thông tin số tờ + số thửa, tìm lô đất cụ thể
    if (soTo && soThua) {
      fetchPlotByNumber(selectedPhuong, soTo, soThua);
    } else {
      // Nếu chỉ chọn phường, lọc lô đất theo phường
      const filteredPlots = allPlotsData.filter(
        (plot) =>
          plot.phuong_xa &&
          plot.phuong_xa.includes(mappedPhuong.replace("Phuong", "Phường"))
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
      console.log("🔍 Auto-searching plot:", { selectedPhuong, soTo, soThua });

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

    console.log(
      "🎨 Rendering selected plot:",
      selectedPlot.so_to,
      selectedPlot.so_thua
    );

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
      console.log(`🎨 Rendering ${landUseData.length} plots`);

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
      {error && (
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
      )}

      <div style={containerStyle}>
        <LoadingOverlay isLoading={isLoading} />
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={containerStyle}
          zoomControl={false}
          maxZoom={22}
          minZoom={20}
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
