import React, { useState, useCallback, useEffect, useMemo } from "react";
import { landPlotApi } from "./services/landPlotApi";
import {
  checkValidGeometry,
  wkbToGeoJSON,
  isValidGeoJSON,
  processGeometryForServer,
} from "./utils/geometryUtils";
import {
  FaInfoCircle,
  FaPlus,
  FaMinus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLayerGroup,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validateForm } from "./utils/validationUtils";
import LandPlotHeader from "../landPlot/Components/LandPlotHeader";
import LandPlotForm from "../landPlot/Components/LandPlotForm";
import LandUseDetails from "../landPlot/Components/LandUseDetails";
import GeometrySection from "../landPlot/Components/GeometrySection";
import MapSection from "../landPlot/Components/MapSection";
import FormActions from "../landPlot/Components/FormActions";
import "../landPlot/css/LandPlotEdit.css";

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
    fetchLandPlot,
  }) => {
    const [formData, setFormData] = useState({
      id: "",
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
    const [autoDistribute, setAutoDistribute] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState([]);

    const isValidDienTich = useCallback(() => {
      if (!formData.dien_tich || formData.dien_tich.toString().trim() === "")
        return false;
      const dienTich = parseFloat(formData.dien_tich.replace(",", "."));
      return !isNaN(dienTich) && dienTich > 0;
    }, [formData.dien_tich]);

    const totalDetailArea = useMemo(() => {
      return formData.land_use_details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.dien_tich) || 0);
      }, 0);
    }, [formData.land_use_details]);

    const areaMatch = useMemo(() => {
      if (formData.land_use_details.length === 0) return true;
      const totalArea = parseFloat(formData.dien_tich) || 0;
      return Math.abs(totalDetailArea - totalArea) < 0.01;
    }, [totalDetailArea, formData.dien_tich, formData.land_use_details.length]);

    const handleSelectDetail = useCallback((index) => {
      setSelectedDetails((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    }, []);

    const handleSelectAllDetails = useCallback(() => {
      setSelectedDetails((prev) =>
        prev.length === formData.land_use_details.length
          ? []
          : formData.land_use_details.map((_, index) => index)
      );
    }, [formData.land_use_details.length]);

    const handleRemoveSelectedDetails = useCallback(() => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.filter(
          (_, index) => !selectedDetails.includes(index)
        ),
      }));
      setSelectedDetails([]);
    }, [selectedDetails]);

    const handleAutoDistribute = useCallback(() => {
      const totalArea = parseFloat(formData.dien_tich) || 0;
      const count = formData.land_use_details.length;
      if (count > 0 && totalArea > 0) {
        const equalArea = totalArea / count;
        setFormData((prev) => ({
          ...prev,
          land_use_details: prev.land_use_details.map((detail) => ({
            ...detail,
            dien_tich: equalArea.toFixed(2),
          })),
        }));
      }
    }, [formData.dien_tich, formData.land_use_details.length]);

    const handleToggleDetailGeometry = useCallback((index) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.map((detail, i) =>
          i === index
            ? { ...detail, showGeometry: !detail.showGeometry }
            : detail
        ),
      }));
    }, []);

    useEffect(() => {
      if (show && plotData) {
        const newFormData = {
          id: plotData.id || "",
          ten_chu: plotData.ten_chu || "",
          so_to: plotData.so_to || "",
          so_thua: plotData.so_thua || "",
          ky_hieu_mdsd: plotData.ky_hieu_mdsd || [],
          dien_tich: plotData.dien_tich?.toString() || "",
          phuong_xa: plotData.phuong_xa || "",
          ghi_chu: plotData.ghi_chu || "",
          plot_list_id: plotData.plot_list_id || "",
          geom: plotData.geom || null,
          status: "available",
          land_use_details:
            plotData.land_use_details && plotData.land_use_details.length > 0
              ? plotData.land_use_details.map((detail) => ({
                  ...detail,
                  dien_tich:
                    detail.dien_tich || plotData.dien_tich?.toString() || "",
                }))
              : plotData.ky_hieu_mdsd.length === 1
              ? [
                  {
                    ky_hieu_mdsd: plotData.ky_hieu_mdsd[0] || "",
                    dien_tich: plotData.dien_tich?.toString() || "",
                    geometry: null,
                    showGeometry: false,
                  },
                ]
              : plotData.ky_hieu_mdsd.map((type) => ({
                  ky_hieu_mdsd: type,
                  dien_tich: "",
                  geometry: null,
                  showGeometry: false,
                })),
        };
        if (newFormData.so_to) newFormData.so_to = newFormData.so_to.toString();
        if (newFormData.so_thua)
          newFormData.so_thua = newFormData.so_thua.toString();
        if (newFormData.dien_tich)
          newFormData.dien_tich = newFormData.dien_tich
            .replace(/[^0-9.,]/g, "")
            .replace(/^0+/, "0");
        if (
          typeof newFormData.geom === "string" &&
          newFormData.geom.trim().startsWith("{")
        ) {
          try {
            newFormData.geom = JSON.parse(newFormData.geom);
          } catch (e) {
            console.warn("Failed to parse geometry:", e);
            newFormData.geom = null;
          }
        }
        setFormData(newFormData);
        const hasGeometry = checkValidGeometry(newFormData.geom);
        setHasValidGeometry(hasGeometry);
        setErrors({});
        setTouched({});
        setSuccess("");
        setError("");
        setIsMapExpanded(false);
      } else if (show && !plotData) {
        setFormData({
          id: "",
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
        setHasValidGeometry(false);
        setErrors({});
        setTouched({});
        setSuccess("");
        setError("");
      }
    }, [show, plotData]);

    const requiredFields = [
      "so_to",
      "so_thua",
      "ky_hieu_mdsd",
      "dien_tich",
      "phuong_xa",
    ];

    const formStatus = useMemo(() => {
      // Trong chế độ edit, chỉ tính progress dựa trên các trường đã được nhập
      const filledRequiredFields = requiredFields.filter((field) => {
        if (field === "ky_hieu_mdsd") {
          return formData[field] && formData[field].length > 0;
        }
        if (field === "dien_tich") {
          return isValidDienTich();
        }
        return formData[field] && formData[field].toString().trim();
      });

      // Trong edit mode, form được coi là complete nếu không có lỗi
      const progress = plotData
        ? (filledRequiredFields.length / requiredFields.length) * 100
        : (filledRequiredFields.length / requiredFields.length) * 100;

      const isComplete = plotData
        ? Object.keys(errors).length === 0
        : progress === 100 && Object.keys(errors).length === 0;

      return {
        progress,
        isComplete,
        filledFields: filledRequiredFields.length,
        totalFields: requiredFields.length,
      };
    }, [formData, errors, isValidDienTich, plotData]);

    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === "dien_tich")
          processedValue = value.replace(/[^0-9.,]/g, "").replace(/^0+/, "0");
        setFormData((prev) => ({ ...prev, [name]: processedValue }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
      },
      [errors]
    );

    const handleAddLandUseType = useCallback(() => {
      setFormData((prev) => ({
        ...prev,
        ky_hieu_mdsd: [...prev.ky_hieu_mdsd, ""],
      }));
    }, []);

    const handleRemoveLandUseType = useCallback((index) => {
      setFormData((prev) => ({
        ...prev,
        ky_hieu_mdsd: prev.ky_hieu_mdsd.filter((_, i) => i !== index),
      }));
    }, []);

    const handleLandUseTypeChange = useCallback((index, value) => {
      setFormData((prev) => ({
        ...prev,
        ky_hieu_mdsd: prev.ky_hieu_mdsd.map((item, i) =>
          i === index ? value.toUpperCase() : item
        ),
      }));
    }, []);

    // const handleAddLandUseDetail = useCallback(() => {
    //   if (formData.ky_hieu_mdsd.length > 1) {
    //     const totalArea = parseFloat(formData.dien_tich) || 0;
    //     const currentDetails = formData.land_use_details.length;
    //     const newDienTich =
    //       currentDetails > 0 ? totalArea / (currentDetails + 1) : totalArea;
    //     setFormData((prev) => {
    //       const newDetails = [
    //         ...prev.land_use_details,
    //         {
    //           ky_hieu_mdsd:
    //             prev.ky_hieu_mdsd[currentDetails % prev.ky_hieu_mdsd.length] ||
    //             "",
    //           dien_tich: newDienTich.toFixed(2),
    //           geometry: null,
    //           showGeometry: false,
    //         },
    //       ];
    //       return { ...prev, land_use_details: newDetails };
    //     });
    //   }
    // }, [
    //   formData.ky_hieu_mdsd,
    //   formData.dien_tich,
    //   formData.land_use_details.length,
    // ]);
    const handleAddLandUseDetail = useCallback(() => {
      const totalArea = parseFloat(formData.dien_tich) || 0;
      const currentDetails = formData.land_use_details.length;
      const newDienTich =
        currentDetails > 0 ? totalArea / (currentDetails + 1) : totalArea;

      // Gợi ý ky_hieu_mdsd từ danh sách hiện có, nếu hết thì để trống
      const availableKyHieu =
        formData.ky_hieu_mdsd.length > 0
          ? formData.ky_hieu_mdsd[currentDetails % formData.ky_hieu_mdsd.length]
          : "";
      setFormData((prev) => {
        const newDetails = [
          ...prev.land_use_details,
          {
            ky_hieu_mdsd: availableKyHieu || "", // Trống nếu không có gợi ý
            dien_tich: newDienTich.toFixed(2),
            geometry: null,
            showGeometry: false,
            color: "#868e96", // Mặc định màu
          },
        ];
        console.log("🔍 Added new detail:", newDetails); // Debug
        return { ...prev, land_use_details: newDetails };
      });
    }, [
      formData.ky_hieu_mdsd,
      formData.dien_tich,
      formData.land_use_details.length,
    ]);

    const handleRemoveLandUseDetail = useCallback((index) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.filter((_, i) => i !== index),
      }));
    }, []);

    const handleLandUseDetailChange = useCallback((index, field, value) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.map((detail, i) =>
          i === index ? { ...detail, [field]: value } : detail
        ),
      }));
    }, []);

    // const handleLandUseDetailGeometryChange = useCallback(
    //   (index, geometry) => {
    //     setFormData((prev) => ({
    //       ...prev,
    //       land_use_details: prev.land_use_details.map((detail, i) => {
    //        if (i === index) {
    //           let parsedGeometry = geometry;

    //           if (typeof geometry === "string") {
    //             try {
    //               parsedGeometry = JSON.parse(geometry);
    //             } catch (e) {
    //               console.warn("Failed to parse geometry:", e);
    //               // parsedGeometry = null;
    //               parsedGeometry = geometry;
    //             }
    //           }
    //           return { ...detail, geometry: parsedGeometry };
    //         }
    //       return detail;
    //     }),

    //   }));
    // }, []);
    const handleLandUseDetailGeometryChange = useCallback((index, geometry) => {
      setFormData((prev) => {
        const newDetails = prev.land_use_details.map((detail, i) => {
          if (i === index) {
            let parsedGeometry = geometry;
            if (typeof geometry === "string") {
              try {
                parsedGeometry = JSON.parse(geometry);
              } catch (e) {
                console.warn(`Failed to parse geometry at index ${index}:`, e);
                parsedGeometry = geometry; // Giữ nguyên string nếu lỗi
              }
            }
            console.log(
              `🔍 Geometry updated at index ${index}:`,
              parsedGeometry
            ); // Debug
            return { ...detail, geometry: parsedGeometry };
          }
          return detail;
        });
        return { ...prev, land_use_details: newDetails };
      });
    }, []);

    const handleGeometryChange = useCallback((e) => {
      const { value } = e.target;
      setFormData((prev) => ({ ...prev, geom: value }));
      if (value.trim()) {
        try {
          const parsed = JSON.parse(value);
          if (isValidGeoJSON(parsed)) {
            setErrors((prev) => ({ ...prev, geom: "" }));
            setHasValidGeometry(true);
          } else {
            throw new Error("Cấu trúc GeoJSON không hợp lệ");
          }
        } catch (error) {
          let errorMessage = "Định dạng JSON không hợp lệ";
          if (error.message.includes("JSON"))
            errorMessage = "Lỗi cú pháp JSON. Kiểm tra dấu ngoặc và dấu phẩy.";
          else if (error.message.includes("GeoJSON"))
            errorMessage =
              "Cấu trúc GeoJSON không đúng. Cần có 'type' và 'coordinates' hợp lệ.";
          setErrors((prev) => ({ ...prev, geom: errorMessage }));
          setHasValidGeometry(false);
        }
      } else {
        setErrors((prev) => ({ ...prev, geom: "" }));
        setHasValidGeometry(false);
      }
    }, []);

    const formatGeometryJSON = useCallback(() => {
      if (!formData.geom?.trim()) return;
      try {
        const parsed = JSON.parse(formData.geom);
        const formatted = JSON.stringify(parsed, null, 2);
        setFormData((prev) => ({ ...prev, geom: formatted }));
        setErrors((prev) => ({ ...prev, geom: "" }));
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          geom: "Không thể format: JSON không hợp lệ",
        }));
      }
    }, [formData.geom]);

    const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
    }, []);

    const toggleGeometryInput = useCallback(() => {
      setShowGeometryInput((prev) => !prev);
    }, []);

    const toggleMap = useCallback(() => {
      setShowMap((prev) => !prev);
    }, []);

    const toggleMapExpand = useCallback(() => {
      setIsMapExpanded((prev) => !prev);
    }, []);

    const handleClose = useCallback(() => {
      setFormData({
        id: "",
        ten_chu: "",
        so_to: "",
        so_thua: "",
        ky_hieu_mdsd: [],
        dien_tich: "",
        phuong_xa: "",
        ghi_chu: "",
        geom: null,
        status: "available",
        land_use_details: [],
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

    const fetchLandPlotEdit = useCallback(
      async (submitData) => {
        if (!token) {
          setError("Vui lòng đăng nhập trước");
          return false;
        }
        try {
          setLoading(true);
          setError(null);
          setErrors({});

          const payload = {
            ten_chu: submitData.ten_chu?.trim() || null,
            so_to: submitData.so_to ? parseInt(submitData.so_to, 10) : null,
            so_thua: submitData.so_thua
              ? parseInt(submitData.so_thua, 10)
              : null,
            ky_hieu_mdsd: submitData.ky_hieu_mdsd || [],
            dien_tich: submitData.dien_tich
              ? parseFloat(String(submitData.dien_tich).replace(",", "."))
              : null,
            phuong_xa: submitData.phuong_xa?.trim() || null,
            ghi_chu: submitData.ghi_chu?.trim() || null,
            plot_list_id: submitData.plot_list_id || null,
            status: submitData.status || "available",
          };

          if (submitData.geom) {
            let finalGeom = processGeometryForServer(submitData.geom);

            if (
              typeof submitData.geom === "string" &&
              submitData.geom.trim().startsWith("{")
            ) {
              try {
                const parsed = JSON.parse(submitData.geom);
                if (isValidGeoJSON(parsed)) finalGeom = parsed;
              } catch (error) {
                console.warn("⚠️ Lỗi parse GeoJSON, không gửi geometry", error);
                finalGeom = submitData.geom;
              }
            }
            if (isValidGeoJSON(finalGeom))
              payload.geom = wkbToGeoJSON(finalGeom);
            payload.geom = finalGeom;
          }

          // Trong hàm fetchLandPlotEdit, sửa phần xử lý land_use_details:
          if (
            submitData.land_use_details &&
            submitData.land_use_details.length > 0
          ) {
            payload.land_use_details = submitData.land_use_details.map(
              (detail) => {
                const detailPayload = {
                  ky_hieu_mdsd: detail.ky_hieu_mdsd,
                  dien_tich: detail.dien_tich
                    ? parseFloat(detail.dien_tich)
                    : null,
                  geometry: detail.geometry ? detail.geometry : null,
                  color: detail.color || null,
                };

                // Xử lý geometry nếu có
                if (detail.geometry) {
                  if (
                    typeof detail.geometry === "string" &&
                    detail.geometry.trim().startsWith("{")
                  ) {
                    try {
                      const parsed = JSON.parse(detail.geometry);
                      if (isValidGeoJSON(parsed))
                        detailPayload.geometry = parsed;
                    } catch (error) {
                      console.warn(
                        `⚠️ Lỗi parse GeoJSON cho detail ${detail.ky_hieu_mdsd}:`,
                        error
                      );
                      detailPayload.geometry = detail.geometry; // Giữ nguyên nếu không parse được
                    }
                  } else if (isValidGeoJSON(detail.geometry)) {
                    detailPayload.geometry = detail.geometry;
                  }
                }

                console.log(`🔍 [DETAIL PAYLOAD] ${detail.ky_hieu_mdsd}:`, {
                  dien_tich: detailPayload.dien_tich,
                  hasGeometry: !!detailPayload.geometry,
                  hasColor: !!detailPayload.color,
                });

                return detailPayload;
              }
            );

            console.log(
              `✅ Sẽ gửi ${payload.land_use_details.length} chi tiết:`,
              payload.land_use_details.map(
                (d) => `${d.ky_hieu_mdsd} (geom: ${!!d.geometry})`
              )
            );
          }

          console.log("📤 Final payload gửi lên server:", payload);

          const response = await landPlotApi.updateLandPlot(
            formData.id,
            payload,
            token
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
          console.error("❌ Error updating land plot:", error);
          if (error.response) {
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
      [token, onPlotUpdated, formData.geom, handleClose]
    );

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();
        console.log("🔍 handleSubmit triggered", { formData, errors });

        const allTouched = Object.keys(formData).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setTouched(allTouched);

        // Sử dụng validateForm với chế độ edit
        const newErrors = validateForm(formData, true); // true = isEditMode
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
          const errorFields = Object.keys(newErrors).filter(
            (key) => newErrors[key]
          );
          const errorMsg =
            "⚠️ Có lỗi trong các trường: " + errorFields.join(", ");
          setError(errorMsg);
          toast.error(errorMsg, {
            position: "top-right",
            autoClose: 4000,
          });
          return;
        }

        // Kiểm tra xem có ít nhất một trường được thay đổi không
        const hasChanges = Object.keys(formData).some((key) => {
          if (key === "geom") {
            return formData.geom !== plotData?.geom;
          }
          if (key === "land_use_details") {
            return (
              JSON.stringify(formData.land_use_details) !==
              JSON.stringify(plotData?.land_use_details)
            );
          }
          return formData[key] !== plotData?.[key];
        });

        if (!hasChanges && plotData) {
          const noChangeMsg = "⚠️ Không có thay đổi nào để cập nhật";
          setError(noChangeMsg);
          toast.warn(noChangeMsg, {
            position: "top-right",
            autoClose: 4000,
          });
          return;
        }

        const submitData = {
          ...formData,
          ten_chu: formData.ten_chu?.trim() || null,
          so_to: formData.so_to ? parseInt(formData.so_to) : null,
          so_thua: formData.so_thua ? parseInt(formData.so_thua) : null,
          dien_tich: formData.dien_tich
            ? parseFloat(formData.dien_tich.replace(",", "."))
            : null,
          ghi_chu: formData.ghi_chu?.trim() || null,
        };

        // Hiển thị loading trước khi gửi
        const toastId = toast.loading("Đang lưu thay đổi...");

        try {
          const result = await fetchLandPlotEdit(submitData);

          if (!result || result.success === false) {
            toast.update(toastId, {
              render:
                result?.message ||
                "Không thể cập nhật thửa đất. Vui lòng thử lại!",
              type: "error",
              isLoading: false,
              autoClose: 4000,
              closeOnClick: true,
            });
            return;
          }

          await fetchLandPlot();
          toast.update(toastId, {
            render: "✅ Cập nhật thửa đất thành công!",
            type: "success",
            isLoading: false,
            autoClose: 2500,
            closeOnClick: true,
          });
        } catch (error) {
          const errMsg =
            error.response?.data?.message || "Đã xảy ra lỗi khi lưu dữ liệu!";
          toast.update(toastId, {
            render: errMsg,
            type: "error",
            isLoading: false,
            autoClose: 4000,
            closeOnClick: true,
          });
        }
      },
      [formData, plotData, fetchLandPlotEdit, fetchLandPlot]
    );

    const isLoading = loading || externalLoading;

    if (!show) return null;

    return (
      <div className="blue-modal-overlay">
        <div
          className={`blue-modal-content ${
            isMapExpanded ? "expanded-modal" : "large-modal"
          }`}
        >
          <LandPlotHeader
            plotData={plotData}
            formStatus={formStatus}
            handleClose={handleClose}
            isLoading={isLoading}
          />
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
                      <div className="success-message">{success}</div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                  </div>
                  <div className="form-tabs">
                    <button
                      type="button"
                      className={`tab-button ${
                        activeTab === "info" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("info")}
                    >
                      Thông tin cơ bản
                    </button>
                    <button
                      type="button"
                      className={`tab-button ${
                        activeTab === "details" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("details")}
                    >
                      Chi tiết sử dụng ({formData.land_use_details.length})
                    </button>
                  </div>
                  {activeTab === "info" ? (
                    <LandPlotForm
                      formData={formData}
                      errors={errors}
                      isLoading={isLoading}
                      phuongXaOptions={phuongXaOptions}
                      plotListOptions={plotListOptions}
                      handleInputChange={handleInputChange}
                      handleAddLandUseType={handleAddLandUseType}
                      handleRemoveLandUseType={handleRemoveLandUseType}
                      handleLandUseTypeChange={handleLandUseTypeChange}
                      handleGeometryChange={handleGeometryChange}
                      formatGeometryJSON={formatGeometryJSON}
                      showGeometryInput={showGeometryInput}
                      toggleGeometryInput={toggleGeometryInput}
                      handleBlur={handleBlur}
                      isValidDienTich={isValidDienTich}
                      autoDistribute={autoDistribute}
                      setAutoDistribute={setAutoDistribute}
                      hasValidGeometry={hasValidGeometry}
                      selectedDetails={selectedDetails}
                    />
                  ) : (
                    <LandUseDetails
                      formData={formData}
                      errors={errors}
                      isLoading={isLoading}
                      autoDistribute={autoDistribute}
                      setAutoDistribute={setAutoDistribute}
                      selectedDetails={selectedDetails}
                      handleSelectDetail={handleSelectDetail}
                      handleSelectAllDetails={handleSelectAllDetails}
                      handleRemoveSelectedDetails={handleRemoveSelectedDetails}
                      handleAddLandUseDetail={handleAddLandUseDetail}
                      handleRemoveLandUseDetail={handleRemoveLandUseDetail}
                      handleLandUseDetailChange={handleLandUseDetailChange}
                      handleLandUseDetailGeometryChange={
                        handleLandUseDetailGeometryChange
                      }
                      handleToggleDetailGeometry={handleToggleDetailGeometry}
                      totalDetailArea={totalDetailArea}
                      areaMatch={areaMatch}
                      handleAutoDistribute={handleAutoDistribute}
                      handleGeometryChange={handleGeometryChange}
                      formatGeometryJSON={formatGeometryJSON}
                      toggleGeometryInput={toggleGeometryInput}
                      showGeometryInput={showGeometryInput}
                      handleBlur={handleBlur}
                      setFormData={setFormData}
                      hasValidGeometry={hasValidGeometry}
                      setHasValidGeometry={setHasValidGeometry}
                    />
                  )}
                  {/* <GeometrySection error={error} success={success} /> */}
                  <GeometrySection
                    formData={formData}
                    errors={errors}
                    touched={touched}
                    showGeometryInput={showGeometryInput}
                    handleGeometryChange={handleGeometryChange}
                    formatGeometryJSON={formatGeometryJSON}
                    toggleGeometryInput={toggleGeometryInput}
                    handleBlur={handleBlur}
                    loading={isLoading}
                  />
                  <FormActions
                    isLoading={isLoading}
                    formStatus={formStatus}
                    handleClose={handleClose}
                    handleSubmit={handleSubmit}
                    showMap={showMap}
                    hasValidGeometry={hasValidGeometry}
                    toggleMap={toggleMap}
                    isMapExpanded={isMapExpanded}
                    toggleMapExpand={toggleMapExpand}
                    isEditMode={!!plotData}
                  />
                </form>
              </div>
            )}
            {showMap && (
              <MapSection
                geom={formData.geom}
                plotInfo={{
                  so_to: formData.so_to,
                  so_thua: formData.so_thua,
                  dien_tich: formData.dien_tich,
                }}
                isMapExpanded={isMapExpanded}
                toggleMapExpand={toggleMapExpand}
                hasValidGeometry={hasValidGeometry}
              />
            )}
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }
);

export default LandPlotEdit;
