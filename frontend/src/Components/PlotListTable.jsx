import React, { memo, useState, useEffect } from "react";
import { FaEdit, FaTrash, FaBuilding, FaMap, FaRuler } from "react-icons/fa";
// import "../css/PlotListTable.css";

const PlotListTable = memo(
  ({
    data,
    error,
    startIndex,
    loading,
    searching,
    search,
    onEditPlot,
    onDeletePlot,
    onViewDetail,
  }) => {
    const [visibleData, setVisibleData] = useState([]);

    // Virtual scroll optimization for large datasets
    useEffect(() => {
      setVisibleData(data);
    }, [data]);

    const handleRowClick = (plot, event) => {
      if (!event.target.closest(".action-buttons")) {
        onViewDetail(plot);
      }
    };

    if (loading && !searching) {
      return (
        <div className="table-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <p>
            {search
              ? "Không tìm thấy kết quả phù hợp với tìm kiếm của bạn"
              : "Chưa có dữ liệu thửa đất"}
          </p>
          {search && (
            <button
              className="clear-search-btn"
              onClick={() => window.location.reload()}
            >
              Hiển thị tất cả
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="plotlist-table-container">
        <table className="plotlist-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tổ Chức</th>
              <th>Số Tờ</th>
              <th>Số Thửa</th>
              <th>Địa Chỉ</th>
              <th>Xã</th>
              <th>Diện Tích (m²)</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((plot, index) => (
              <tr
                key={`${plot.id}-${index}`}
                className="fade-in"
                onClick={(e) => handleRowClick(plot, e)}
              >
                <td className="index-column">{startIndex + index + 1}</td>
                <td>
                  <div className="organization-cell">
                    <FaBuilding className="cell-icon" />
                    <span className="cell-text" title={plot.organization_name}>
                      {plot.organization_name || "—"}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="number-cell">{plot.so_to || "—"}</span>
                </td>
                <td>
                  <span className="number-cell">{plot.so_thua || "—"}</span>
                </td>
                <td>
                  <div className="address-cell">
                    <FaMap className="cell-icon" />
                    <span className="cell-text" title={plot.dia_chi_thua_dat}>
                      {plot.dia_chi_thua_dat || "—"}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="text-cell">{plot.xa || "—"}</span>
                </td>
                <td>
                  <div className="area-cell">
                    <FaRuler className="cell-icon" />
                    <span className="number-cell">
                      {plot.dien_tich ? `${plot.dien_tich} m²` : "—"}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEditPlot(plot)}
                      className="edit-button"
                      title="Chỉnh sửa"
                      aria-label={`Chỉnh sửa thửa đất ${plot.so_thua}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDeletePlot(plot.id)}
                      className="delete-button"
                      title="Xóa"
                      aria-label={`Xóa thửa đất ${plot.so_thua}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

PlotListTable.displayName = "PlotListTable";

export default PlotListTable;
