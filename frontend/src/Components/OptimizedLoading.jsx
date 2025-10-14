import React from "react";

const OptimizedLoading = ({ type = "table", message, size = "medium" }) => {
  const skeletonConfig = {
    table: { rows: 5, height: "50px" },
    map: { rows: 1, height: "400px" },
    form: { rows: 3, height: "60px" },
    card: { rows: 2, height: "100px" },
  };

  const sizeConfig = {
    small: { width: "100%", height: "100px" },
    medium: { width: "100%", height: "200px" },
    large: { width: "100%", height: "400px" },
  };

  const config = skeletonConfig[type] || skeletonConfig.table;
  const sizeStyle = sizeConfig[size] || sizeConfig.medium;

  return (
    <div
      className="optimized-loading"
      role="status"
      aria-live="polite"
      style={sizeStyle}
    >
      <div className="skeleton-container">
        {Array.from({ length: config.rows }, (_, index) => (
          <div
            key={index}
            className="skeleton-item"
            style={{ height: config.height }}
            aria-hidden="true"
          >
            <div className="skeleton-shimmer"></div>
          </div>
        ))}
      </div>
      {message && (
        <p className="loading-message" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
};

const LoadingOverlay = ({ loading, searching }) => {
  if (!loading && !searching) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-content">
        <div className="spinner-container">
          <div className="optimized-spinner" aria-label="Đang tải">
            <div className="spinner-circle"></div>
          </div>
        </div>
        <div className="loading-text">
          <p>{searching ? "Đang tìm kiếm..." : "Đang tải dữ liệu..."}</p>
          <p className="loading-subtext">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
export { OptimizedLoading };
