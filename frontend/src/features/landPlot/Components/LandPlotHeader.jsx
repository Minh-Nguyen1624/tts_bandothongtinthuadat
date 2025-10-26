import React from "react";
import { FaTimes } from "react-icons/fa";

const LandPlotHeader = ({ plotData, formStatus, handleClose, isLoading }) => (
  <div className="blue-modal-header" style={{ maxWidth: "100%" }}>
    <div
      className="header-content"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div className="title-section">
        <div>
          <h2
            className="blue-modal-title"
            style={{ color: "white", paddingBottom: "5px" }}
          >
            Chỉnh Sửa Thửa Đất
          </h2>
          <p className="modal-subtitle">
            Cập nhật thông tin thửa đất số {plotData?.so_thua || ""} tờ{" "}
            {plotData?.so_to || ""}
          </p>
        </div>
      </div>
      <div className="header-actions">
        <div className="progress-indicator">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${formStatus.progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {formStatus.filledFields}/{formStatus.totalFields}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="blue-close-button"
          aria-label="Đóng"
          disabled={isLoading}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  </div>
);

export default LandPlotHeader;
