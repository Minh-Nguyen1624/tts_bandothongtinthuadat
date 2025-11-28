import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Header({ isAuthenticated, user, handleLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  // Màu sắc chủ đạo
  const colors = {
    primary: "#2563eb", // Xanh chủ đạo
    primaryDark: "#1d4ed8", // Xanh đậm
    background: "#ffffff", // Nền trắng
    text: "#1f2937", // Chữ đậm
    textLight: "#6b7280", // Chữ nhạt
    border: "#e5e7eb", // Viền
    hover: "#f3f4f6", // Hover
  };

  const isActiveTab = (path) => {
    return location.pathname === path;
  };

  const activeStyle = {
    backgroundColor: colors.primary,
    color: "#ffffff",
    borderRadius: "8px",
  };

  const baseTabStyle = {
    textDecoration: "none",
    fontWeight: "600",
    padding: "10px 16px",
    borderRadius: "8px",
    color: colors.text,
    transition: "all 0.2s ease-in-out",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
  };

  return (
    <nav
      style={{
        padding: "0 24px",
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: "64px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Logo và Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            ...baseTabStyle,
            fontSize: "18px",
            fontWeight: "bold",
            color: colors.primary,
            marginRight: "16px",
            padding: "8px 12px",
          }}
        >
          {/* LandPlan */}
          MapLand
        </Link>

        {/* Navigation Items */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Link
            to="/land-use-planning-map"
            style={{
              ...baseTabStyle,
              ...(isActiveTab("/land-use-planning-map") && activeStyle),
            }}
            onMouseEnter={(e) => {
              if (!isActiveTab("/land-use-planning-map")) {
                e.target.style.backgroundColor = colors.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActiveTab("/land-use-planning-map")) {
                e.target.style.backgroundColor = "transparent";
              }
            }}
          >
            Bản đồ quy hoạch
          </Link>

          {isAuthenticated && user?.role === "admin" && (
            <>
              <Link
                to="/dashboard"
                style={{
                  ...baseTabStyle,
                  ...(isActiveTab("/dashboard") && activeStyle),
                }}
                onMouseEnter={(e) => {
                  if (!isActiveTab("/dashboard")) {
                    e.target.style.backgroundColor = colors.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveTab("/dashboard")) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                Dashboard
              </Link>

              <Link
                to="/land-plot-management"
                style={{
                  ...baseTabStyle,
                  ...(isActiveTab("/land-plot-management") && activeStyle),
                }}
                onMouseEnter={(e) => {
                  if (!isActiveTab("/land-plot-management")) {
                    e.target.style.backgroundColor = colors.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveTab("/land-plot-management")) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                Quản lý thửa đất
              </Link>

              <Link
                to="/plot-list"
                style={{
                  ...baseTabStyle,
                  ...(isActiveTab("/plot-list") && activeStyle),
                }}
                onMouseEnter={(e) => {
                  if (!isActiveTab("/plot-list")) {
                    e.target.style.backgroundColor = colors.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveTab("/plot-list")) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                Quản lý lô đất
              </Link>
            </>
          )}
        </div>
      </div>

      {/* User Section */}
      {isAuthenticated ? (
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* User Info */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: "600",
                color: colors.text,
                fontSize: "14px",
              }}
            >
              {user?.name || user?.email}
            </div>
            <div style={{ fontSize: "12px", color: colors.textLight }}>
              {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
            </div>
          </div>

          {/* Avatar */}
          <div
            style={{
              position: "relative",
              cursor: "pointer",
              border: `2px solid ${
                isActiveTab("/profile") ? colors.primary : colors.border
              }`,
              borderRadius: "50%",
              padding: "2px",
              transition: "all 0.2s ease",
            }}
            onClick={() => setShowMenu(!showMenu)}
          >
            <img
              src={user?.avatar || "https://via.placeholder.com/40"}
              alt="Avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "block",
              }}
            />
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "52px",
                right: 0,
                background: colors.background,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                borderRadius: "12px",
                zIndex: 1000,
                minWidth: "200px",
                overflow: "hidden",
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* User Header in Dropdown */}
              <div
                style={{
                  padding: "16px",
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: colors.hover,
                }}
              >
                <div style={{ fontWeight: "600", color: colors.text }}>
                  {user?.name || user?.email}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: colors.textLight,
                    marginTop: "4px",
                  }}
                >
                  {user?.email}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    marginTop: "4px",
                    backgroundColor:
                      user?.role === "admin"
                        ? colors.primary
                        : colors.textLight,
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  {user?.role === "admin" ? "ADMIN" : "USER"}
                </div>
              </div>

              {/* Menu Items */}
              {user?.role === "admin" && (
                <Link
                  to="/dashboard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    textDecoration: "none",
                    color: colors.text,
                    borderBottom: `1px solid ${colors.border}`,
                    fontSize: "14px",
                    ...(isActiveTab("/dashboard") && {
                      backgroundColor: colors.primary,
                      color: "white",
                    }),
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  Dashboard
                </Link>
              )}

              <Link
                to="/profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  textDecoration: "none",
                  color: colors.text,
                  borderBottom: `1px solid ${colors.border}`,
                  fontSize: "14px",
                  ...(isActiveTab("/profile") && {
                    backgroundColor: colors.primary,
                    color: "white",
                  }),
                }}
                onClick={() => setShowMenu(false)}
              >
                Hồ sơ
              </Link>

              <button
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "#dc2626",
                  fontWeight: "500",
                  fontSize: "14px",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              ...(isActiveTab("/login") && {
                backgroundColor: colors.primaryDark,
                transform: "scale(1.02)",
              }),
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.primaryDark;
              e.target.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isActiveTab("/login")
                ? colors.primaryDark
                : colors.primary;
              e.target.style.transform = isActiveTab("/login")
                ? "scale(1.02)"
                : "scale(1)";
            }}
          >
            Đăng nhập
          </button>
        </Link>
      )}
    </nav>
  );
}

export default Header;
