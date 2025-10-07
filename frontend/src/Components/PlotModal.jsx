import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  FaTimes,
  FaSave,
  FaBuilding,
  FaMap,
  FaRuler,
  FaGlobe,
  FaEdit,
  FaUser,
  FaStickyNote,
} from "react-icons/fa";

const PlotModal = memo(
  ({ show, onClose, onSubmit, loading, plotData, xaOptions }) => {
    const [formData, setFormData] = useState({
      organization_name: "",
      so_to: "",
      so_thua: "",
      dia_chi_thua_dat: "",
      xa: "",
      dien_tich: "",
      ghi_chu: "",
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Reset form khi mở modal
    useEffect(() => {
      if (show) {
        const newFormData = {
          organization_name: plotData?.organization_name || "",
          so_to: plotData?.so_to.toString() || "",
          so_thua: plotData?.so_thua.toString() || "",
          dia_chi_thua_dat: plotData?.dia_chi_thua_dat || "",
          xa: plotData?.xa || "",
          dien_tich: plotData?.dien_tich || "",
          ghi_chu: plotData?.ghi_chu || "",
        };

        setFormData(newFormData);
        setErrors({});
        setTouched({});
      }
    }, [show, plotData]);

    // Validation function
    const validateForm = useCallback((data) => {
      const newErrors = {};

      if (data.ten_chu && data.ten_chu.trim().length > 100) {
        newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
      }

      // Số tờ validation
      if (!data.so_to || data.so_to.toString().trim() === "") {
        newErrors.so_to = "Vui lòng nhập số tờ";
      } else {
        const soTo = parseInt(data.so_to);
        if (isNaN(soTo) || soTo <= 0) {
          newErrors.so_to = "Số tờ phải là số dương";
        }
      }

      // Số thửa validation
      if (!data.so_thua || data.so_thua.toString().trim() === "") {
        newErrors.so_thua = "Vui lòng nhập số thửa";
      } else {
        const soThua = parseInt(data.so_thua);
        if (isNaN(soThua) || soThua <= 0) {
          newErrors.so_thua = "Số thửa phải là số dương";
        }
      }

      // Diện tích validation
      if (!data.dien_tich || data.dien_tich.toString().trim() === "") {
        newErrors.dien_tich = "Vui lòng nhập diện tích";
      } else {
        const dienTich = parseFloat(
          data.dien_tich.toString().replace(",", ".")
        );
        if (isNaN(dienTich) || dienTich <= 0) {
          newErrors.dien_tich = "Diện tích phải là số dương";
        }
      }

      return newErrors;
    }, []);

    // Handle input change
    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Xử lý số cho các trường số
        if (name === "so_to" || name === "so_thua") {
          processedValue = value.replace(/[^0-9]/g, "");
        }

        if (name === "dien_tich") {
          processedValue = value.replace(/[^0-9.,]/g, "");
        }

        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
        }));

        // Clear error khi user bắt đầu nhập
        if (errors[name]) {
          setErrors((prev) => ({
            ...prev,
            [name]: "",
          }));
        }

        // Validate real-time khi field đã được touch
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

        // Prepare data for submission
        const submitData = {
          ...formData,
          so_to: formData.so_to ? parseInt(formData.so_to) : null,
          so_thua: formData.so_thua ? parseInt(formData.so_thua) : null,
          dien_tich: formData.dien_tich
            ? parseFloat(formData.dien_tich.toString().replace(",", "."))
            : null,
          organization_name: formData.organization_name.trim() || null,
          dia_chi_thua_dat: formData.dia_chi_thua_dat.trim() || null,
          xa: formData.xa.trim() || null,
          ghi_chu: formData.ghi_chu.trim() || null,
        };

        const success = await onSubmit(submitData);
        if (success) {
          // Form sẽ được reset bởi useEffect khi modal đóng
        }
      },
      [formData, validateForm, onSubmit]
    );

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    // Tính toán trạng thái form
    // const formStatus = useMemo(() => {
    //   const requiredFields = ["so_to", "so_thua", "dien_tich"];
    //   const filledRequiredFields = requiredFields.filter(
    //     (field) => formData[field] && formData[field].toString().trim()
    //   );

    //   const progress =
    //     (filledRequiredFields.length / requiredFields.length) * 100;

    //   return {
    //     progress,
    //     isComplete: progress === 100 && Object.keys(errors).length === 0,
    //     filledFields: filledRequiredFields.length,
    //     totalFields: requiredFields.length,
    //   };
    // }, [formData, errors]);

    const formStatus = useMemo(() => {
      const requiredFields = ["so_to", "so_thua", "dien_tich"];

      // Kiểm tra các trường bắt buộc đã được điền và hợp lệ
      const validationErrors = validateForm(formData);
      const hasValidationErrors = Object.keys(validationErrors).length > 0;

      const filledRequiredFields = requiredFields.filter(
        (field) => formData[field] && formData[field].toString().trim() !== ""
      );

      const progress =
        (filledRequiredFields.length / requiredFields.length) * 100;

      // Điều kiện để form hoàn thành: tất cả trường bắt buộc đã điền VÀ không có lỗi validation
      const isComplete =
        filledRequiredFields.length === requiredFields.length &&
        !hasValidationErrors;

      return {
        progress,
        isComplete,
        filledFields: filledRequiredFields.length,
        totalFields: requiredFields.length,
        hasValidationErrors,
      };
    }, [formData, validateForm]);
    if (!show) return null;

    return (
      <div className="blue-modal-overlay">
        <div className="blue-modal-content large-modal">
          {/* Header */}
          <div className="blue-modal-header">
            <div className="blue-header-content">
              <div className="blue-title-section">
                <div className="blue-icon-badge">
                  <FaEdit />
                </div>
                <div>
                  <h2 className="blue-modal-title">
                    {plotData ? "Chỉnh Sửa Thửa Đất" : "Thêm Thửa Đất Mới"}
                  </h2>
                  <p className="blue-modal-subtitle">
                    {plotData
                      ? `Cập nhật thông tin thửa đất số ${
                          plotData.so_thua || ""
                        } tờ ${plotData.so_to || ""}`
                      : "Thêm thông tin thửa đất mới vào hệ thống"}
                  </p>
                </div>
              </div>

              <div className="blue-header-actions">
                {/* Progress Indicator */}
                <div className="blue-progress-indicator">
                  <div className="blue-progress-text">
                    {formStatus.filledFields}/{formStatus.totalFields} trường
                    bắt buộc
                  </div>
                  <div className="blue-progress-bar">
                    <div
                      className="blue-progress-fill"
                      style={{ width: `${formStatus.progress}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="blue-close-button"
                  aria-label="Đóng"
                  disabled={loading}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="blue-plot-form">
            <div className="blue-form-grid">
              {/* Tên chủ sở hữu */}
              <div className="blue-form-group">
                <label className="blue-field-label">
                  <FaUser className="blue-label-icon" />
                  Tên chủ sở hữu
                  <span className="blue-optional-badge">Tùy chọn</span>
                </label>
                <input
                  type="text"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập tên chủ sở hữu"
                  className={`blue-input ${
                    errors.organization_name && touched.organization_name
                      ? "blue-input-error"
                      : ""
                  }`}
                  disabled={loading}
                />
                {errors.organization_name && touched.organization_name && (
                  <span className="blue-error-message">
                    {errors.organization_name}
                  </span>
                )}
              </div>

              {/* Thông tin thửa đất - Số tờ và Số thửa */}
              <div className="blue-form-group compact-group">
                <label className="blue-field-label">
                  <FaMap className="blue-label-icon" />
                  Thông tin thửa đất
                  <span className="blue-required-asterisk">*</span>
                </label>
                <div className="blue-compact-row">
                  <div className="blue-compact-field">
                    <label className="blue-compact-label">Số tờ</label>
                    <input
                      type="text"
                      name="so_to"
                      value={formData.so_to}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Nhập số tờ"
                      className={`blue-input blue-compact-input ${
                        errors.so_to && touched.so_to ? "blue-input-error" : ""
                      }`}
                      disabled={loading}
                      required
                    />
                    {errors.so_to && touched.so_to && (
                      <span className="blue-error-message blue-compact-error">
                        {errors.so_to}
                      </span>
                    )}
                  </div>
                  <div className="blue-compact-field">
                    <label className="blue-compact-label">Số thửa</label>
                    <input
                      type="text"
                      name="so_thua"
                      value={formData.so_thua}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Nhập số thửa"
                      className={`blue-input blue-compact-input ${
                        errors.so_thua && touched.so_thua
                          ? "blue-input-error"
                          : ""
                      }`}
                      disabled={loading}
                      required
                    />
                    {errors.so_thua && touched.so_thua && (
                      <span className="blue-error-message blue-compact-error">
                        {errors.so_thua}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Địa chỉ thửa đất */}
              <div className="blue-form-group full-width">
                <label className="blue-field-label">
                  <FaMap className="blue-label-icon" />
                  Địa chỉ thửa đất
                  <span className="blue-optional-badge">Tùy chọn</span>
                </label>
                <input
                  type="text"
                  name="dia_chi_thua_dat"
                  value={formData.dia_chi_thua_dat}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập địa chỉ chi tiết của thửa đất"
                  className="blue-input"
                  disabled={loading}
                />
              </div>

              {/* Xã */}
              <div className="blue-form-group">
                <label className="blue-field-label">
                  <FaGlobe className="blue-label-icon" />
                  Xã
                  <span className="blue-optional-badge">Tùy chọn</span>
                </label>
                {/* <select
                  name="xa"
                  value={formData.xa}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="blue-input blue-select"
                  disabled={loading}
                >
                  <option value="">Chọn Xã</option>
                  {xaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select> */}
                <input
                  type="text"
                  name="xa"
                  value={formData.xa}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập xã của thửa đất"
                  className="blue-input"
                  disabled={loading}
                />
              </div>

              {/* Diện tích */}
              <div className="blue-form-group">
                <label className="blue-field-label">
                  <FaRuler className="blue-label-icon" />
                  Diện tích (m²)
                  <span className="blue-required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="dien_tich"
                  value={formData.dien_tich}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập diện tích"
                  className={`blue-input ${
                    errors.dien_tich && touched.dien_tich
                      ? "blue-input-error"
                      : ""
                  }`}
                  disabled={loading}
                  required
                />
                {errors.dien_tich && touched.dien_tich && (
                  <span className="blue-error-message">{errors.dien_tich}</span>
                )}
                <div className="blue-input-hint">Ví dụ: 100.5, 200, 150.75</div>
              </div>

              {/* Ghi chú */}
              <div className="blue-form-group full-width">
                <label className="blue-field-label">
                  <FaStickyNote className="blue-label-icon" />
                  Ghi chú
                  <span className="blue-optional-badge">Tùy chọn</span>
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

            {/* Action Buttons */}
            <div className="blue-form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="blue-cancel-button"
                disabled={loading}
              >
                <FaTimes className="blue-button-icon" />
                Hủy
              </button>
              <button
                type="submit"
                className="blue-submit-button"
                disabled={loading || !formStatus.isComplete}
                title={
                  !formStatus.isComplete
                    ? "Vui lòng điền đầy đủ thông tin bắt buộc"
                    : ""
                }
              >
                {loading ? (
                  <>
                    <div className="blue-button-loading-spinner"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FaSave className="blue-button-icon" />
                    {plotData ? "Cập nhật" : "Tạo mới"}
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

export default PlotModal;
