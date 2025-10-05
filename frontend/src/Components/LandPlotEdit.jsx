import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import {
  FaTimes,
  FaSave,
  FaUser,
  FaMap,
  FaTag,
  FaRuler,
  FaStickyNote,
  FaEdit,
} from "react-icons/fa";
import axios from "axios";
import "../css/LandPlotEdit.css";

const API_URL = "http://127.0.0.1:8000";

const LandPlotEdit = memo(
  ({
    show,
    onClose,
    onPlotUpdated, // Nhận callback từ component cha
    loading: externalLoading,
    phuongXaOptions,
    plotData,
    token,
  }) => {
    const [formData, setFormData] = useState({
      id: "",
      ten_chu: "",
      so_to: "",
      so_thua: "",
      ky_hieu_mdsd: "",
      dien_tich: "",
      phuong_xa: "",
      ghi_chu: "",
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Reset form khi mở modal
    useEffect(() => {
      if (show && plotData) {
        setFormData({
          id: plotData.id || "",
          ten_chu: plotData.ten_chu || "",
          so_to: plotData.so_to || "",
          so_thua: plotData.so_thua || "",
          ky_hieu_mdsd: plotData.ky_hieu_mdsd || "",
          dien_tich: plotData.dien_tich || "",
          phuong_xa: plotData.phuong_xa || "",
          ghi_chu: plotData.ghi_chu || "",
        });
        setErrors({});
        setTouched({});
        setSuccess("");
        setError("");
      }
    }, [show, plotData]);

    // Validation function
    const validateForm = useCallback((data) => {
      const newErrors = {};

      if (data.ten_chu && data.ten_chu.trim().length > 100) {
        newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
      }

      if (!data.so_to || !data.so_to.toString().trim()) {
        newErrors.so_to = "Vui lòng nhập số tờ";
      } else if (isNaN(data.so_to) || parseInt(data.so_to) <= 0) {
        newErrors.so_to = "Số tờ phải là số dương";
      }

      if (!data.so_thua || !data.so_thua.toString().trim()) {
        newErrors.so_thua = "Vui lòng nhập số thửa";
      } else if (isNaN(data.so_thua) || parseInt(data.so_thua) <= 0) {
        newErrors.so_thua = "Số thửa phải là số dương";
      }

      if (!data.ky_hieu_mdsd.trim()) {
        newErrors.ky_hieu_mdsd = "Vui lòng nhập ký hiệu mục đích sử dụng";
      }

      if (!data.dien_tich || !data.dien_tich.toString().trim()) {
        newErrors.dien_tich = "Vui lòng nhập diện tích";
      } else if (
        isNaN(parseFloat(data.dien_tich.toString().replace(",", "."))) ||
        parseFloat(data.dien_tich.toString().replace(",", ".")) <= 0
      ) {
        newErrors.dien_tich = "Diện tích phải là số dương";
      }

      if (!data.phuong_xa.trim()) {
        newErrors.phuong_xa = "Vui lòng chọn phường/xã";
      }

      return newErrors;
    }, []);

    // Handle input change
    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Auto-uppercase for land use code
        if (name === "ky_hieu_mdsd") {
          processedValue = value.toUpperCase();
        }

        // Format area input
        if (name === "dien_tich") {
          processedValue = value.replace(/[^0-9.,]/g, "");
        }

        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
        }));

        // Clear error when user types
        if (errors[name]) {
          setErrors((prev) => ({
            ...prev,
            [name]: "",
          }));
        }

        // Real-time validation for touched fields
        if (touched[name]) {
          const fieldError = validateForm({ [name]: processedValue })[name];
          setErrors((prev) => ({
            ...prev,
            [name]: fieldError || "",
          }));
        }
      },
      [touched, validateForm, errors]
    );

    // Handle blur
    const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    }, []);

    // Chức năng chỉnh sửa - ĐÃ SỬA: Cập nhật và đóng modal ngay lập tức
    const fetchLandPlotEdit = useCallback(
      async (formData) => {
        if (!token) {
          setError("Vui lòng đăng nhập trước");
          return false;
        }

        try {
          setLoading(true);
          setError(null);

          const response = await axios.put(
            `${API_URL}/api/land_plots/${formData.id}`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.success) {
            setSuccess("Cập nhật thửa đất thành công!");

            // QUAN TRỌNG: Gọi callback để cập nhật component cha
            if (onPlotUpdated) {
              onPlotUpdated(response.data.data);
            }

            // Đóng modal ngay lập tức sau khi cập nhật thành công
            setTimeout(() => {
              handleClose();
            }, 1000); // Chỉ chờ 1 giây để hiển thị thông báo thành công

            return true;
          } else {
            setError(response.data.message || "Có lỗi xảy ra khi cập nhật");
            return false;
          }
        } catch (error) {
          console.error("Error updating land plot:", error);

          if (error.response) {
            const errorMessage =
              error.response.data?.message ||
              error.response.data?.error ||
              "Có lỗi xảy ra khi cập nhật";
            setError(errorMessage);

            if (error.response.status === 422 && error.response.data.errors) {
              setErrors(error.response.data.errors);
            }
          } else if (error.request) {
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
          } else {
            setError("Có lỗi xảy ra: " + error.message);
          }

          return false;
        } finally {
          setLoading(false);
        }
      },
      [token, onPlotUpdated] // Đã bỏ onClose khỏi dependencies
    );

    // Handle submit - Chức năng chỉnh sửa
    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(formData).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setTouched(allTouched);

        const newErrors = validateForm(formData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
          setError("Vui lòng kiểm tra lại thông tin");
          return;
        }

        // Chuẩn hóa dữ liệu trước khi gửi
        const submitData = {
          ...formData,
          ten_chu: formData.ten_chu.trim() || null,
          dien_tich: parseFloat(
            formData.dien_tich.toString().replace(",", ".")
          ),
          so_to: parseInt(formData.so_to),
          so_thua: parseInt(formData.so_thua),
          ghi_chu: formData.ghi_chu.trim() || null,
        };

        await fetchLandPlotEdit(submitData);
      },
      [formData, validateForm, fetchLandPlotEdit]
    );

    const handleClose = useCallback(() => {
      setFormData({
        id: "",
        ten_chu: "",
        so_to: "",
        so_thua: "",
        ky_hieu_mdsd: "",
        dien_tich: "",
        phuong_xa: "",
        ghi_chu: "",
      });
      setErrors({});
      setTouched({});
      setSuccess("");
      setError("");
      if (onClose) onClose();
    }, [onClose]);

    if (!show) return null;

    const isLoading = loading || externalLoading;

    return (
      <div className="blue-modal-overlay">
        <div className="blue-modal-content">
          {/* Header */}
          <div className="blue-modal-header">
            <h2 className="blue-modal-title">
              <FaEdit style={{ marginRight: "10px" }} />
              Chỉnh Sửa Thửa Đất
            </h2>
            <button
              onClick={handleClose}
              className="blue-close-button"
              aria-label="Đóng"
              disabled={isLoading}
            >
              <FaTimes />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="blue-land-form">
            {/* Thông báo */}
            {success && <div className="success-message">{success}</div>}

            {error && <div className="error-message">{error}</div>}

            {/* First Row - Owner and Plot Info */}
            <div className="form-row">
              <div className="form-group">
                <label className="blue-field-label">
                  <FaUser className="label-icon" />
                  Tên chủ
                </label>
                <input
                  type="text"
                  name="ten_chu"
                  value={formData.ten_chu}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập tên chủ"
                  className={`blue-input ${
                    errors.ten_chu && touched.ten_chu ? "error" : ""
                  }`}
                  disabled={isLoading}
                />
                {errors.ten_chu && touched.ten_chu && (
                  <span className="blue-error-message">{errors.ten_chu}</span>
                )}
              </div>

              <div className="form-group compact-group">
                <div className="compact-row">
                  <div className="compact-field">
                    <label className="blue-field-label">
                      <FaMap className="label-icon" />
                      Số tờ <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="number"
                      name="so_to"
                      value={formData.so_to}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Số tờ"
                      className={`blue-input compact-input ${
                        errors.so_to && touched.so_to ? "error" : ""
                      }`}
                      disabled={isLoading}
                      min="1"
                    />
                  </div>
                  <div className="compact-field">
                    <label className="blue-field-label">
                      Số thửa <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="number"
                      name="so_thua"
                      value={formData.so_thua}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Số thửa"
                      className={`blue-input compact-input ${
                        errors.so_thua && touched.so_thua ? "error" : ""
                      }`}
                      disabled={isLoading}
                      min="1"
                    />
                  </div>
                </div>
                {(errors.so_to && touched.so_to) ||
                (errors.so_thua && touched.so_thua) ? (
                  <span className="blue-error-message">
                    {errors.so_to || errors.so_thua}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Second Row - Land Use Code, Area, Ward */}
            <div className="form-row">
              <div className="form-group">
                <label className="blue-field-label">
                  <FaTag className="label-icon" />
                  Ký hiệu mục đích sử dụng{" "}
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="ky_hieu_mdsd"
                  value={formData.ky_hieu_mdsd}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="VD: ODT, CLN, ONT..."
                  className={`blue-input ${
                    errors.ky_hieu_mdsd && touched.ky_hieu_mdsd ? "error" : ""
                  }`}
                  disabled={isLoading}
                  maxLength={10}
                />
                {errors.ky_hieu_mdsd && touched.ky_hieu_mdsd && (
                  <span className="blue-error-message">
                    {errors.ky_hieu_mdsd}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="blue-field-label">
                  <FaRuler className="label-icon" />
                  Diện tích (m²) <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="dien_tich"
                  value={formData.dien_tich}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập diện tích"
                  className={`blue-input ${
                    errors.dien_tich && touched.dien_tich ? "error" : ""
                  }`}
                  disabled={isLoading}
                />
                {errors.dien_tich && touched.dien_tich && (
                  <span className="blue-error-message">{errors.dien_tich}</span>
                )}
              </div>

              <div className="form-group">
                <label className="blue-field-label">
                  <FaMap className="label-icon" />
                  Phường/Xã <span className="required-asterisk">*</span>
                </label>
                <select
                  name="phuong_xa"
                  value={formData.phuong_xa}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`blue-select ${
                    errors.phuong_xa && touched.phuong_xa ? "error" : ""
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Chọn Phường/Xã</option>
                  {phuongXaOptions.map((px) => (
                    <option key={px} value={px}>
                      {px}
                    </option>
                  ))}
                </select>
                {errors.phuong_xa && touched.phuong_xa && (
                  <span className="blue-error-message">{errors.phuong_xa}</span>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="form-row">
              <div className="form-group full-width">
                <label className="blue-field-label">
                  <FaStickyNote className="label-icon" />
                  Ghi chú
                </label>
                <textarea
                  name="ghi_chu"
                  value={formData.ghi_chu}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập ghi chú (nếu có)"
                  className="blue-textarea"
                  disabled={isLoading}
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="blue-form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="blue-cancel-button"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="blue-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="button-loading-spinner"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Cập nhật thửa đất
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

export default LandPlotEdit;
