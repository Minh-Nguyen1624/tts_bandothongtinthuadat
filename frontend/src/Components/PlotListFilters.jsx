import React from "react";
import { FaSearch, FaPlus, FaTimes, FaFileExcel } from "react-icons/fa";

const PlotListFilters = ({
  search,
  xa,
  perPage,
  xaOptions,
  onSearchChange,
  onXaChange,
  onPerPageChange,
  onClearSearch,
  onOpenModal,
  onExportExcel,
  onExportExcelAxios,
  exporting,
}) => {
  return (
    <div className="plotlist-filters">
      <div className="filters-left">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên tổ chức, địa chỉ, xã, số tờ, số thửa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {search && (
            <button
              onClick={onClearSearch}
              className="clear-search-button"
              title="Xóa tìm kiếm"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <select
          value={xa}
          onChange={(e) => onXaChange(e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả Xã</option>
          {xaOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="filter-select"
        >
          <option value={10}>10 bản ghi/trang</option>
          <option value={25}>25 bản ghi/trang</option>
          <option value={50}>50 bản ghi/trang</option>
          <option value={100}>100 bản ghi/trang</option>
        </select>
      </div>

      <div className="filters-right">
        <button
          className="add-button"
          onClick={() => onOpenModal()} // QUAN TRỌNG: Không truyền tham số
        >
          <FaPlus className="button-icon" />
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
              <FaFileExcel className="button-icon" />
              Xuất Excel
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlotListFilters;
