import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Login.css";

const API_URL = "http://127.0.0.1:8000";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  console.log("formData:", formData);

  const navigate = useNavigate();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setShowResend(false);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, formData, {
        headers: { "x-client-type": "frontend" },
      });

      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", user.role || "user");

      // Cập nhật trạng thái App
      onLogin(user);

      // Redirect dựa theo role
      navigate(user.role === "admin" ? "/dashboard" : "/");
    } catch (error) {
      console.error(
        "Lỗi đăng nhập:",
        error.response ? error.response.data : error.message
      );

      if (error.response) {
        const message =
          error.response.data.message || "Email hoặc mật khẩu không đúng.";
        setErrors({ general: message });
        if (message.includes("xác minh")) setShowResend(true);
      } else {
        setErrors({ general: "Lỗi mạng. Vui lòng thử lại." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Đăng Nhập</h2>
        {errors.general && <p className="error-message">{errors.general}</p>}

        <div className="form-input">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Nhập email"
            autoComplete="email"
            required
          />
        </div>

        <div className="form-input password-input">
          <label htmlFor="password">Mật khẩu</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? <span className="spinner"></span> : "Đăng Nhập"}
        </button>

        {/* {showResend && (
          <button
            type="button"
            className="resend-btn"
            onClick={() =>
              alert("Chức năng gửi lại email chưa được triển khai.")
            }
            disabled={isLoading}
          >
            Gửi lại email xác minh
          </button>
        )} */}
      </form>
    </div>
  );
};

export default Login;
