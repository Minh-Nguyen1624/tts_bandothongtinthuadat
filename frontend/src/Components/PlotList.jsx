import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
} from "react-icons/fa";
import axios from "axios";
import "../css/PlotList.css";

// Optimized Components
import PlotListHeader from "../Components/PlotListHeader";
import PlotListFilters from "../Components/PlotListFilters";
import PlotListTable from "../Components/PlotListTable";
import PlotListPagination from "../Components/PlotListPagination";
import LoadingOverlay from "../Components/LoadingOverlay";
import ErrorAlert from "../Components/ErrorAlert";
import SearchStatus from "../Components/SearchStatus";
import { useDebounce } from "../hooks/useDebounce";
import PlotModal from "../Components/PlotModal";

const API_URL = "http://127.0.0.1:8000/api";

const PlotList = () => {
  // State management với lazy initialization
  const [plots, setPlots] = useState([]);
  const [search, setSearch] = useState("");
  const [xa, setXa] = useState("");
  const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem("plotlist_perPage");
    return saved ? parseInt(saved) : 10;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [exporting, setExporting] = useState(false);

  const token = localStorage.getItem("token");
  const abortControllerRef = useRef(null);

  // Debounce search input với timing tối ưu
  const debouncedSearch = useDebounce(search, 400);

  // Hủy request trước khi tạo request mới
  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (!token) {
      setError("Vui lòng đăng nhập trước");
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.get(
        `${API_URL}/plotlists/export/plot-list`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { search, xa },
          responseType: "blob",
        }
      );

      // Tạo blob link để tải file
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      // Tự động đặt tên file nếu server có header
      let filename = `quan-ly-lo-dat-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi xuất file Excel";
      setError(`Lỗi xuất file: ${message}`);
    } finally {
      setExporting(false);
    }
  }, [token, search, xa]);

  // Fetch all plots với caching
  const fetchPlots = useCallback(
    async (forceRefresh = false) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return;
      }

      const signal = cancelPreviousRequest();
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.get(`${API_URL}/plotlists`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        const data = processApiResponse(response.data);

        setPlots(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Error fetching plots:", error);
          setError(`Lỗi: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [token, cancelPreviousRequest]
  );

  // Search plots với caching
  const searchPlots = useCallback(
    async (query) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return;
      }

      if (!query.trim()) {
        fetchPlots();
        return;
      }

      const signal = cancelPreviousRequest();
      setSearching(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.get(`${API_URL}/plotlists/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            query: query,
            xa: xa,
          },
          signal,
        });

        if (response.data.success === false) {
          throw new Error(response.data.message);
        }

        const data = processApiResponse(response.data);

        setPlots(data);
        setCurrentPage(1);
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Error fetching search:", error);
          // Fallback to client-side filtering
          handleClientSideSearch(query);
        }
      } finally {
        setSearching(false);
      }
    },
    [token, fetchPlots, xa, cancelPreviousRequest]
  );

  // Client-side search fallback
  const handleClientSideSearch = useCallback(
    (query) => {
      const filtered = plots.filter(
        (plot) =>
          (plot.organization_name || "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          (plot.so_to?.toString() || "").includes(query) ||
          (plot.so_thua?.toString() || "").includes(query) ||
          (plot.dia_chi_thua_dat || "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          (plot.xa || "").toLowerCase().includes(query.toLowerCase())
      );
      setPlots(filtered);
      setCurrentPage(1);
    },
    [plots]
  );

  // Create new plot
  const createPlot = useCallback(
    async (formData) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return false;
      }

      setModalLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.post(`${API_URL}/plotlists`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.data.success === false) {
          throw new Error(response.data.message);
        }

        // Thêm dữ liệu mới vào state
        const newPlot = response.data.data || response.data;
        setPlots((prev) => [newPlot, ...prev]);

        setShowModal(false);
        setSelectedPlot(null); // QUAN TRỌNG: Reset selectedPlot sau khi tạo thành công
        setSuccess("Thêm thửa đất thành công!");

        return true;
      } catch (error) {
        console.error("Error adding plot:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi thêm thửa đất";
        setError(`Lỗi thêm thửa đất: ${errorMessage}`);
        return false;
      } finally {
        setModalLoading(false);
      }
    },
    [token]
  );

  // Update plot
  const updatePlot = useCallback(
    async (formData) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return false;
      }

      setModalLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.put(
          `${API_URL}/plotlists/${formData.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          // Cập nhật lại danh sách
          setPlots((prev) =>
            prev.map((plot) =>
              plot.id === formData.id ? response.data.data : plot
            )
          );

          setShowModal(false);
          setSelectedPlot(null); // QUAN TRỌNG: Reset selectedPlot sau khi cập nhật thành công
          setSuccess("Cập nhật thửa đất thành công!");
          return true;
        } else {
          setError(response.data.message || "Có lỗi xảy ra khi cập nhật");
          return false;
        }
      } catch (error) {
        console.error("Error updating plot:", error);

        if (error.response) {
          const errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            "Có lỗi xảy ra khi cập nhật";
          setError(errorMessage);
        } else if (error.request) {
          setError("Không thể kết nối đến server. Vui lòng thử lại.");
        } else {
          setError("Có lỗi xảy ra: " + error.message);
        }

        return false;
      } finally {
        setModalLoading(false);
      }
    },
    [token]
  );

  // Delete plot
  const deletePlot = useCallback(
    async (plotId) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return false;
      }

      if (!window.confirm("Bạn có chắc chắn muốn xóa thửa đất này?")) {
        return false;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.delete(`${API_URL}/plotlists/${plotId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          // Xóa khỏi state
          setPlots((prev) => prev.filter((plot) => plot.id !== plotId));
          setSuccess("Xóa thửa đất thành công!");
          return true;
        } else {
          setError(response.data.message || "Có lỗi xảy ra khi xóa");
          return false;
        }
      } catch (error) {
        console.error("Error deleting plot:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi xóa";
        setError(`Lỗi xóa thửa đất: ${errorMessage}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Xử lý response API thống nhất
  const processApiResponse = useCallback((responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData && responseData.data) {
      return [responseData.data];
    } else {
      return responseData || [];
    }
  }, []);

  // Xử lý search với debounce
  useEffect(() => {
    if (debouncedSearch.trim()) {
      searchPlots(debouncedSearch);
    } else {
      fetchPlots();
    }
  }, [debouncedSearch, searchPlots, fetchPlots]);

  // Fetch data khi component mount
  useEffect(() => {
    fetchPlots();
  }, [fetchPlots]);

  // Xử lý khi xã thay đổi
  useEffect(() => {
    if (search.trim()) {
      searchPlots(search);
    } else if (xa) {
      setCurrentPage(1);
    }
  }, [xa, search, searchPlots]);

  // Lưu preferences
  useEffect(() => {
    localStorage.setItem("plotlist_perPage", perPage.toString());
  }, [perPage]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize filtered data với thuật toán tối ưu
  const filteredData = useMemo(() => {
    // Đảm bảo plots luôn là mảng
    const plotsArray = Array.isArray(plots) ? plots : [];

    if (!search.trim() && !xa) return plotsArray;

    const filtered = plotsArray.filter((plot) => {
      const matchesXa = !xa || plot.xa === xa;

      if (!search.trim()) return matchesXa;

      const searchLower = search.toLowerCase();
      return (
        matchesXa &&
        ((plot.organization_name || "").toLowerCase().includes(searchLower) ||
          (plot.so_to?.toString() || "").includes(search) ||
          (plot.so_thua?.toString() || "").includes(search) ||
          (plot.dia_chi_thua_dat || "").toLowerCase().includes(searchLower) ||
          (plot.xa || "").toLowerCase().includes(searchLower))
      );
    });

    return filtered;
  }, [plots, xa, search]);
  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalItems);

    const filterArray = Array.isArray(filteredData) ? filteredData : [];

    const currentData = filterArray.slice(startIndex, endIndex);

    return { totalItems, totalPages, startIndex, endIndex, currentData };
  }, [filteredData, perPage, currentPage]);

  const { totalItems, totalPages, startIndex, endIndex, currentData } =
    paginationData;

  // Memoize xa options
  const xaOptions = useMemo(() => {
    const plotsArray = Array.isArray(plots) ? plots : [];

    const options = [
      ...new Set(plotsArray.map((plot) => plot.xa).filter(Boolean)),
    ];
    return options.sort((a, b) =>
      a.localeCompare(b, "vi", { sensitivity: "base" })
    );
  }, [plots]);

  // Event handlers
  const handleRefresh = useCallback(() => {
    setSearch("");
    setXa("");
    setCurrentPage(1);
    setError(null);
    setSuccess(null);
    fetchPlots(true);
  }, [fetchPlots]);

  const handleRetry = useCallback(() => {
    setError(null);
    setSuccess(null);
    fetchPlots(true);
  }, [fetchPlots]);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleXaChange = useCallback((value) => {
    setXa(value);
    setCurrentPage(1);
  }, []);

  const handlePerPageChange = useCallback((value) => {
    setPerPage(value);
    setCurrentPage(1);
  }, []);

  // QUAN TRỌNG: Sửa lại hàm mở modal
  const handleOpenModal = useCallback((plot = null) => {
    setSelectedPlot(plot);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedPlot(null); // QUAN TRỌNG: Luôn reset về null khi đóng modal
  }, []);

  // Tách hàm submit riêng biệt
  const handleSubmitPlot = useCallback(
    async (formData) => {
      if (selectedPlot) {
        return await updatePlot({ ...formData, id: selectedPlot.id });
      } else {
        return await createPlot(formData);
      }
    },
    [selectedPlot, updatePlot, createPlot]
  );

  // Auto clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="plotlist-management">
      {/* Header */}
      <PlotListHeader
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* Success Alert */}
      {success && (
        <div className="success-alert slide-in">
          <FaCheckCircle className="alert-icon" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Alert */}
      <ErrorAlert error={error} onRetry={handleRetry} />

      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} searching={searching} />

      {/* Filters */}
      <PlotListFilters
        search={search}
        xa={xa}
        perPage={perPage}
        xaOptions={xaOptions}
        onSearchChange={handleSearchChange}
        onXaChange={handleXaChange}
        onPerPageChange={handlePerPageChange}
        onClearSearch={handleClearSearch}
        onOpenModal={handleOpenModal}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />

      {/* Search Status */}
      <SearchStatus
        search={search}
        xa={xa}
        resultCount={filteredData.length}
        loading={searching}
      />

      {/* Data Table */}
      <PlotListTable
        data={currentData}
        startIndex={startIndex}
        loading={loading}
        searching={searching}
        search={search}
        onEditPlot={handleOpenModal}
        onDeletePlot={deletePlot}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <PlotListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          visibleDataCount={currentData.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal - THÊM DEBUG INFO */}
      <PlotModal
        show={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPlot}
        loading={modalLoading}
        plotData={selectedPlot}
        xaOptions={xaOptions}
      />

      {/* Debug info */}
      {/* {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            zIndex: 9999,
          }}
        >
          Debug: selectedPlot ={" "}
          {selectedPlot ? `Có (ID: ${selectedPlot.id})` : "null"}
        </div>
      )} */}
    </div>
  );
};

export default React.memo(PlotList);
