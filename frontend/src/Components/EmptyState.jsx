import React from "react";
import "../css/HomePage.css";

const EmptyState = ({ message, subMessage }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <h3 className="empty-title">Không có dữ liệu</h3>
      <p className="empty-message">
        {message || "Hãy thêm dữ liệu mới để bắt đầu"}
      </p>
      {subMessage && <p className="empty-submessage">{subMessage}</p>}
    </div>
  );
};

export default EmptyState;
