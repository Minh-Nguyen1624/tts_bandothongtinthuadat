import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import "../css/HomePage.css";
import LandPlotHeader from "../Components/LandPlotHeader";
import LandPlotFilters from "../Components/LandPlotFilters";
import LandPlotTable from "../Components/LandPlotTable";
import LandPlotPagination from "../Components/LandPlotPagination";
import LoadingOverlay from "../Components/LoadingOverlay";
import ErrorAlert from "../Components/ErrorAlert";
import SearchStatus from "../Components/SearchStatus";
import { useDebounce } from "../hooks/useDebounce";
import LandPlotAdd from "../Components/LandPlotAdd";
import LandPlotEdit from "../Components/LandPlotEdit";

const API_URL = "http://127.0.0.1:8000";

const LandPlotManagement = () => {
  const [landPlots, setLandPlots] = useState([]);
  const [search, setSearch] = useState("");
  const [phuongXa, setPhuongXa] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Thêm state success
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Thêm state edit modal
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false); // Thêm state editing
  const [selectedPlot, setSelectedPlot] = useState(null); // Thêm state selected plot
  const [plotListOptions, setPlotListOptions] = useState([]);
  const [exporting, setExporting] = useState(false);

  const token = localStorage.getItem("token");
  const abortControllerRef = useRef(null);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Hủy request trước khi tạo request mới
  const cancelPreviousRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  // Memoize fetch function
  const fetchLandPlots = useCallback(async () => {
    if (!token) {
      setError("Vui lòng đăng nhập trước");
      return;
    }

    const signal = cancelPreviousRequest();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Fetching land plots...");
      const response = await axios.get(`${API_URL}/api/land_plots`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      const data = processApiResponse(response.data);

      setLandPlots(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      if (error.name !== "CanceledError") {
        console.error("Error fetching land plots:", error);
        setError(`Lỗi: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPlotLists = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/api/plotlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlotListOptions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching plot lists:", error);
    }
  }, [token]);

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
        `${API_URL}/api/land_plots/export/land-plots`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { search, phuong_xa: phuongXa },
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
  }, [token, search, phuongXa]);

  // Hàm thêm thửa đất mới
  const fetchLandPlotAdd = useCallback(
    async (formData) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return false;
      }

      setAdding(true);
      setError(null);
      setSuccess(null);

      try {
        console.log("Adding new land plot:", formData);
        console.log(
          "Full formData to be sent:",
          JSON.stringify(formData, null, 2)
        );

        const response = await axios.post(
          `${API_URL}/api/land_plots`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Add response:", response.data);

        if (response.data.success === false) {
          throw new Error(response.data.message);
        }

        // Thêm dữ liệu mới vào state
        const newPlot = response.data.data || response.data;
        setLandPlots((prev) => [newPlot, ...prev]);
        setShowAddModal(false);
        setSuccess("Thêm thửa đất thành công!");

        return true;
      } catch (error) {
        console.error("Error adding land plot:", error);
        console.error("Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Có lỗi xảy ra khi thêm thửa đất";
        setError(`Lỗi thêm thửa đất: ${errorMessage}`);
        return false;
      } finally {
        setAdding(false);
      }
    },
    [token]
  );

  // Hàm chỉnh sửa thửa đất - ĐÃ SỬA LỖI
  const fetchLandPlotEdit = useCallback(
    async (formData) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return false;
      }

      setEditing(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.put(
          `${API_URL}/api/land_plots/${formData.id}`,
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
          setLandPlots((prev) =>
            prev.map((plot) =>
              plot.id === formData.id ? response.data.data : plot
            )
          );

          setShowEditModal(false);
          setSuccess("Cập nhật thửa đất thành công!");
          return true;
        } else {
          setError(response.data.message || "Có lỗi xảy ra khi cập nhật");
          return false;
        }
      } catch (error) {
        console.error("Error updating land plot:", error);

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
        setEditing(false);
      }
    },
    [token]
  );

  // Memoize search function
  const searchLandPlots = useCallback(
    async (query) => {
      if (!token) {
        setError("Vui lòng đăng nhập trước");
        return;
      }

      if (!query.trim()) {
        fetchLandPlots();
        return;
      }

      const signal = cancelPreviousRequest();
      setSearching(true);
      setError(null);
      setSuccess(null);

      try {
        console.log("Searching for:", query);
        const response = await axios.get(`${API_URL}/api/land_plots/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            query: query,
            phuong_xa: phuongXa,
          },
          signal,
        });

        console.log("Search Response:", response.data);

        if (response.data.success === false) {
          throw new Error(response.data.message);
        }

        const data = processApiResponse(response.data);
        setLandPlots(data);
        setCurrentPage(1);
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Error fetching search:", error);
          console.log("Fallback to client-side filtering");
        }
      } finally {
        setSearching(false);
      }
    },
    [token, fetchLandPlots, phuongXa]
  );

  // Xử lý response API thống nhất
  const processApiResponse = (responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    } else if (responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    } else if (responseData && responseData.data) {
      return [responseData.data];
    } else {
      return responseData || [];
    }
  };

  // Xử lý search với debounce
  useEffect(() => {
    if (debouncedSearch.trim()) {
      searchLandPlots(debouncedSearch);
    } else {
      fetchLandPlots();
    }
  }, [debouncedSearch, searchLandPlots, fetchLandPlots]);

  // Fetch data khi component mount
  useEffect(() => {
    fetchLandPlots();
    fetchPlotLists(); // Thêm dòng này
  }, [fetchLandPlots, fetchPlotLists]);

  // Xử lý khi phường/xã thay đổi
  useEffect(() => {
    if (search.trim()) {
      searchLandPlots(search);
    } else if (phuongXa) {
      setCurrentPage(1);
    }
  }, [phuongXa, search, searchLandPlots]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize filtered data
  const filteredData = useMemo(() => {
    return landPlots.filter((plot) => {
      const matchesPhuongXa = phuongXa === "" || plot.phuong_xa === phuongXa;

      if (searching || debouncedSearch.trim()) {
        return matchesPhuongXa;
      }

      if (!search.trim()) return matchesPhuongXa;

      const searchLower = search.toLowerCase();
      return (
        matchesPhuongXa &&
        ((plot.ten_chu || "").toLowerCase().includes(searchLower) ||
          (plot.so_to?.toString() || "").includes(search) ||
          (plot.so_thua?.toString() || "").includes(search) ||
          (plot.ky_hieu_mdsd || "").toLowerCase().includes(searchLower) ||
          (plot.phuong_xa || "").toLowerCase().includes(searchLower))
      );
    });
  }, [landPlots, phuongXa, search, searching, debouncedSearch]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalItems);
    const currentData = filteredData.slice(startIndex, endIndex);

    return { totalItems, totalPages, startIndex, endIndex, currentData };
  }, [filteredData, perPage, currentPage]);

  const { totalItems, totalPages, startIndex, endIndex, currentData } =
    paginationData;

  // Memoize phuongXa options
  const phuongXaOptions = useMemo(() => {
    const options = [
      ...new Set(landPlots.map((plot) => plot.phuong_xa).filter(Boolean)),
    ];
    return options.sort((a, b) =>
      a.localeCompare(b, "vi", { sensitivity: "base" })
    );
  }, [landPlots]);

  // Xử lý refresh manual
  const handleRefresh = () => {
    setSearch("");
    setPhuongXa("");
    setCurrentPage(1);
    setError(null);
    setSuccess(null);
    fetchLandPlots();
  };

  // Xử lý retry khi có lỗi
  const handleRetry = () => {
    setError(null);
    setSuccess(null);
    fetchLandPlots();
  };

  // Xử lý clear search
  const handleClearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  // Xử lý search change
  const handleSearchChange = (value) => {
    setSearch(value);
  };

  // Xử lý phuongXa change
  const handlePhuongXaChange = (value) => {
    setPhuongXa(value);
    setCurrentPage(1);
  };

  // Xử lý perPage change
  const handlePerPageChange = (value) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  // Xử lý mở modal thêm mới
  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };

  // Xử lý đóng modal thêm mới
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  // Xử lý mở modal chỉnh sửa
  const handleOpenEditModal = (plot) => {
    setSelectedPlot(plot);
    setShowEditModal(true);
  };

  // Xử lý đóng modal chỉnh sửa
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedPlot(null);
  };

  // Xử lý submit form thêm mới
  const handleAddSubmit = async (formData) => {
    const success = await fetchLandPlotAdd(formData);
    return success;
  };

  // Xử lý submit form chỉnh sửa
  const handleEditSubmit = async (formData) => {
    const success = await fetchLandPlotEdit(formData);
    return success;
  };

  const handlePlotUpdated = useCallback((updatedPlot) => {
    // Cập nhật danh sách với dữ liệu mới
    setLandPlots((prev) =>
      prev.map((plot) => (plot.id === updatedPlot.id ? updatedPlot : plot))
    );
  }, []);

  // Xử lý xóa thửa đất
  const handleDeletePlot = useCallback(
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
        const response = await axios.delete(
          `${API_URL}/api/land_plots/${plotId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Xóa khỏi state
          setLandPlots((prev) => prev.filter((plot) => plot.id !== plotId));
          setSuccess("Xóa thửa đất thành công!");
          return true;
        } else {
          setError(response.data.message || "Có lỗi xảy ra khi xóa");
          return false;
        }
      } catch (error) {
        console.error("Error deleting land plot:", error);
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

  // Auto clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <LandPlotHeader
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* Success Alert */}
      {success && <div className="success-alert">{success}</div>}

      {/* Error Alert */}
      <ErrorAlert error={error} onRetry={handleRetry} />

      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} searching={searching} />

      {/* Filters */}
      <LandPlotFilters
        search={search}
        phuongXa={phuongXa}
        perPage={perPage}
        phuongXaOptions={phuongXaOptions}
        onSearchChange={handleSearchChange}
        onPhuongXaChange={handlePhuongXaChange}
        onPerPageChange={handlePerPageChange}
        onClearSearch={handleClearSearch}
        onOpenAddModal={handleOpenAddModal}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />

      {/* Search Status */}
      <SearchStatus
        search={search}
        phuongXa={phuongXa}
        resultCount={filteredData.length}
      />

      {/* Data Table */}
      <LandPlotTable
        data={currentData}
        startIndex={startIndex}
        onPlotUpdated={handlePlotUpdated} // Truyền callback này
        loading={loading}
        searching={searching}
        search={search}
        onEditPlot={handleOpenEditModal}
        onDeletePlot={handleDeletePlot}
      />

      {/* Pagination */}
      <LandPlotPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        visibleDataCount={currentData.length}
        onPageChange={setCurrentPage}
      />

      {/* Add Modal */}
      <LandPlotAdd
        show={showAddModal}
        onClose={handleCloseAddModal}
        onSubmit={handleAddSubmit}
        loading={adding}
        phuongXaOptions={phuongXaOptions}
        plotListOptions={plotListOptions} // Thêm dòng này
      />

      {/* Edit Modal */}
      <LandPlotEdit
        show={showEditModal}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        loading={editing}
        phuongXaOptions={phuongXaOptions}
        plotListOptions={plotListOptions} // Thêm dòng này
        plotData={selectedPlot}
        token={token}
      />
    </div>
  );
};

export default LandPlotManagement;
