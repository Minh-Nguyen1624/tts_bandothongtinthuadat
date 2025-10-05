import React from "react";
import { FaSync } from "react-icons/fa";

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
        alignItems: "flex-start",
        marginBottom: "20px",
      }}
    >
      <h1
        style={{
          color: "#000",
          fontWeight: "bold",
          fontSize: "24px",
          margin: 0,
        }}
      >
        Danh sách thửa đất
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        {lastUpdated && <span>Cập nhật: {formatLastUpdated()}</span>}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "1px solid #007bff",
            color: "#007bff",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
          }}
          title="Làm mới dữ liệu"
        >
          <FaSync className={loading ? "spinning" : ""} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
    </div>
  );
};

export default LandPlotHeader;
