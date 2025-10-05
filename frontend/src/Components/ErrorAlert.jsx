import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const ErrorAlert = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "#fff3cd",
        color: "#856404",
        border: "1px solid #ffeaa7",
        borderRadius: "4px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FaExclamationTriangle />
        <span>{error}</span>
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: "4px 12px",
          background: "#856404",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        Thử lại
      </button>
    </div>
  );
};

export default ErrorAlert;
