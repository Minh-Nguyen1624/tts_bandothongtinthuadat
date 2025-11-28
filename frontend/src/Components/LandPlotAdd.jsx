import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
  useRef,
} from "react";
import {
  FaTimes,
  FaSave,
  FaUser,
  FaMap,
  FaTag,
  FaRuler,
  FaStickyNote,
  FaLayerGroup,
  FaDrawPolygon,
  FaPlus,
  FaTrash,
  FaCalculator,
  FaSync,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../css/LandPlotAdd.css";
import axios from "axios";

const LandPlotAdd = memo(
  ({
    show,
    onClose,
    onSubmit,
    loading,
    phuongXaOptions,
    plotListOptions = [],
    fetchLandPlots,
  }) => {
    const [formData, setFormData] = useState({
      ten_chu: "",
      so_to: "",
      so_thua: "",
      ky_hieu_mdsd: [], // Array to match store function
      dien_tich: "",
      phuong_xa: "",
      ghi_chu: "",
      plot_list_id: "",
      geom: null,
      status: "available", // Add status field
      land_use_details: [], // Array of { ky_hieu_mdsd, dien_tich, geometry? }
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showGeometryInput, setShowGeometryInput] = useState(false);
    const [plotListInfo, setPlotListInfo] = useState(null);
    const [isSearchingPlotList, setIsSearchingPlotList] = useState(false);
    const [autoDistributeEnabled, setAutoDistributeEnabled] = useState(true);

    const searchTimeoutRef = useRef(null);
    const formDataRef = useRef(formData);

    useEffect(() => {
      formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
      if (show) {
        setFormData({
          ten_chu: "",
          so_to: "",
          so_thua: "",
          ky_hieu_mdsd: [],
          dien_tich: "",
          phuong_xa: "",
          ghi_chu: "",
          plot_list_id: "",
          geom: null,
          status: "available",
          land_use_details: [],
        });
        setErrors({});
        setTouched({});
        setShowGeometryInput(false);
        setPlotListInfo(null);
        setAutoDistributeEnabled(true);
      }
    }, [show]);

    const searchPlotList = useCallback(async (so_to, so_thua) => {
      if (!so_to || !so_thua) {
        setPlotListInfo(null);
        setFormData((prev) => ({
          ...prev,
          dien_tich: "",
        }));
        return;
      }

      setIsSearchingPlotList(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        // console.log("🔍 Searching EXACT PlotList with:", { so_to, so_thua });

        const response = await axios.get(
          "http://127.0.0.1:8000/api/plotlists",
          {
            params: {
              so_to,
              so_thua,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // console.log("📊 PlotList API Response:", response.data);

        if (response.data.success && response.data.data.length > 0) {
          // TÌM CHÍNH XÁC số tờ và số thửa
          const exactPlotList = response.data.data.find(
            (plot) =>
              String(plot.so_to) === String(so_to) &&
              String(plot.so_thua) === String(so_thua)
          );

          // console.log("🎯 Exact match found:", exactPlotList);

          if (exactPlotList) {
            setPlotListInfo(exactPlotList);
            setFormData((prev) => ({
              ...prev,
              dien_tich:
                exactPlotList.dien_tich != null
                  ? String(exactPlotList.dien_tich)
                  : "",
            }));
          } else {
            // console.log("❌ No EXACT PlotList match found");
            setPlotListInfo(null);
            setFormData((prev) => ({
              ...prev,
              dien_tich: "",
            }));
          }
        } else {
          // console.log("❌ No PlotList found at all");
          setPlotListInfo(null);
          setFormData((prev) => ({
            ...prev,
            dien_tich: "",
          }));
        }
      } catch (error) {
        console.error("❌ Error fetching plot list:", error);
        if (error.response && error.response.status === 401) {
          console.warn("Unauthorized: Please check your authentication token.");
        }
        setPlotListInfo(null);
        setFormData((prev) => ({
          ...prev,
          dien_tich: "",
        }));
      } finally {
        setIsSearchingPlotList(false);
      }
    }, []);

    useEffect(() => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlotList(formData.so_to, formData.so_thua);
      }, 500);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [formData.so_to, formData.so_thua, searchPlotList]);

    const validateForm = useCallback((data) => {
      const newErrors = {};

      // Ensure so_to, so_thua, and dien_tich are treated as strings for trim()
      const so_to = data.so_to != null ? String(data.so_to) : "";
      const so_thua = data.so_thua != null ? String(data.so_thua) : "";
      const dien_tich = data.dien_tich != null ? String(data.dien_tich) : "";
      const ky_hieu_mdsd = data.ky_hieu_mdsd != null ? data.ky_hieu_mdsd : [];
      const geom = data.geom != null ? data.geom : null;

      if (data.ten_chu && data.ten_chu.trim().length > 100) {
        newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
      }

      if (!so_to.trim()) {
        newErrors.so_to = "Vui lòng nhập số tờ";
      } else if (isNaN(parseInt(so_to)) || parseInt(so_to) <= 0) {
        newErrors.so_to = "Số tờ phải là số dương";
      }

      if (!so_thua.trim()) {
        newErrors.so_thua = "Vui lòng nhập số thửa";
      } else if (isNaN(parseInt(so_thua)) || parseInt(so_thua) <= 0) {
        newErrors.so_thua = "Số thửa phải là số dương";
      }

      if (!data.ky_hieu_mdsd.length) {
        newErrors.ky_hieu_mdsd =
          "Vui lòng nhập ít nhất một ký hiệu mục đích sử dụng";
      } else {
        data.ky_hieu_mdsd.forEach((type, index) => {
          if (type.trim().length > 20) {
            newErrors[`ky_hieu_mdsd_${index}`] =
              "Ký hiệu không được vượt quá 20 ký tự";
          }
        });
      }

      if (!dien_tich.trim()) {
        newErrors.dien_tich = "Vui lòng nhập diện tích";
      } else if (isNaN(parseFloat(dien_tich)) || parseFloat(dien_tich) <= 0) {
        newErrors.dien_tich = "Diện tích phải là số dương";
      }

      if (!data.phuong_xa.trim()) {
        newErrors.phuong_xa = "Vui lòng chọn phường/xã";
      } else if (data.phuong_xa.trim().length > 100) {
        newErrors.phuong_xa = "Phường/Xã không được vượt quá 100 ký tự";
      }

      if (data.land_use_details && data.land_use_details.length > 0) {
        const totalDetailArea = data.land_use_details.reduce((sum, detail) => {
          return sum + (parseFloat(detail.dien_tich) || 0);
        }, 0);
        const plotListArea = parseFloat(dien_tich) || 0;

        if (Math.abs(totalDetailArea - plotListArea) > 0.01) {
          newErrors.land_use_details = `Tổng diện tích chi tiết (${totalDetailArea.toFixed(
            2
          )} m²) không khớp với diện tích tổng (${plotListArea.toFixed(2)} m²)`;
        }

        data.land_use_details.forEach((detail, index) => {
          if (!detail.ky_hieu_mdsd?.trim()) {
            newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
              "Vui lòng nhập ký hiệu MDSD";
          } else if (detail.ky_hieu_mdsd.trim().length > 50) {
            newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
              "Ký hiệu không được vượt quá 50 ký tự";
          }
          if (!detail.dien_tich || parseFloat(detail.dien_tich) <= 0) {
            newErrors[`land_use_details_${index}_dien_tich`] =
              "Diện tích phải là số dương";
          }
        });
      }

      // if (data.geom && data.geom.trim() && typeof data.geom !== "object") {
      if (
        data.geom &&
        String(data.geom).trim() &&
        typeof data.geom !== "object"
      ) {
        try {
          JSON.parse(data.geom);
        } catch {
          newErrors.geom = "Định dạng JSON không hợp lệ";
        }
      }

      return newErrors;
    }, []);

    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === "ky_hieu_mdsd") {
          processedValue = value
            .split(/[,+\s]+/)
            .map((type) => type.trim().toUpperCase())
            .filter((type) => type.length > 0);

          if (
            autoDistributeEnabled &&
            plotListInfo &&
            processedValue.length > 1 &&
            formData.land_use_details.length === 0
          ) {
            const totalArea = parseFloat(formData.dien_tich) || 0;
            const defaultDetails = processedValue.map((type) => ({
              ky_hieu_mdsd: type,
              dien_tich: (totalArea / processedValue.length).toFixed(2),
              geometry: null,
            }));
            setFormData((prev) => ({
              ...prev,
              ky_hieu_mdsd: processedValue,
              land_use_details: defaultDetails,
            }));
            return;
          }
        }

        if (name === "dien_tich") {
          processedValue = value.replace(/[^0-9.,]/g, "");
        }

        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
        }));

        if (touched[name]) {
          const newErrors = validateForm({
            ...formDataRef.current,
            [name]: processedValue,
          });
          setErrors((prev) => ({
            ...prev,
            [name]: newErrors[name] || "",
          }));
        }
      },
      [
        touched,
        validateForm,
        plotListInfo,
        autoDistributeEnabled,
        formData.land_use_details.length,
      ]
    );

    const handleLandUseDetailChange = useCallback((index, field, value) => {
      setFormData((prev) => {
        const newDetails = [...prev.land_use_details];
        newDetails[index] = {
          ...newDetails[index],
          [field]:
            field === "dien_tich" ? value.replace(/[^0-9.,]/g, "") : value,
        };
        return { ...prev, land_use_details: newDetails };
      });
    }, []);

    const bulkUpdateLandUseDetails = useCallback((updates) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: updates,
      }));
    }, []);

    const addLandUseDetail = useCallback(() => {
      setFormData((prev) => {
        const remainingArea = calculateRemainingArea(prev);
        const newDetail = {
          ky_hieu_mdsd: "",
          dien_tich: remainingArea > 0 ? remainingArea.toFixed(2) : "",
          geometry: null,
        };
        return {
          ...prev,
          land_use_details: [...prev.land_use_details, newDetail],
        };
      });
    }, []);

    const calculateRemainingArea = useCallback((data = formDataRef.current) => {
      const totalArea = parseFloat(data.dien_tich) || 0;
      const usedArea = data.land_use_details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.dien_tich) || 0);
      }, 0);
      return Math.max(0, totalArea - usedArea);
    }, []);

    const removeLandUseDetail = useCallback((index) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.filter((_, i) => i !== index),
      }));
    }, []);

    const autoDistributeArea = useCallback(() => {
      if (formData.land_use_details.length > 0 && formData.dien_tich) {
        const totalArea = parseFloat(formData.dien_tich);
        const equalArea = (
          totalArea / formData.land_use_details.length
        ).toFixed(2);
        bulkUpdateLandUseDetails(
          formData.land_use_details.map((detail) => ({
            ...detail,
            dien_tich: equalArea,
          }))
        );
      }
    }, [
      formData.land_use_details,
      formData.dien_tich,
      bulkUpdateLandUseDetails,
    ]);

    const handleGeometryChange = useCallback(
      (e) => {
        const { value } = e.target;
        setFormData((prev) => ({
          ...prev,
          geom: value,
        }));

        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
          if (value.trim()) {
            try {
              JSON.parse(value);
              if (errors.geom) {
                setErrors((prev) => ({
                  ...prev,
                  geom: "",
                }));
              }
            } catch {
              setErrors((prev) => ({
                ...prev,
                geom: "Định dạng JSON không hợp lệ",
              }));
            }
          } else {
            if (errors.geom) {
              setErrors((prev) => ({
                ...prev,
                geom: "",
              }));
            }
          }
        }, 300);
      },
      [errors.geom]
    );

    const formatGeometryJSON = useCallback(() => {
      if (!formData.geom) return;

      try {
        const parsed = JSON.parse(formData.geom);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormData((prev) => ({
          ...prev,
          geom: formatted,
        }));
        if (errors.geom) {
          setErrors((prev) => ({ ...prev, geom: "" }));
        }
      } catch {
        setErrors((prev) => ({
          ...prev,
          geom: "Không thể format: JSON không hợp lệ",
        }));
      }
    }, [formData.geom, errors.geom]);

    const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    }, []);

    const toggleGeometryInput = useCallback(() => {
      setShowGeometryInput((prev) => !prev);
    }, []);

    const toggleAutoDistribute = useCallback(() => {
      setAutoDistributeEnabled((prev) => !prev);
    }, []);

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        const allTouched = Object.keys(formData).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setTouched(allTouched);

        let parsedGeom = null;
        if (formData.geom && formData.geom.trim()) {
          try {
            parsedGeom = JSON.parse(formData.geom);
          } catch {
            setErrors((prev) => ({
              ...prev,
              geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
            }));
            return;
          }
        }

        const processedLandUseDetails = formData.land_use_details
          .filter((detail) => detail.ky_hieu_mdsd.trim() && detail.dien_tich)
          .map((detail) => ({
            ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
            dien_tich: parseFloat(detail.dien_tich.replace(",", ".")),
            geometry: detail.geometry ? JSON.parse(detail.geometry) : null,
          }));

        const submitData = {
          ...formData,
          so_to: parseInt(formData.so_to),
          so_thua: parseInt(formData.so_thua),
          dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
          plot_list_id: formData.plot_list_id || null,
          geom: parsedGeom,
          status: formData.ten_chu.trim() ? "owned" : "available",
          ky_hieu_mdsd: formData.ky_hieu_mdsd, // Send as array
          land_use_details:
            processedLandUseDetails.length > 0
              ? processedLandUseDetails
              : undefined,
        };

        const newErrors = validateForm(submitData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
          const firstErrorElement = document.querySelector(".error");
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          return;
        }

        await onSubmit(submitData);
        if (fetchLandPlots) {
          await fetchLandPlots();
        }
      },
      [formData, onSubmit, validateForm, fetchLandPlots]
    );

    const totalLandUseArea = useMemo(() => {
      return formData.land_use_details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.dien_tich) || 0);
      }, 0);
    }, [formData.land_use_details]);

    const remainingArea = useMemo(() => {
      return calculateRemainingArea(formData);
    }, [formData, calculateRemainingArea]);

    const areaDifference = useMemo(() => {
      const totalArea = parseFloat(formData.dien_tich) || 0;
      return Math.abs(totalLandUseArea - totalArea);
    }, [totalLandUseArea, formData.dien_tich]);

    const hasAreaMismatch = useMemo(() => {
      return areaDifference > 0.01;
    }, [areaDifference]);

    if (!show) return null;

    return (
      <div className="blue-modal-overlay">
        <div className="blue-modal-content large-modal">
          <div
            className="blue-modal-header"
            style={{ display: "flex", color: "white" }}
          >
            <h2 className="blue-modal-title" style={{ color: "white" }}>
              Thêm Thửa Đất Mới
            </h2>
            <button
              onClick={onClose}
              className="blue-close-button"
              aria-label="Đóng"
              disabled={loading}
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="blue-land-form">
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

                <div className="plot-list-info">
                  {isSearchingPlotList ? (
                    <small style={{ color: "#17a2b8" }}>
                      <FaSync className="spinning" /> Đang tìm kiếm PlotList...
                    </small>
                  ) : plotListInfo ? (
                    <small style={{ color: "#28a745" }}>
                      <FaCheck /> Tìm thấy: {plotListInfo.organization_name} -{" "}
                      {plotListInfo.dien_tich} m²
                    </small>
                  ) : formData.so_to && formData.so_thua ? (
                    <small style={{ color: "#6c757d" }}>
                      <FaExclamationTriangle /> Không tìm thấy PlotList phù hợp
                    </small>
                  ) : null}
                </div>
              </div>
            </div>

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
                  value={formData.ky_hieu_mdsd.join(", ")}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="VD: ODT, CLN, ONT, ODT+CLN..."
                  className={`blue-input ${
                    errors.ky_hieu_mdsd && touched.ky_hieu_mdsd ? "error" : ""
                  }`}
                  disabled={loading}
                  maxLength={40}
                />
                {errors.ky_hieu_mdsd && touched.ky_hieu_mdsd && (
                  <span className="blue-error-message">
                    {errors.ky_hieu_mdsd}
                  </span>
                )}
                <div className="input-hint">
                  Nhập nhiều loại đất bằng dấu phẩy hoặc + (VD: ODT,CLN)
                  {autoDistributeEnabled && (
                    <span style={{ color: "#28a745", marginLeft: "5px" }}>
                      • Tự động chia diện tích
                    </span>
                  )}
                </div>
              </div>

              {/* <div className="form-group">
                <label className="blue-field-label">
                  <FaRuler className="label-icon" />
                  Diện tích tổng <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="dien_tich"
                  value={formData.dien_tich}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Diện tích (tự động từ PlotList)"
                  className="blue-input"
                  disabled={true} // Disabled vì lấy từ PlotList
                />
                {errors.dien_tich && touched.dien_tich && (
                  <span className="blue-error-message">{errors.dien_tich}</span>
                )}
              </div> */}
              <div className="form-group">
                <label className="blue-field-label">
                  <FaRuler className="label-icon" />
                  Diện tích tổng <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="dien_tich"
                  value={formData.dien_tich}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder={
                    plotListInfo
                      ? "Diện tích (tự động từ PlotList)"
                      : "Nhập diện tích thủ công"
                  }
                  className={`blue-input ${
                    errors.dien_tich && touched.dien_tich ? "error" : ""
                  }`}
                  disabled={!!plotListInfo} // Chỉ disabled khi có PlotList
                />
                {errors.dien_tich && touched.dien_tich && (
                  <span className="blue-error-message">{errors.dien_tich}</span>
                )}
                {/* Thêm hint để rõ ràng hơn */}
                <div className="input-hint">
                  {plotListInfo
                    ? "Diện tích được lấy tự động từ PlotList"
                    : "Không tìm thấy PlotList, vui lòng nhập diện tích thủ công"}
                </div>
              </div>

              <div className="form-group">
                <label className="blue-field-label">
                  <FaMap className="label-icon" />
                  Phường/Xã <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="phuong_xa"
                  value={formData.phuong_xa}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập Phường/Xã"
                  className={`blue-input ${
                    errors.phuong_xa && touched.phuong_xa ? "error" : ""
                  }`}
                  disabled={loading}
                />
                {errors.phuong_xa && touched.phuong_xa && (
                  <span className="blue-error-message">{errors.phuong_xa}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="blue-field-label">
                  <FaMap className="label-icon" />
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`blue-input blue-select ${
                    errors.status && touched.status ? "error" : ""
                  }`}
                  disabled={loading}
                >
                  <option value="available">Available</option>
                  <option value="owned">Owned</option>
                  <option value="suspended">Suspended</option>
                </select>
                {errors.status && touched.status && (
                  <span className="blue-error-message">{errors.status}</span>
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
                  {plotListOptions.length > 0 ? (
                    plotListOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name ||
                          option.ten_danh_sach ||
                          `Danh sách ${option.organization_name}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Không có danh sách nào
                    </option>
                  )}
                </select>
                <div className="input-hint">
                  Liên kết với danh sách thửa đất (tùy chọn)
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <div className="land-use-details-section">
                  <div className="section-header">
                    <label className="blue-field-label">
                      <FaLayerGroup className="label-icon" />
                      Chi tiết sử dụng đất (Tùy chọn)
                    </label>
                    <div className="section-actions">
                      <div className="toggle-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={autoDistributeEnabled}
                            onChange={toggleAutoDistribute}
                            disabled={loading}
                          />
                          Tự động chia diện tích
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={addLandUseDetail}
                        className="action-button secondary"
                        disabled={loading}
                      >
                        <FaPlus /> Thêm loại đất
                      </button>
                      {formData.land_use_details.length > 0 && (
                        <button
                          type="button"
                          onClick={autoDistributeArea}
                          className="action-button secondary"
                          disabled={loading || !formData.dien_tich}
                        >
                          <FaCalculator /> Chia đều
                        </button>
                      )}
                    </div>
                  </div>

                  {formData.land_use_details.length > 0 && (
                    <div className="land-use-details-list">
                      <div className="details-header">
                        <span>Loại đất</span>
                        <span>Diện tích (m²)</span>
                        <span>Hình học</span>
                        <span>Thao tác</span>
                      </div>
                      {formData.land_use_details.map((detail, index) => (
                        <div key={index} className="detail-row">
                          <input
                            type="text"
                            value={detail.ky_hieu_mdsd}
                            onChange={(e) =>
                              handleLandUseDetailChange(
                                index,
                                "ky_hieu_mdsd",
                                e.target.value
                              )
                            }
                            placeholder="VD: ODT, CLN..."
                            className={`blue-input compact-input ${
                              errors[`land_use_details_${index}_ky_hieu_mdsd`]
                                ? "error"
                                : ""
                            }`}
                            disabled={loading}
                          />
                          <input
                            type="text"
                            value={detail.dien_tich}
                            onChange={(e) =>
                              handleLandUseDetailChange(
                                index,
                                "dien_tich",
                                e.target.value
                              )
                            }
                            placeholder="Diện tích"
                            className={`blue-input compact-input ${
                              errors[`land_use_details_${index}_dien_tich`]
                                ? "error"
                                : ""
                            }`}
                            disabled={loading}
                          />
                          <textarea
                            value={detail.geometry || ""}
                            onChange={(e) =>
                              handleLandUseDetailChange(
                                index,
                                "geometry",
                                e.target.value
                              )
                            }
                            placeholder="GeoJSON (tùy chọn)"
                            className="blue-input compact-textarea"
                            disabled={loading}
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={() => removeLandUseDetail(index)}
                            className="remove-button action-button secondary"
                            disabled={loading}
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}

                      <div className="details-summary">
                        <div className="total-area">
                          Tổng diện tích chi tiết:{" "}
                          <strong>{totalLandUseArea.toFixed(2)} m²</strong>
                        </div>
                        <div className="area-comparison">
                          Diện tích tổng:{" "}
                          <strong>
                            {parseFloat(formData.dien_tich) || 0} m²
                          </strong>
                          {hasAreaMismatch ? (
                            <span className="area-mismatch">
                              ⚠️ Chênh lệch: {areaDifference.toFixed(2)} m²
                            </span>
                          ) : (
                            <span className="area-match">✓ Khớp</span>
                          )}
                        </div>
                        {remainingArea > 0 && (
                          <div className="remaining-area">
                            Diện tích còn lại:{" "}
                            <strong>{remainingArea.toFixed(2)} m²</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {errors.land_use_details && (
                    <span className="blue-error-message">
                      {errors.land_use_details}
                    </span>
                  )}
                  <div className="input-hint">
                    Thêm chi tiết diện tích cho từng loại đất. Tổng diện tích
                    phải khớp với diện tích tổng.
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <div className="geometry-section">
                  <div className="geometry-header">
                    <label className="blue-field-label">
                      <FaDrawPolygon className="label-icon" />
                      Dữ liệu hình học (Geometry)
                    </label>
                    <button
                      type="button"
                      onClick={toggleGeometryInput}
                      className="geometry-toggle-button"
                      disabled={loading}
                    >
                      {showGeometryInput ? "Ẩn" : "Hiện"} Geometry
                    </button>
                  </div>

                  {showGeometryInput && (
                    <div className="geometry-input-container">
                      <div className="geometry-toolbar">
                        <button
                          type="button"
                          onClick={formatGeometryJSON}
                          className="geometry-format-button"
                          disabled={loading || !formData.geom}
                        >
                          Format JSON
                        </button>
                      </div>
                      <textarea
                        name="geom"
                        value={formData.geom || ""}
                        onChange={handleGeometryChange}
                        onBlur={handleBlur}
                        placeholder="Nhập dữ liệu GeoJSON..."
                        className={`blue-textarea geometry-textarea ${
                          errors.geom && touched.geom ? "error" : ""
                        }`}
                        disabled={loading}
                        rows={8}
                      />
                      {errors.geom && touched.geom && (
                        <span className="blue-error-message">
                          {errors.geom}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

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
