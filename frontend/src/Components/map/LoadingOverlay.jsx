// LoadingOverlay.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const LoadingOverlay = React.memo(({ isLoading }) =>
  isLoading ? (
    <div className="loading-overlay">
      <div className="loading-content">
        <FaSpinner className="spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  ) : null
);

export default LoadingOverlay;
