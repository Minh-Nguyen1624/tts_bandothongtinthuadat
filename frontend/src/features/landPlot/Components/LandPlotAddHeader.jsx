import React from "react";
import { FaTimes } from "react-icons/fa";

const LandPlotAddHeader = ({ onClose, loading }) => (
  <div
    className="blue-modal-header"
    style={{ display: "flex", color: "white" }}
  >
    <h2 className="blue-modal-title" style={{ color: "white" }}>
      Thêm Thửa Đất Mới
    </h2>
    <button
      onClick={onClose}
      className="blue-close-button"
      aria-label="Đóng"
      disabled={loading}
    >
      <FaTimes />
    </button>
  </div>
);

export default LandPlotAddHeader;
