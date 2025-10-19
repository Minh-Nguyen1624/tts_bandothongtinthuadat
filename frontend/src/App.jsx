import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Components/Login.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import HomePage from "./Components/HomePage.jsx";
import Header from "./Components/Header.jsx";
import LandPlotManagement from "./Components/LandPlotManagement.jsx";
import PlotList from "./Components/PlotList.jsx";
import LandUsePlanningMap from "./Components/LandUsePlanningMap.jsx";

// Route bảo vệ
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Component điều hướng auth
const AuthHandler = () => {
  const token = localStorage.getItem("token");
  const pathname = window.location.pathname;

  // Nếu đã login mà vào /login -> redirect dashboard
  if (token && pathname === "/login") {
    return <Navigate to="/dashboard" replace />;
  }
  return null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  // Cập nhật trạng thái khi localStorage thay đổi
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      setIsAuthenticated(!!token);
      setUser(userData ? JSON.parse(userData) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        handleLogout={handleLogout}
      />

      <AuthHandler />

      <Routes>
        <Route
          path="/"
          element={<HomePage isAuthenticated={isAuthenticated} user={user} />}
        />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/land-use-planning-map"
          element={
            <ProtectedRoute>
              <LandUsePlanningMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/land-plot-management"
          element={
            <ProtectedRoute>
              <LandPlotManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plot-list"
          element={
            <ProtectedRoute>
              <PlotList />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
