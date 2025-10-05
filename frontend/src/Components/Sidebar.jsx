import React from "react";
import "../css/HomePage.css";

const Sidebar = ({ currentType, onTabChange, itemsCount, tabs }) => {
  // Memoize sidebar tabs với icons
  const sidebarTabs = tabs.map((tab) => ({
    key: tab,
    label: tab.charAt(0).toUpperCase() + tab.slice(1).replace("_", " "),
  }));

  return (
    <div className="sidebar">
      <h3>Quản lý dữ liệu</h3>
      <ul className="sidebar-tabs">
        {sidebarTabs.map((tab) => (
          <li key={tab.key}>
            <button
              onClick={() => onTabChange(tab.key)}
              className={`sidebar-button ${
                currentType === tab.key ? "active" : ""
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(Sidebar);
