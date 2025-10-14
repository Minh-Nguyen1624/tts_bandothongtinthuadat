import React from "react";
import { FaSync, FaList } from "react-icons/fa";

const LandPlotHeader = ({ lastUpdated, loading, onRefresh }) => {
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    return lastUpdated.toLocaleTimeString("vi-VN");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // marginBottom: "15px",
        // padding: "0",
      }}
      className="plotlist-header"
    >
      <div className="header-title">
        <FaList className="title-icon" />
        <h1>Danh sách thửa đất</h1>
      </div>

      <div
        className="last-updated"
        style={{ display: "flex", alignItems: "center" }}
      >
        <span
          style={{
            fontSize: "0.875em",
            fontWeight: "500",
            marginRight: "10px",
          }}
        >
          Cập nhật: {formatLastUpdated()}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Làm mới dữ liệu"
          className="refresh-button"
        >
          <FaSync className={loading ? "spinning" : ""} />
          Làm mới
        </button>
      </div>
    </div>
  );
};

export default LandPlotHeader;
