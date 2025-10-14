import React from "react";
import "../css/SkeletonLoading.css";

const TableLoadingSkeleton = ({ rowCount = 5 }) => {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-header"></div>
      <div className="skeleton-filter"></div>
      <div className="skeleton-filter"></div>
      {Array.from({ length: rowCount }).map((_, index) => (
        <div key={index} className="skeleton-row"></div>
      ))}
    </div>
  );
};

export default TableLoadingSkeleton;
