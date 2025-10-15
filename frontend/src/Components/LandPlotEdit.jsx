import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  FaDrawPolygon,
} from "react-icons/fa";
import axios from "axios";
import LandPlotMap from "./LandPlotMap";
import GeometryDebug from "./GeometryDebug";
import "../css/LandPlotEdit.css";

const API_URL = "http://127.0.0.1:8000";

const LandPlotEdit = React.memo(
  ({
    show,
    onClose,
    onPlotUpdated,
    loading: externalLoading,
    phuongXaOptions,
    plotListOptions = [],
    plotData,
    token,
    fetchLandPlots,
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
    const [showGeometryInput, setShowGeometryInput] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
      if (show && plotData) {
        const newFormData = {
          id: plotData.id || "",
          ten_chu: plotData.ten_chu || "",
          so_to: plotData.so_to || "",
          so_thua: plotData.so_thua || "",
          ky_hieu_mdsd: plotData.ky_hieu_mdsd || "",
          dien_tich: plotData.dien_tich?.toString() || "", // Ensure dien_tich is a string
          phuong_xa: plotData.phuong_xa || "",
          ghi_chu: plotData.ghi_chu || "",
          plot_list_id: plotData.plot_list_id || "",
          geom: plotData.geom || "",
        };

        // Ensure formatting is applied to string
        if (newFormData.so_to) newFormData.so_to = newFormData.so_to.toString();
        if (newFormData.so_thua)
          newFormData.so_thua = newFormData.so_thua.toString();
        if (newFormData.dien_tich)
          newFormData.dien_tich = newFormData.dien_tich
            .replace(/[^0-9.,]/g, "")
            .replace(/^0+/, "0");

        setFormData(newFormData);

        // Check geometry
        const hasGeometry = checkValidGeometry(newFormData.geom);
        setHasValidGeometry(hasGeometry);

        setErrors({});
        setTouched({});
        setSuccess("");
        setError("");
        setIsMapExpanded(false);

        // console.log("🔄 LandPlotEdit initialized with data:", {
        //   id: newFormData.id,
        //   so_to: newFormData.so_to,
        //   so_thua: newFormData.so_thua,
        //   dien_tich: newFormData.dien_tich,
        //   hasGeometry: hasGeometry,
        // });
      } else if (show && !plotData) {
        setFormData({
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
        setHasValidGeometry(false);
        setErrors({});
        setTouched({});
        setSuccess("");
        setError("");
      }
    }, [show, plotData]);

    const checkValidGeometry = useCallback((geom) => {
      if (!geom || typeof geom !== "string") return false;

      try {
        // Kiểm tra nếu là WKB hex string
        if (geom.startsWith("010") && geom.length > 50) return true;

        // Kiểm tra nếu là GeoJSON
        const parsed = JSON.parse(geom);
        return isValidGeoJSON(parsed);
      } catch (error) {
        console.error("Error checking geometry:", error);
        return false;
      }
    }, []);

    // Hàm chuyển đổi WKB hex sang GeoJSON
    const wkbToGeoJSON = useCallback((wkbHex) => {
      if (!wkbHex || !wkbHex.startsWith("010")) {
        return null;
      }

      try {
        // Chuyển đổi WKB hex sang GeoJSON
        const geometry = wkx.Geometry.parse(Buffer.from(wkbHex, "hex"));
        const geoJSON = geometry.toGeoJSON();

        // console.log("✅ Chuyển đổi WKB sang GeoJSON thành công");
        return geoJSON;
      } catch (error) {
        console.error("Error converting WKB to GeoJSON:", error);
        return null;
      }
    }, []);

    // Hàm xử lý geometry trước khi gửi lên server
    const processGeometryForServer = useCallback(
      (geom) => {
        if (!geom || !geom.trim()) return null;

        try {
          // Nếu là WKB hex string, chuyển đổi sang GeoJSON
          if (geom.startsWith("010") && geom.length > 50) {
            const geoJSON = wkbToGeoJSON(geom);
            if (geoJSON) {
              return geoJSON;
            } else {
              // Nếu không chuyển đổi được, trả về null để không gửi geometry
              console.warn(
                "Không thể chuyển đổi WKB sang GeoJSON, bỏ qua geometry"
              );
              return null;
            }
          }

          // Nếu là GeoJSON string, parse thành object
          if (geom.trim().startsWith("{")) {
            const parsed = JSON.parse(geom);
            if (isValidGeoJSON(parsed)) {
              return parsed;
            }
          }

          return null;
        } catch (error) {
          console.error("Error processing geometry for server:", error);
          return null;
        }
      },
      [wkbToGeoJSON]
    );

    const validateForm = useCallback(
      (data) => {
        const newErrors = {};

        if (data.ten_chu && data.ten_chu.trim().length > 100) {
          newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
        }

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

        if (!data.ky_hieu_mdsd?.trim()) {
          newErrors.ky_hieu_mdsd = "Vui lòng nhập ký hiệu mục đích sử dụng";
        }

        if (!data.dien_tich || data.dien_tich.toString().trim() === "") {
          newErrors.dien_tich = "Diện tích không được để trống";
        } else {
          const dienTich = parseFloat(data.dien_tich.replace(",", "."));
          if (isNaN(dienTich) || dienTich <= 0) {
            newErrors.dien_tich = "Diện tích phải là số dương";
          }
        }

        if (!data.phuong_xa?.trim()) {
          newErrors.phuong_xa = "Vui lòng chọn phường/xã";
        }

        if (data.geom && data.geom.trim()) {
          if (!checkValidGeometry(data.geom)) {
            newErrors.geom = "Định dạng geometry không hợp lệ";
          }
        }

        return newErrors;
      },
      [checkValidGeometry]
    );

    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === "ky_hieu_mdsd") {
          processedValue = value.toUpperCase();
        } else if (name === "dien_tich") {
          processedValue = value.replace(/[^0-9.,]/g, "").replace(/^0+/, "0");
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
          const newErrors = validateForm({
            ...formData,
            [name]: processedValue,
          });
          setErrors((prev) => ({
            ...prev,
            [name]: newErrors[name] || "",
          }));
        }
      },
      [touched, validateForm, errors, formData]
    );

    const isValidGeoJSON = (geojson) => {
      if (!geojson || typeof geojson !== "object") return false;
      if (!geojson.type) return false;

      if (geojson.type === "Polygon") {
        if (!Array.isArray(geojson.coordinates)) return false;
        if (geojson.coordinates.length === 0) return false;

        const exteriorRing = geojson.coordinates[0];
        if (!Array.isArray(exteriorRing) || exteriorRing.length < 4)
          return false;

        const first = exteriorRing[0];
        const last = exteriorRing[exteriorRing.length - 1];
        return first[0] === last[0] && first[1] === last[1];
      }

      return false;
    };

    const handleGeometryChange = useCallback((e) => {
      const { value } = e.target;

      setFormData((prev) => ({
        ...prev,
        geom: value,
      }));

      if (value.trim()) {
        try {
          const parsed = JSON.parse(value);
          if (!isValidGeoJSON(parsed)) {
            throw new Error("Cấu trúc GeoJSON không hợp lệ");
          }
          setErrors((prev) => ({
            ...prev,
            geom: "",
          }));
          setHasValidGeometry(true);
        } catch (error) {
          let errorMessage = "Định dạng JSON không hợp lệ";
          if (error.message.includes("JSON")) {
            errorMessage = "Lỗi cú pháp JSON. Kiểm tra dấu ngoặc và dấu phẩy.";
          } else if (error.message.includes("GeoJSON")) {
            errorMessage =
              "Cấu trúc GeoJSON không đúng. Cần có 'type' và 'coordinates' hợp lệ.";
          }
          setErrors((prev) => ({
            ...prev,
            geom: errorMessage,
          }));
          setHasValidGeometry(false);
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          geom: "",
        }));
        setHasValidGeometry(false);
      }
    }, []);

    const formatGeometryJSON = useCallback(() => {
      if (!formData.geom?.trim()) return;

      try {
        const parsed = JSON.parse(formData.geom);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormData((prev) => ({
          ...prev,
          geom: formatted,
        }));
        setErrors((prev) => ({ ...prev, geom: "" }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          geom: "Không thể format: JSON không hợp lệ",
        }));
      }
    }, [formData.geom]);

    const handleBlur = useCallback(
      (e) => {
        const { name } = e.target;
        setTouched((prev) => ({
          ...prev,
          [name]: true,
        }));
        if (name === "geom") formatGeometryJSON();
      },
      [formatGeometryJSON]
    );

    const toggleGeometryInput = useCallback(() => {
      setShowGeometryInput((prev) => !prev);
    }, []);

    const toggleMap = useCallback(() => {
      setShowMap((prev) => !prev);
    }, []);

    const toggleMapExpand = useCallback(() => {
      setIsMapExpanded((prev) => !prev);
    }, []);

    // const fetchLandPlotEdit = useCallback(
    //   async (formData) => {
    //     if (!token) {
    //       setError("Vui lòng đăng nhập trước");
    //       return false;
    //     }

    //     try {
    //       setLoading(true);
    //       setError(null);
    //       setErrors({});

    //       const payload = { ...formData };

    //       // console.log("🔄 Bắt đầu xử lý dữ liệu...");
    //       // console.log("📥 Dữ liệu form nhận được:", formData);

    //       // Xử lý các trường số
    //       payload.so_to = parseInt(payload.so_to, 10);
    //       if (isNaN(payload.so_to) || payload.so_to <= 0) {
    //         throw new Error("Số tờ không hợp lệ");
    //       }

    //       payload.so_thua = parseInt(payload.so_thua, 10);
    //       if (isNaN(payload.so_thua) || payload.so_thua <= 0) {
    //         throw new Error("Số thửa không hợp lệ");
    //       }

    //       // Xử lý diện tích
    //       if (
    //         typeof payload.dien_tich === "string" &&
    //         payload.dien_tich.trim()
    //       ) {
    //         const cleanDienTich = payload.dien_tich.replace(",", ".");
    //         payload.dien_tich = parseFloat(cleanDienTich);
    //         if (isNaN(payload.dien_tich) || payload.dien_tich <= 0) {
    //           throw new Error("Diện tích không hợp lệ");
    //         }
    //       } else {
    //         throw new Error("Diện tích không được để trống");
    //       }

    //       // Xử lý các trường text
    //       payload.ky_hieu_mdsd = payload.ky_hieu_mdsd.trim();
    //       if (!payload.ky_hieu_mdsd) {
    //         throw new Error("Ký hiệu mục đích sử dụng không được để trống");
    //       }

    //       payload.phuong_xa = payload.phuong_xa.trim();
    //       if (!payload.phuong_xa) {
    //         throw new Error("Phường/Xã không được để trống");
    //       }

    //       // XỬ LÝ GEOMETRY: GIỮ NGUYÊN WKB HEX, KHÔNG CHUYỂN ĐỔI
    //       console.log(
    //         "🗺️ Geometry trước xử lý:",
    //         payload.geom ? "Có dữ liệu" : "Không có"
    //       );
    //       if (payload.geom && payload.geom.trim()) {
    //         // NẾU LÀ WKB HEX, GIỮ NGUYÊN VÀ GỬI LÊN SERVER
    //         if (payload.geom.startsWith("010") && payload.geom.length > 50) {
    //           console.log("✅ Giữ nguyên WKB hex geometry");
    //           // KHÔNG LÀM GÌ CẢ, GIỮ NGUYÊN payload.geom
    //         } else if (payload.geom.trim().startsWith("{")) {
    //           // NẾU LÀ GEOJSON, PARSE THÀNH OBJECT
    //           try {
    //             const parsed = JSON.parse(payload.geom);
    //             if (isValidGeoJSON(parsed)) {
    //               payload.geom = parsed;
    //               console.log("✅ Đã parse GeoJSON thành object");
    //             } else {
    //               console.warn("⚠️ GeoJSON không hợp lệ, xóa geometry");
    //               delete payload.geom;
    //             }
    //           } catch (error) {
    //             console.warn("⚠️ Lỗi parse GeoJSON, xóa geometry");
    //             delete payload.geom;
    //           }
    //         } else {
    //           console.warn("⚠️ Định dạng geometry không hợp lệ, xóa geometry");
    //           delete payload.geom;
    //         }
    //       } else {
    //         // Không có geometry, xóa khỏi payload
    //         delete payload.geom;
    //       }

    //       // Xử lý các trường optional
    //       payload.ten_chu = payload.ten_chu?.trim() || null;
    //       payload.ghi_chu = payload.ghi_chu?.trim() || null;
    //       payload.plot_list_id = payload.plot_list_id || null;

    //       console.log(
    //         "🚀 Payload cuối cùng:",
    //         JSON.stringify(payload, null, 2)
    //       );

    //       const response = await axios.put(
    //         `${API_URL}/api/land_plots/${formData.id}`,
    //         payload,
    //         {
    //           headers: {
    //             Authorization: `Bearer ${token}`,
    //             "Content-Type": "application/json",
    //           },
    //         }
    //       );

    //       if (response.data.success) {
    //         setSuccess("Cập nhật thửa đất thành công!");
    //         onPlotUpdated?.(response.data.data);
    //         setTimeout(() => handleClose(), 1000);
    //         return true;
    //       } else {
    //         setError(response.data.message || "Có lỗi xảy ra khi cập nhật");
    //         return false;
    //       }
    //     } catch (error) {
    //       console.error("Error updating land plot:", error);
    //       if (error.response) {
    //         const errorMessage =
    //           error.response.data?.message ||
    //           error.response.data?.error ||
    //           "Có lỗi xảy ra khi cập nhật";
    //         setError(errorMessage);
    //         if (error.response.status === 422 && error.response.data.errors) {
    //           console.error(
    //             "📋 Lỗi validation từ server:",
    //             error.response.data.errors
    //           );
    //           setErrors(error.response.data.errors);
    //         }
    //       } else if (error.request) {
    //         setError("Không thể kết nối đến server. Vui lòng thử lại.");
    //       } else {
    //         setError(error.message || "Có lỗi xảy ra");
    //       }
    //       return false;
    //     } finally {
    //       setLoading(false);
    //     }
    //   },
    //   [token, onPlotUpdated, processGeometryForServer]
    // );

    // ĐỊNH NGHĨA requiredFields Ở ĐÂY ĐỂ SỬ DỤNG TRONG handleSubmit
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

          // Tạo payload theo đúng backend expectation
          const payload = {
            // id: formData.id, // KHÔNG gửi id trong payload body
            ten_chu: formData.ten_chu?.trim() || null,
            so_to: formData.so_to ? parseInt(formData.so_to, 10) : null,
            so_thua: formData.so_thua ? parseInt(formData.so_thua, 10) : null,
            ky_hieu_mdsd: formData.ky_hieu_mdsd?.trim() || null,
            phuong_xa: formData.phuong_xa?.trim() || null,
            plot_list_id: formData.plot_list_id || null,
          };

          console.log("🔄 Payload gửi lên server:", payload);
          console.log("📝 ID thửa đất:", formData.id);

          // XỬ LÝ GEOMETRY
          if (formData.geom && formData.geom.trim()) {
            if (formData.geom.startsWith("010") && formData.geom.length > 50) {
              console.log("✅ Giữ nguyên WKB hex geometry");
              // Backend không xử lý WKB, bỏ qua
            } else if (formData.geom.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(formData.geom);
                if (isValidGeoJSON(parsed)) {
                  payload.geom = parsed;
                  console.log("✅ Đã parse GeoJSON thành object");
                }
              } catch (error) {
                console.warn("⚠️ Lỗi parse GeoJSON, không gửi geometry");
              }
            }
          }

          console.log(
            "🚀 Gửi request đến:",
            `${API_URL}/api/land_plots/${formData.id}`
          );
          console.log("📦 Payload cuối cùng:", payload);

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

          console.log("✅ Response từ server:", response.data);

          if (response.data.success) {
            setSuccess("Cập nhật thửa đất thành công!");
            console.log(
              "🎉 Cập nhật thành công, dữ liệu trả về:",
              response.data.data
            );
            onPlotUpdated?.(response.data.data);
            setTimeout(() => handleClose(), 1000);
            return true;
          } else {
            setError(response.data.message || "Có lỗi xảy ra khi cập nhật");
            return false;
          }
        } catch (error) {
          console.error("❌ Error updating land plot:", error);
          if (error.response) {
            console.error("📋 Server response:", error.response);
            console.error("📋 Server data:", error.response.data);
            console.error("📋 Server status:", error.response.status);

            const errorMessage =
              error.response.data?.message ||
              error.response.data?.error ||
              "Có lỗi xảy ra khi cập nhật";
            setError(errorMessage);

            if (error.response.status === 422 && error.response.data.errors) {
              console.error(
                "📋 Lỗi validation từ server:",
                error.response.data.errors
              );
              setErrors(error.response.data.errors);
            }
          } else if (error.request) {
            console.error("❌ Không có response từ server:", error.request);
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
          } else {
            console.error("❌ Lỗi khác:", error.message);
            setError(error.message || "Có lỗi xảy ra");
          }
          return false;
        } finally {
          setLoading(false);
        }
      },
      [token, onPlotUpdated]
    );
    const requiredFields = [
      "so_to",
      "so_thua",
      "ky_hieu_mdsd",
      "dien_tich",
      "phuong_xa",
    ];

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
      const isComplete = progress === 100 && Object.keys(errors).length === 0;

      // Kiểm tra từng field
      requiredFields.forEach((field) => {
        const value = formData[field];
        const hasValue = value && value.toString().trim();
        const hasError = errors[field];
        console.log(
          `- ${field}: value="${value}", hasValue=${hasValue}, hasError=${hasError}`
        );
      });

      return {
        progress,
        isComplete,
        filledFields: filledRequiredFields.length,
        totalFields: requiredFields.length,
      };
    }, [formData, errors]);

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        console.log("🎯 Bắt đầu submit form...");
        console.log("📝 Form data:", formData);

        const allTouched = Object.keys(formData).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setTouched(allTouched);

        const newErrors = validateForm(formData);
        console.log("🔍 Validation errors:", newErrors);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
          const errorFields = Object.keys(newErrors).filter(
            (key) => newErrors[key]
          );
          const errorMsg =
            "Vui lòng kiểm tra lại các trường: " + errorFields.join(", ");
          console.log("❌ Lỗi validation:", errorMsg);
          setError(errorMsg);
          return;
        }

        // Kiểm tra form status
        const currentStatus = formStatus;
        console.log("📊 Form status trước khi gửi:", currentStatus);

        if (!currentStatus.isComplete) {
          const missingFields = requiredFields.filter(
            (field) => !formData[field] || !formData[field].toString().trim()
          );
          setError(
            `Vui lòng điền đầy đủ thông tin: ${missingFields.join(", ")}`
          );
          return;
        }

        const submitData = {
          ...formData,
          ten_chu: formData.ten_chu.trim() || null,
          dien_tich: formData.dien_tich.trim(),
          so_to: parseInt(formData.so_to),
          so_thua: parseInt(formData.so_thua),
          ghi_chu: formData.ghi_chu.trim() || null,
        };

        // console.log("🚀 Gửi dữ liệu:", submitData);
        await fetchLandPlotEdit(submitData);
      },
      [formData, validateForm, fetchLandPlotEdit, formStatus]
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

    if (!show) return null;

    const isLoading = loading || externalLoading;

    return (
      <div className="blue-modal-overlay">
        <div
          className={`blue-modal-content ${
            isMapExpanded ? "expanded-modal" : "large-modal"
          }`}
        >
          <div className="blue-modal-header" style={{ maxWidth: "100%" }}>
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
                <div>
                  <h2
                    className="blue-modal-title"
                    style={{ color: "white", paddingBottom: "5px" }}
                  >
                    Chỉnh Sửa Thửa Đất
                  </h2>
                  <p className="modal-subtitle">
                    Cập nhật thông tin thửa đất số {plotData?.so_thua || ""} tờ{" "}
                    {plotData?.so_to || ""}
                  </p>
                </div>
              </div>
              <div className="header-actions">
                <div className="progress-indicator">
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
            {!isMapExpanded && (
              <div className="form-section">
                <form onSubmit={handleSubmit} className="blue-land-form">
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
                        </div>
                        <div className="form-group full-width">
                          <div className="geometry-section">
                            <div className="geometry-header">
                              <label className="blue-field-label">
                                <FaDrawPolygon className="label-icon" />
                                Dữ liệu Hình học (Geometry)
                              </label>
                              <button
                                type="button"
                                onClick={toggleGeometryInput}
                                className="geometry-toggle-button"
                              >
                                {showGeometryInput ? "Ẩn" : "Hiện"} Dữ liệu
                                Geometry
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
                                  placeholder='Nhập dữ liệu GeoJSON (VD: {"type": "Polygon", "coordinates": [[[106.38111,10.35724],[106.38689,10.35724],[106.38689,10.35174],[106.38111,10.35174],[106.38111,10.35724]]]})'
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
                                <div className="input-hint">
                                  Nhập dữ liệu hình học dạng GeoJSON (tùy chọn).
                                  Đảm bảo định dạng JSON hợp lệ.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
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
                        // disabled={isLoading || !formStatus.isComplete}
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
            {showMap && (
              <div className={`map-section ${isMapExpanded ? "expanded" : ""}`}>
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
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default LandPlotEdit;
