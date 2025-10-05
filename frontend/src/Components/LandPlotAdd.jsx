import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import {
  FaTimes,
  FaSave,
  FaUser,
  FaMap,
  FaTag,
  FaRuler,
  FaStickyNote,
} from "react-icons/fa";
import "../css/LandPlotAdd.css";

const LandPlotAdd = memo(
  ({ show, onClose, onSubmit, loading, phuongXaOptions }) => {
    const [formData, setFormData] = useState({
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

    // Reset form when modal opens
    useEffect(() => {
      if (show) {
        setFormData({
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
      }
    }, [show]);

    // Validation function
    const validateForm = useCallback((data) => {
      const newErrors = {};

      if (data.ten_chu.trim() && data.ten_chu.trim().length > 100) {
        newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
      }

      if (!data.so_to.trim()) {
        newErrors.so_to = "Vui lòng nhập số tờ";
      } else if (isNaN(data.so_to) || parseInt(data.so_to) <= 0) {
        newErrors.so_to = "Số tờ phải là số dương";
      }

      if (!data.so_thua.trim()) {
        newErrors.so_thua = "Vui lòng nhập số thửa";
      } else if (isNaN(data.so_thua) || parseInt(data.so_thua) <= 0) {
        newErrors.so_thua = "Số thửa phải là số dương";
      }

      if (!data.ky_hieu_mdsd.trim()) {
        newErrors.ky_hieu_mdsd = "Vui lòng nhập ký hiệu mục đích sử dụng";
      }

      if (!data.dien_tich.trim()) {
        newErrors.dien_tich = "Vui lòng nhập diện tích";
      } else if (
        isNaN(parseFloat(data.dien_tich)) ||
        parseFloat(data.dien_tich) <= 0
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

        // Real-time validation for touched fields
        if (touched[name]) {
          const fieldError = validateForm({ [name]: processedValue })[name];
          setErrors((prev) => ({
            ...prev,
            [name]: fieldError || "",
          }));
        }
      },
      [touched, validateForm]
    );

    // Handle blur
    const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    }, []);

    // Handle submit
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
          return;
        }

        await onSubmit(formData);
      },
      [formData, onSubmit, validateForm]
    );

    if (!show) return null;

    return (
      <div className="blue-modal-overlay">
        <div className="blue-modal-content">
          {/* Header */}
          <div className="blue-modal-header">
            <h2 className="blue-modal-title">Thêm Thửa Đất Mới</h2>
            <button
              onClick={onClose}
              className="blue-close-button"
              aria-label="Đóng"
            >
              <FaTimes />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="blue-land-form">
            {/* First Row - Owner and Plot Info */}
            <div className="form-row">
              <div className="form-group">
                <label className="blue-field-label">
                  <FaUser className="label-icon" />
                  Tên chủ
                  {/* <span className="required-asterisk">*</span> */}
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
                  disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
                  disabled={loading}
                  maxLength={4}
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
                  Diện tích <span className="required-asterisk">*</span>
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            {/* Creator Info - Readonly */}
            <div className="info-section">
              <div className="info-row">
                <div className="info-item">
                  <label className="info-label">Người tạo:</label>
                  <span className="info-value">-</span>
                </div>
                <div className="info-item">
                  <label className="info-label">Ngày tạo:</label>
                  <span className="info-value">-</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <label className="info-label">Người cập nhật:</label>
                  <span className="info-value">-</span>
                </div>
                <div className="info-item">
                  <label className="info-label">Ngày cập nhật:</label>
                  <span className="info-value">-</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="blue-form-actions">
              <button
                type="button"
                onClick={onClose}
                className="blue-cancel-button"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="blue-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="button-loading-spinner"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Thêm thửa đất
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

export default LandPlotAdd;
