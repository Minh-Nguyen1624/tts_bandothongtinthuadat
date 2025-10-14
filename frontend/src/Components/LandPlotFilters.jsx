import { FaFilter, FaPlusCircle, FaSearch, FaFileExcel } from "react-icons/fa";

const LandPlotFilters = ({
  search,
  phuongXa,
  perPage,
  phuongXaOptions,
  onSearchChange,
  onPhuongXaChange,
  onPerPageChange,
  onClearSearch,
  onOpenAddModal,
  onExportExcel,
  exporting,
}) => {
  return (
    <div className="plotlist-filters">
      {/* Left side - Filters and pagination */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        {/* Filter row */}
        <div className="filters-left">
          <div className="search-container" style={{ position: "relative" }}>
            <FaSearch className="search-icon" />
            <input
              className="search-input"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm"
            />
            <div
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {search && (
                <button
                  onClick={onClearSearch}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "2px",
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <select
            value={phuongXa}
            onChange={(e) => onPhuongXaChange(e.target.value)}
            className="filter-select"
          >
            <option value="">Phường/xã</option>
            {phuongXaOptions.map((px) => (
              <option key={px} value={px}>
                {px}
              </option>
            ))}
          </select>

          {/* Pagination row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#000",
            }}
          >
            <span
              style={{
                fontSize: "0.875em",
                fontWeight: "500",
                marginRight: "10px",
              }}
            >
              Hiển thị:
            </span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(parseInt(e.target.value))}
              className="filter-select"
            >
              {[10, 20, 30, 40, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: "0.875em",
                fontWeight: "500",
                marginRight: "10px",
              }}
            >
              mục/trang
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Search and actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
        }}
      >
        {/* Action buttons */}
        <div className="filters-right" style={{ display: "flex", gap: "8px" }}>
          <button onClick={onOpenAddModal} className="add-button">
            <FaPlusCircle />
            Thêm Thửa Đất
          </button>

          <button
            onClick={onExportExcel}
            disabled={exporting}
            className="btn-excel"
            title="Xuất file Excel"
          >
            {exporting ? (
              <>
                <div className="button-loading-spinner"></div>
                Đang xuất...
              </>
            ) : (
              <>
                <FaFileExcel />
                Xuất Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandPlotFilters;
