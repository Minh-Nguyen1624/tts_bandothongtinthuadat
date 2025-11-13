// Components/map/LandUsePlanningMap.jsx
import React, { useState, useEffect, useCallback } from "react";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

import { getColorByLoaiDat } from "./utils/mapUtils";
import LoadingOverlay from "./LoadingOverlay";
import UpdateMapView from "./UpdateMapView";
import MapZoomHandler from "./MapZoomHandler";
import PhuongBoundaryLayer from "./PhuongBoundaryLayer";
import SelectedPlotLayer from "./SelectedPlotLayer";
import LandPlotsLayer from "./LandPlotsLayer";
import SearchPanel from "./SearchPanel";
import MapContainerBase from "./MapContainerBase";

import {
  processGeometryData,
  convertGeoJSONToLeaflet,
} from "./utils/geometryProcessor";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const API_URL = "http://127.0.0.1:8000";

const processPlotGeometry = (plot) => {
  const results = { geometries: [], source: "none", details: [] };

  if (plot.land_use_details?.length > 0) {
    const valid = [];
    plot.land_use_details.forEach((d) => {
      let geom = d.leafletGeometry;
      if (!geom && d.geometry) {
        const g = processGeometryData(d.geometry);
        geom = g ? convertGeoJSONToLeaflet(g) : null;
      }
      if (geom) {
        valid.push({
          ...d,
          color: d.color || getColorByLoaiDat(d.ky_hieu_mdsd),
          leafletGeometry: geom,
        });
      }
    });
    if (valid.length > 0) {
      results.geometries = valid.map((d) => d.leafletGeometry);
      results.details = valid;
      results.source = "land_use_details";
      return results;
    }
  }

  if (plot.geom) {
    try {
      const g = processGeometryData(plot.geom);
      const coords = g ? convertGeoJSONToLeaflet(g) : null;
      if (coords) {
        const types = Array.isArray(plot.ky_hieu_mdsd)
          ? plot.ky_hieu_mdsd
          : [plot.ky_hieu_mdsd || "UNKNOWN"];
        const details = types.map((t) => ({
          ky_hieu_mdsd: t,
          dien_tich: plot.dien_tich || "0",
          color: getColorByLoaiDat(t),
          leafletGeometry: coords,
        }));
        results.geometries = [coords];
        results.details = details;
        results.source = "main_geom";
        return results;
      }
    } catch (e) {}
  }

  if (plot.lat && plot.lng) {
    const lat = parseFloat(plot.lat),
      lng = parseFloat(plot.lng);
    const o = 0.0001;
    const box = [
      [
        [lng - o, lat - o],
        [lng + o, lat - o],
        [lng + o, lat + o],
        [lng - o, lat + o],
        [lng - o, lat - o],
      ],
    ];
    results.geometries = [box];
    results.details = [
      {
        ky_hieu_mdsd: plot.ky_hieu_mdsd || "UNKNOWN",
        dien_tich: plot.dien_tich || "0",
        color: getColorByLoaiDat(plot.ky_hieu_mdsd || "UNKNOWN"),
        leafletGeometry: box,
      },
    ];
    results.source = "fallback";
    return results;
  }

  return null;
};

