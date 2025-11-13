import { useState } from "react";
import { Link } from "react-router-dom";

function Header({ isAuthenticated, user, handleLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav
      style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderBottom: "1px solid #dee2e6",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#007bff",
            fontWeight: "bold",
            fontSize: "20px",
          }}
        >
          Home
        </Link>

        <Link
          to="/land-use-planning-map"
          style={{
            textDecoration: "none",
            color: "#28a745",
            fontWeight: "bold",
          }}
        >
          Bản đồ quy hoạch sử dụng đất
        </Link>

        {isAuthenticated && user?.role === "admin" && (
          <>
            <Link
              to="/dashboard"
              style={{
                textDecoration: "none",
                color: "#28a745",
                fontWeight: "bold",
              }}
            >
              Dashboard
            </Link>

            <Link
              to="/land-plot-management"
              style={{
                textDecoration: "none",
                color: "#FFCC00",
                fontWeight: "bold",
              }}
            >
              Quản lý thửa đất
            </Link>

            <Link
              to="/plot-list"
              style={{
                textDecoration: "none",
                color: "#FFCC00",
                fontWeight: "bold",
              }}
            >
              Quản lý lô đất
            </Link>
          </>
        )}
      </div>

      {isAuthenticated ? (
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontWeight: "bold", color: "#333" }}>
            {user?.name || user?.email}
            {user?.role === "admin" && (
              <span
                style={{
                  marginLeft: "8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                ADMIN
              </span>
            )}
          </span>

          <img
            src={user?.avatar || "https://via.placeholder.com/40"}
            alt="Avatar"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              border: "2px solid #007bff",
            }}
            onClick={() => setShowMenu(!showMenu)}
          />

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: "60px",
                right: 0,
                background: "#fff",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                borderRadius: "8px",
                zIndex: 100,
                minWidth: "150px",
                overflow: "hidden",
                border: "1px solid #ddd",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #eee",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <strong>{user?.name || user?.email}</strong>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Role: {user?.role}
                </div>
              </div>
              {user?.role === "admin" && (
                <Link
                  to="/dashboard"
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    textDecoration: "none",
                    color: "#333",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "#dc3545",
                  fontWeight: "bold",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Login
          </button>
        </Link>
      )}
    </nav>
  );
}

export default Header;
