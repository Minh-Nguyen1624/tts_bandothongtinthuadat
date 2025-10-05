import React from "react";
import "../css/HomePage.css";

const Badge = ({ children, type = "unit" }) => (
  <span className={`badge ${type}-badge`}>{children}</span>
);

export default Badge;