const LandUsePlanningMap = () => {
  const [soTo, setSoTo] = useState("");
  const [soThua, setSoThua] = useState("");
  const [landUseData, setLandUseData] = useState([]);
  const [allPlotsData, setAllPlotsData] = useState([]);
  const [mapCenter, setMapCenter] = useState([10.367, 106.345]);
  const [searchCenter, setSearchCenter] = useState([10.367, 106.345]);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldUpdateView, setShouldUpdateView] = useState(false);
  const [phuongBoundary, setPhuongBoundary] = useState(null);
  const [selectedPhuong, setSelectedPhuong] = useState("");
  const [phuongList, setPhuongList] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plotBoundary, setPlotBoundary] = useState(null);
  const token = localStorage.getItem("token");

  // LOG TÊN PHƯỜNG CHÍNH XÁC
  useEffect(() => {
    if (allPlotsData.length > 0) {
      console.clear();
      console.log("PHƯỜNG TRONG DB:");
      const names = [...new Set(allPlotsData.map((p) => p.phuong_xa))].sort();
      names.forEach((n) => console.log(`DB: "${n}"`));
      console.log("DROPDOWN:");
      phuongList.forEach((p) => console.log(`DD: "${p.ten_phuong_xa}"`));
    }
  }, [allPlotsData, phuongList]);

  const fetchPhuongList = useCallback(async () => {
    try {
      if (!token) return;
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/land_plots/phuong-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setPhuongList(res.data.data);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchAllPlots = useCallback(async () => {
    try {
      if (!token) return;
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/land_plots`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      if (res.data.success) {
        const processed = res.data.data
          .map((plot) => {
            const r = processPlotGeometry(plot);
            if (!r) return null;
            return { ...plot, geom: r.geometries, land_use_details: r.details };
          })
          .filter(Boolean);
        setAllPlotsData(processed);
        setLandUseData(processed);
        setError(`Tải ${processed.length} lô`);
      }
    } catch (e) {
      setError("Lỗi tải");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPhuongList();
    fetchAllPlots();
  }, [fetchPhuongList, fetchAllPlots]);

  const fetchPhuongBoundary = useCallback(
    async (name) => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${API_URL}/api/land_plots/phuong-boundary`,
          {
            params: { ten_phuong_xa: name },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          const coords = convertGeoJSONToLeaflet(res.data.boundary);
          setPhuongBoundary({ coordinates: coords, name });
          const flat = coords.flat(3).filter((c) => c.length === 2);
          if (flat.length > 0) {
            const lat = flat.reduce((s, c) => s + c[0], 0) / flat.length;
            const lng = flat.reduce((s, c) => s + c[1], 0) / flat.length;
            setSearchCenter([lat, lng]);
            setMapCenter([lat, lng]);
            setShouldUpdateView(true);
            setZoomLevel(14);
          }
        }
      } catch (e) {
        setError("Lỗi ranh giới");
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  // SO SÁNH TRỰC TIẾP – KHÔNG DÙNG normalize
  const handlePhuongXaChange = useCallback(
    (e) => {
      const val = e.target.value;
      setSelectedPhuong(val);
      setSelectedPlot(null);
      setPlotBoundary(null);
      setSoTo("");
      setSoThua("");

      if (val) {
        fetchPhuongBoundary(val);

        // TÌM CHÍNH XÁC TRONG allPlotsData
        const filtered = allPlotsData.filter((p) => p.phuong_xa === val);

        if (filtered.length > 0) {
          setLandUseData(filtered);
          setError(`Hiển thị ${filtered.length} lô tại "${val}"`);
        } else {
          setLandUseData(allPlotsData);
          setError(`Không có lô tại "${val}" → hiển thị tất cả`);
        }
      } else {
        setPhuongBoundary(null);
        setMapCenter([10.367, 106.345]);
        setZoomLevel(12);
        setShouldUpdateView(true);
        setLandUseData(allPlotsData);
        setError(null);
      }
    },
    [fetchPhuongBoundary, allPlotsData]
  );

  const fetchPlotByNumber = useCallback(
    (phuong, to, thua) => {
      const plot = allPlotsData.find(
        (p) =>
          String(p.so_to) === String(to) &&
          String(p.so_thua) === String(thua) &&
          p.phuong_xa === phuong
      );
      if (plot) {
        setSelectedPlot(plot);
        setPlotBoundary(plot.geom);
        setError(`Tìm thấy: ${to}/${thua}`);
      } else {
        setError(`Không tìm thấy lô ${to}/${thua}`);
      }
    },
    [allPlotsData]
  );

  const handleSearch = () => {
    if (!selectedPhuong) return setError("Chọn phường");
    if (soTo && soThua) fetchPlotByNumber(selectedPhuong, soTo, soThua);
  };

  useEffect(() => {
    if (selectedPhuong && soTo && soThua) {
      const t = setTimeout(
        () => fetchPlotByNumber(selectedPhuong, soTo, soThua),
        800
      );
      return () => clearTimeout(t);
    }
  }, [selectedPhuong, soTo, soThua, fetchPlotByNumber]);

  useEffect(() => {
    if (shouldUpdateView) {
      const t = setTimeout(() => setShouldUpdateView(false), 1000);
      return () => clearTimeout(t);
    }
  }, [shouldUpdateView]);

  return (
    <>
      <div className="title">
        <span>Bản đồ quy hoạch sử dụng đất</span>
      </div>
      <SearchPanel
        selectedPhuong={selectedPhuong}
        soTo={soTo}
        soThua={soThua}
        phuongList={phuongList}
        isLoading={isLoading}
        onPhuongChange={handlePhuongXaChange}
        onSoToChange={(e) => setSoTo(e.target.value)}
        onSoThuaChange={(e) => setSoThua(e.target.value)}
        onSearch={handleSearch}
      />
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 120px)",
          position: "fixed",
        }}
      >
        <LoadingOverlay isLoading={isLoading} />
        <MapContainerBase center={mapCenter} zoom={zoomLevel}>
          <UpdateMapView
            center={searchCenter}
            zoom={zoomLevel}
            shouldUpdate={shouldUpdateView}
          />
          <MapZoomHandler setZoomLevel={setZoomLevel} />
          <PhuongBoundaryLayer phuongBoundary={phuongBoundary} />
          <SelectedPlotLayer
            selectedPlot={selectedPlot}
            plotBoundary={plotBoundary}
          />
          <LandPlotsLayer
            landUseData={landUseData}
            zoomLevel={zoomLevel}
            isLoading={isLoading}
          />
        </MapContainerBase>
      </div>
    </>
  );
};

export default LandUsePlanningMap;
