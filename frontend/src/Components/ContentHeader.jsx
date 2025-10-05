import React from "react";
import "../css/HomePage.css";

const ContentHeader = ({ currentType, itemsCount }) => {
  const getTitle = () => {
    switch (currentType) {
      case "users":
        return "Danh sách người dùng";
      case "units":
        return "Danh sách đơn vị";
      case "teams":
        return "Danh sách nhóm";
      case "land_plots":
        return "Danh sách lô đất";
      case "plotlists":
        return "Danh sách plotlist";
      default:
        return "Danh sách";
    }
  };

  return (
    <div className="content-header">
      <h2>{getTitle()}</h2>
      <span className="items-count">{itemsCount} mục</span>
    </div>
  );
};

export default React.memo(ContentHeader);
