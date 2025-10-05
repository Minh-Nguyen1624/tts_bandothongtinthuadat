import React from "react";

const LoadingOverlay = ({ loading, searching }) => {
  if (!loading && !searching) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(255, 255, 255, 0.9)",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div className="spinner"></div>
      <span>{searching ? "Đang tìm kiếm..." : "Đang tải dữ liệu..."}</span>
    </div>
  );
};

export default LoadingOverlay;
