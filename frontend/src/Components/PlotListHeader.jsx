import React from "react";
import { FaSync, FaList } from "react-icons/fa";

const PlotListHeader = ({ lastUpdated, loading, onRefresh }) => {
  return (
    <div className="plotlist-header">
      <div className="header-title">
        <FaList className="title-icon" />
        <h1>Quản Lý Danh Sách Thửa Đất</h1>
      </div>
      <div className="header-actions">
        {lastUpdated && (
          <div className="last-updated">
            Cập nhật: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading}
          title="Làm mới dữ liệu"
        >
          <FaSync className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>
    </div>
  );
};

export default PlotListHeader;
