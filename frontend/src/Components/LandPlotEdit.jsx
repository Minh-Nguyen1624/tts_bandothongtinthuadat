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
  FaGlobe,
  FaExpand,
  FaCompress,
  FaInfoCircle,
  FaLayerGroup,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import axios from "axios";
import LandPlotMap from "./LandPlotMap";
import GeometryDebug from "./GeometryDebug";
import "../css/LandPlotEdit.css";

const API_URL = "http://127.0.0.1:8000";

const LandPlotEdit = memo(
  ({
    show,
    onClose,
    onPlotUpdated,
    loading: externalLoading,
    phuongXaOptions,
    plotListOptions = [],
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
      plot_list_id: "",
      geom: "",
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [showMap, setShowMap] = useState(true);
    const [hasValidGeometry, setHasValidGeometry] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    // Reset form khi mở modal
    useEffect(() => {
      if (show && plotData) {
        const newFormData = {
          id: plotData.id || "",
          ten_chu: plotData.ten_chu || "",
          so_to: plotData.so_to || "",
          so_thua: plotData.so_thua || "",
          ky_hieu_mdsd: plotData.ky_hieu_mdsd || "",
          dien_tich: plotData.dien_tich || "",
          phuong_xa: plotData.phuong_xa || "",
          ghi_chu: plotData.ghi_chu || "",
          plot_list_id: plotData.plot_list_id || "",
          geom: plotData.geom || "",
        };

        setFormData(newFormData);

        // Kiểm tra xem có geometry hợp lệ không
        const hasGeometry = checkValidGeometry(newFormData.geom);
        setHasValidGeometry(hasGeometry);

        setErrors({});
        setTouched({});
        setSuccess("");
        setError("");
        setIsMapExpanded(false);

        console.log("🔄 LandPlotEdit initialized with data:", {
          id: newFormData.id,
          so_to: newFormData.so_to,
          so_thua: newFormData.so_thua,
          hasGeometry: hasGeometry,
        });
      }
    }, [show, plotData]);

    // Hàm kiểm tra geometry hợp lệ
    const checkValidGeometry = useCallback((geom) => {
      if (!geom) return false;

      try {
        // Kiểm tra các định dạng geometry phổ biến
        if (typeof geom === "string") {
          return geom.startsWith("010") && geom.length > 50; // EWKB hex
        }

        return false;
      } catch (error) {
        console.error("Error checking geometry:", error);
        return false;
      }
    }, []);

    // Thêm debounce cho validation (tùy chọn)
    const validateForm = useCallback((data) => {
      const newErrors = {};

      // Validation cho tên chủ (nếu có)
      if (data.ten_chu && data.ten_chu.trim().length > 100) {
        newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
      }

      // Validation nhanh cho các trường số
      if (!data.so_to || data.so_to.toString().trim() === "") {
        newErrors.so_to = "Vui lòng nhập số tờ";
      } else {
        const soTo = parseInt(data.so_to);
        if (isNaN(soTo) || soTo <= 0) {
          newErrors.so_to = "Số tờ phải là số dương";
        }
      }

      if (!data.so_thua || data.so_thua.toString().trim() === "") {
        newErrors.so_thua = "Vui lòng nhập số thửa";
      } else {
        const soThua = parseInt(data.so_thua);
        if (isNaN(soThua) || soThua <= 0) {
          newErrors.so_thua = "Số thửa phải là số dương";
        }
      }

      // Validation cho các trường khác...
      if (!data.ky_hieu_mdsd?.trim()) {
        newErrors.ky_hieu_mdsd = "Vui lòng nhập ký hiệu mục đích sử dụng";
      }

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

      if (!data.phuong_xa?.trim()) {
        newErrors.phuong_xa = "Vui lòng chọn phường/xã";
      }

      // Validation for geometry (optional)
      if (data.geom && typeof data.geom !== "object") {
        newErrors.geom = "Định dạng geometry không hợp lệ";
      }

      return newErrors;
    }, []);

    // Handle input change
    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === "ky_hieu_mdsd") {
          processedValue = value.toUpperCase();
        }

        if (name === "dien_tich") {
          processedValue = value.replace(/[^0-9.,]/g, "");
        }

        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
        }));

        if (errors[name]) {
          setErrors((prev) => ({
            ...prev,
            [name]: "",
          }));
        }

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

    const handleGeometryChange = useCallback(
      (e) => {
        const { value } = e.target;
        try {
          const geomData = value ? JSON.parse(value) : null;
          setFormData((prev) => ({
            ...prev,
            geom: geomData,
          }));
          if (errors.geom) {
            setErrors((prev) => ({
              ...prev,
              geom: "",
            }));
          }
        } catch (error) {
          setErrors((prev) => ({
            ...prev,
            geom: "Định dạng JSON không hợp lệ",
          }));
        }
      },
      [errors.geom]
    );

    // Handle blur
    const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    }, []);

    // Toggle geometry input visibility
    const toggleGeometryInput = useCallback(() => {
      setShowGeometryInput((prev) => !prev);
    }, []);

    // Toggle hiển thị bản đồ
    const toggleMap = useCallback(() => {
      setShowMap((prev) => !prev);
    }, []);

    // Toggle mở rộng bản đồ
    const toggleMapExpand = useCallback(() => {
      setIsMapExpanded((prev) => !prev);
    }, []);

    // Chức năng chỉnh sửa
    const fetchLandPlotEdit = useCallback(
      async (formData) => {
        if (!token) {
          setError("Vui lòng đăng nhập trước");
          return false;
        }

        try {
          setLoading(true);
          setError(null);
          setErrors({});

          const payload = { ...formData };

          // ✅ Ép kiểu integer cho so_to, so_thua
          if (
            payload.so_to !== undefined &&
            payload.so_to !== null &&
            payload.so_to !== ""
          ) {
            payload.so_to = parseInt(payload.so_to, 10);
          } else {
            delete payload.so_to;
          }

          if (
            payload.so_thua !== undefined &&
            payload.so_thua !== null &&
            payload.so_thua !== ""
          ) {
            payload.so_thua = parseInt(payload.so_thua, 10);
          } else {
            delete payload.so_thua;
          }

          // ✅ Chỉ gửi status nếu đúng format
          if (!["available", "owned", "suspended"].includes(payload.status)) {
            delete payload.status;
          }

          // ✅ Chỉ gửi geom khi có dữ liệu hợp lệ (có type và coordinates)
          if (
            !payload.geom ||
            typeof payload.geom !== "object" ||
            Object.keys(payload.geom).length === 0 ||
            (!payload.geom.type && !Array.isArray(payload.geom))
          ) {
            delete payload.geom;
          }

          // ✅ Xoá các field undefined
          Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) {
              delete payload[key];
            }
          });

          console.log("Sending payload:", payload);

          const response = await axios.put(
            `${API_URL}/api/land_plots/${formData.id}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.success) {
            setSuccess("Cập nhật thửa đất thành công!");
            onPlotUpdated?.(response.data.data);

            setTimeout(() => handleClose(), 1000);
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
              console.log("Validation errors:", error.response.data.errors);
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
      [token, onPlotUpdated]
    );

    // Handle submit
    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

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
        geom: "",
      });
      setErrors({});
      setTouched({});
      setSuccess("");
      setError("");
      setShowMap(true);
      setHasValidGeometry(false);
      setIsMapExpanded(false);
      setActiveTab("info");
      if (onClose) onClose();
    }, [onClose]);

    // Tính toán trạng thái form
    const formStatus = useMemo(() => {
      const requiredFields = [
        "so_to",
        "so_thua",
        "ky_hieu_mdsd",
        "dien_tich",
        "phuong_xa",
      ];
      const filledRequiredFields = requiredFields.filter(
        (field) => formData[field] && formData[field].toString().trim()
      );

      const progress =
        (filledRequiredFields.length / requiredFields.length) * 100;

      return {
        progress,
        isComplete: progress === 100 && Object.keys(errors).length === 0,
        filledFields: filledRequiredFields.length,
        totalFields: requiredFields.length,
      };
    }, [formData, errors]);

    if (!show) return null;

    const isLoading = loading || externalLoading;

    return (
      <div className="blue-modal-overlay">
        <div
          className={`blue-modal-content ${
            isMapExpanded ? "expanded-modal" : "large-modal"
          }`}
        >
          {/* Header */}
          <div className="blue-modal-header" style={{ maxƯidth: "100%" }}>
            <div
              className="header-content"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div className="title-section">
                {/* <div className="icon-badge">
                  <FaEdit />
                </div> */}
                <div>
                  <h2 className="blue-modal-title">Chỉnh Sửa Thửa Đất</h2>
                  <p className="modal-subtitle">
                    Cập nhật thông tin thửa đất số {plotData?.so_thua || ""} tờ{" "}
                    {plotData?.so_to || ""}
                  </p>
                </div>
              </div>

              <div className="header-actions">
                {/* Progress Indicator */}
                <div className="progress-indicator">
                  {/* <div className="progress-text">
                    {formStatus.filledFields}/{formStatus.totalFields} trường
                  </div> */}
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${formStatus.progress}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="blue-close-button"
                  aria-label="Đóng"
                  disabled={isLoading}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`modal-content-with-map ${
              isMapExpanded ? "map-only" : ""
            }`}
          >
            {/* Form Section */}
            {!isMapExpanded && (
              <div className="form-section">
                {/* Tab Navigation */}
                {/* <div className="form-tabs">
                  <button
                    className={`tab-button ${
                      activeTab === "info" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("info")}
                  >
                    <FaUser className="tab-icon" />
                    Thông tin cơ bản
                  </button>
                  <button
                    className={`tab-button ${
                      activeTab === "details" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("details")}
                  >
                    <FaStickyNote className="tab-icon" />
                    Thông tin bổ sung
                  </button>
                </div> */}

                <form onSubmit={handleSubmit} className="blue-land-form">
                  {/* Debug Info - Chỉ hiển thị trong development */}
                  {/* {process.env.NODE_ENV === "development" && (
                    <GeometryDebug geom={formData.geom} />
                  )} */}

                  {/* Thông báo */}
                  <div className="notification-container">
                    {success && (
                      <div className="success-message">
                        <FaCheckCircle className="notification-icon" />
                        {success}
                      </div>
                    )}
                    {error && (
                      <div className="error-message">
                        <FaExclamationTriangle className="notification-icon" />
                        {error}
                      </div>
                    )}
                  </div>

                  {activeTab === "info" ? (
                    <>
                      {/* First Row - Owner and Plot Info */}
                      <div className="form-row">
                        <div className="form-group">
                          <label className="blue-field-label">
                            <FaUser className="label-icon" />
                            Tên chủ sở hữu
                            <span className="optional-badge">Tùy chọn</span>
                          </label>
                          <input
                            type="text"
                            name="ten_chu"
                            value={formData.ten_chu}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder="Nhập tên chủ sở hữu"
                            className={`blue-input ${
                              errors.ten_chu && touched.ten_chu ? "error" : ""
                            }`}
                            disabled={isLoading}
                          />
                          {errors.ten_chu && touched.ten_chu && (
                            <span className="blue-error-message">
                              {errors.ten_chu}
                            </span>
                          )}
                        </div>

                        <div className="form-group compact-group">
                          <label className="blue-field-label">
                            <FaMap className="label-icon" />
                            Thông tin thửa đất
                            <span className="required-asterisk">*</span>
                          </label>
                          <div className="compact-row">
                            <div className="compact-field">
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
                              {errors.so_to && touched.so_to && (
                                <span className="blue-error-message compact-error">
                                  {errors.so_to}
                                </span>
                              )}
                            </div>
                            <div className="compact-field">
                              <input
                                type="number"
                                name="so_thua"
                                value={formData.so_thua}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="Số thửa"
                                className={`blue-input compact-input ${
                                  errors.so_thua && touched.so_thua
                                    ? "error"
                                    : ""
                                }`}
                                disabled={isLoading}
                                min="1"
                              />
                              {errors.so_thua && touched.so_thua && (
                                <span className="blue-error-message compact-error">
                                  {errors.so_thua}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Second Row - Land Use Code, Area, Ward */}
                      <div className="form-row">
                        <div className="form-group">
                          <label className="blue-field-label">
                            <FaTag className="label-icon" />
                            Mục đích sử dụng
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
                              errors.ky_hieu_mdsd && touched.ky_hieu_mdsd
                                ? "error"
                                : ""
                            }`}
                            disabled={isLoading}
                            maxLength={10}
                          />
                          {errors.ky_hieu_mdsd && touched.ky_hieu_mdsd && (
                            <span className="blue-error-message">
                              {errors.ky_hieu_mdsd}
                            </span>
                          )}
                          <div className="input-hint">
                            Nhập mã mục đích sử dụng đất theo quy định
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="blue-field-label">
                            <FaRuler className="label-icon" />
                            Diện tích (m²)
                            <span className="required-asterisk">*</span>
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
                                ? "error"
                                : ""
                            }`}
                            disabled={isLoading}
                          />
                          {errors.dien_tich && touched.dien_tich && (
                            <span className="blue-error-message">
                              {errors.dien_tich}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="blue-field-label">
                            <FaMap className="label-icon" />
                            Phường/Xã
                            <span className="required-asterisk">*</span>
                          </label>
                          <select
                            name="phuong_xa"
                            value={formData.phuong_xa}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`blue-select ${
                              errors.phuong_xa && touched.phuong_xa
                                ? "error"
                                : ""
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
                            <span className="blue-error-message">
                              {errors.phuong_xa}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="blue-field-label">
                            <FaLayerGroup className="label-icon" />
                            Danh sách thửa đất
                          </label>

                          <select
                            name="plot_list_id"
                            value={formData.plot_list_id}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className="blue-input blue-select"
                            disabled={loading}
                          >
                            <option value="">Chọn danh sách thửa đất</option>
                            {plotListOptions && plotListOptions.length > 0 ? (
                              plotListOptions.map((option) => {
                                // console.log("Option:", option); // Debug từng option
                                return (
                                  <option key={option.id} value={option.id}>
                                    {option.name ||
                                      option.ten_danh_sach ||
                                      `Danh sách ${option.organization_name}`}
                                  </option>
                                );
                              })
                            ) : (
                              <option value="" disabled>
                                Không có danh sách nào
                              </option>
                            )}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Tab Details */
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label className="blue-field-label">
                          <FaStickyNote className="label-icon" />
                          Ghi chú
                          <span className="optional-badge">Tùy chọn</span>
                        </label>
                        <textarea
                          name="ghi_chu"
                          value={formData.ghi_chu}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="Nhập ghi chú bổ sung về thửa đất..."
                          className="blue-textarea"
                          disabled={isLoading}
                          rows={4}
                        />
                        <div className="input-hint">
                          Ghi chú về tình trạng, đặc điểm hoặc thông tin khác
                          của thửa đất
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="blue-form-actions">
                    <div className="left-actions">
                      <button
                        type="button"
                        onClick={toggleMap}
                        className="blue-map-toggle-button"
                        disabled={isLoading || !hasValidGeometry}
                        title={
                          hasValidGeometry
                            ? "Ẩn/hiện bản đồ"
                            : "Không có dữ liệu bản đồ"
                        }
                        aria-label={
                          hasValidGeometry
                            ? "Ẩn/hiện bản đồ"
                            : "Không có dữ liệu bản đồ"
                        }
                      >
                        <FaGlobe className="button-icon" />
                        {showMap ? "Ẩn Bản Đồ" : "Hiện Bản Đồ"}
                      </button>

                      {showMap && (
                        <button
                          type="button"
                          onClick={toggleMapExpand}
                          className="blue-expand-button"
                          title={
                            isMapExpanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"
                          }
                          aria-label={
                            isMapExpanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"
                          }
                        >
                          {isMapExpanded ? <FaCompress /> : <FaExpand />}
                        </button>
                      )}
                    </div>

                    <div className="action-buttons-right">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="blue-cancel-button"
                        disabled={isLoading}
                      >
                        <FaTimes className="button-icon" />
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="blue-submit-button"
                        disabled={isLoading || !formStatus.isComplete}
                        title={
                          !formStatus.isComplete
                            ? "Vui lòng điền đầy đủ thông tin bắt buộc"
                            : ""
                        }
                        aria-describedby={
                          !formStatus.isComplete
                            ? "form-error-message"
                            : undefined
                        }
                      >
                        {isLoading ? (
                          <>
                            <div
                              className="button-loading-spinner"
                              aria-label="Đang xử lý"
                            ></div>
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <FaSave className="button-icon" />
                            Cập nhật thửa đất
                          </>
                        )}
                      </button>
                    </div>

                    {/* Thêm thông báo lỗi cho accessibility */}
                    {!formStatus.isComplete && (
                      <div
                        id="form-error-message"
                        className="sr-only"
                        role="alert"
                      >
                        Vui lòng điền đầy đủ thông tin bắt buộc trước khi gửi
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Map Section */}
            {showMap && (
              <div className={`map-section ${isMapExpanded ? "expanded" : ""}`}>
                {/* <div className="map-header">
                  <div className="map-title-section">
                    <h3 className="map-title">
                      <FaGlobe className="map-icon" />
                      Hình dạng thửa đất
                    </h3>
                    <div className="map-status">
                      <span
                        className={`status-badge ${
                          hasValidGeometry ? "success" : "warning"
                        }`}
                      >
                        {hasValidGeometry ? (
                          <>
                            <FaCheckCircle className="status-icon" />
                            Có dữ liệu
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle className="status-icon" />
                            Không có dữ liệu
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="map-actions">
                    <button
                      onClick={toggleMapExpand}
                      className="map-expand-button"
                      title={isMapExpanded ? "Thu nhỏ" : "Mở rộng"}
                    >
                      {isMapExpanded ? <FaCompress /> : <FaExpand />}
                    </button>
                  </div>
                </div> */}
                <div className="map-header">
                  <div className="map-title-section">
                    <h3 className="map-title">
                      <FaGlobe className="map-icon" />
                      Hình dạng thửa đất
                    </h3>
                    <div className="map-status">
                      <span
                        className={`status-badge ${
                          hasValidGeometry ? "success" : "warning"
                        }`}
                        role="status"
                        aria-live="polite"
                      >
                        {hasValidGeometry ? (
                          <>
                            <FaCheckCircle className="status-icon" />
                            Có dữ liệu
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle className="status-icon" />
                            Không có dữ liệu
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="map-actions">
                    <button
                      onClick={toggleMapExpand}
                      className="map-expand-button"
                      title={isMapExpanded ? "Thu nhỏ" : "Mở rộng"}
                      aria-label={
                        isMapExpanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"
                      }
                    >
                      {isMapExpanded ? <FaCompress /> : <FaExpand />}
                    </button>
                  </div>
                </div>

                <div className="map-container">
                  <LandPlotMap
                    geom={formData.geom}
                    plotInfo={{
                      so_to: formData.so_to,
                      so_thua: formData.so_thua,
                      dien_tich: formData.dien_tich,
                    }}
                  />
                </div>

                {/* {!isMapExpanded && (
                  <div className="map-info-panel">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Số tờ:</span>
                        <span className="info-value">
                          {formData.so_to || "—"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Số thửa:</span>
                        <span className="info-value">
                          {formData.so_thua || "—"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Diện tích:</span>
                        <span className="info-value highlight">
                          {formData.dien_tich
                            ? `${formData.dien_tich} m²`
                            : "—"}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Trạng thái:</span>
                        <span
                          className={`info-value status ${
                            hasValidGeometry ? "success" : "warning"
                          }`}
                        >
                          {hasValidGeometry
                            ? "Dữ liệu có sẵn"
                            : "Chưa có dữ liệu"}
                        </span>
                      </div>
                    </div>
                  </div>
                )} */}
                {/* {!isMapExpanded && (
                  <div
                    className="map-info-panel"
                    aria-labelledby="map-info-title"
                  >
                    <h4 id="map-info-title" className="sr-only">
                      Thông tin thửa đất
                    </h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Số tờ:</span>
                        <span className="info-value">
                          {formData.so_to || (
                            <span className="placeholder">—</span>
                          )}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Số thửa:</span>
                        <span className="info-value">
                          {formData.so_thua || (
                            <span className="placeholder">—</span>
                          )}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Diện tích:</span>
                        <span className="info-value highlight">
                          {formData.dien_tich ? (
                            `${formData.dien_tich} m²`
                          ) : (
                            <span className="placeholder">—</span>
                          )}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Trạng thái:</span>
                        <span
                          className={`info-value status ${
                            hasValidGeometry ? "success" : "warning"
                          }`}
                          role="status"
                        >
                          {hasValidGeometry
                            ? "Dữ liệu có sẵn"
                            : "Chưa có dữ liệu"}
                        </span>
                      </div>
                    </div>
                  </div>
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default LandPlotEdit;
