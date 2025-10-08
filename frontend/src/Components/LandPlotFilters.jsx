import React from "react";
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      {/* Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          //   flexWrap: "wrap",
          flexFlow: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            style={{
              fontSize: "14px",
              color: "#000",
              padding: "6px 12px",
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <FaFilter /> Bộ lọc
          </button>

          <select
            value={phuongXa}
            onChange={(e) => onPhuongXaChange(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: "white",
              minWidth: "150px",
              fontSize: "14px",
              height: "34px",
            }}
          >
            <option value="">Phường/xã</option>
            {phuongXaOptions.map((px) => (
              <option key={px} value={px}>
                {px}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "#000",
            position: "relative",
            right: "32px",
          }}
        >
          <span>Hiển thị:</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(parseInt(e.target.value))}
            style={{
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              height: "28px",
            }}
          >
            {[10, 20, 30, 40, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>mục/trang</span>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "end",
          gap: "10px",
          flexFlow: "column",
        }}
      >
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

        <button
          onClick={onOpenAddModal}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "1px solid #007bff",
            background: "#007bff",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <FaPlusCircle />
        </button>

        {/* Search Box */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              padding: "6px 35px 6px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              height: "34px",
              width: "250px",
              transition: "border-color 0.2s",
              textTransform: "none",
            }}
            placeholder="Tìm kiếm"
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
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
            <FaSearch style={{ color: "#666", fontSize: "14px" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandPlotFilters;
