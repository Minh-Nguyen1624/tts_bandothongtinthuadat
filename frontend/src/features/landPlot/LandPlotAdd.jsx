import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
  useRef,
} from "react";
import { FaStickyNote } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { notification } from "antd";
// import "../css/landPlotAdd.css";
import "../landPlot/css/landPlotAdd.css";
import LandPlotAddHeader from "../../features/landPlot/Components/LandPlotAddHeader";
import LandPlotAddForm from "../../features/landPlot/Components/LandPlotAddForm";
import LandUseDetailsSection from "../../features/landPlot/Components/LandUseDetailsAddSection";
import GeometrySection from "../../features/landPlot/Components/GeometryAddSection";
import FormActions from "../../features/landPlot/Components/FormAddActions";
// import { validateForm } from "./utils/validationAddUtils";
// import { searchPlotList } from "./utils/plotListUtils";
import useLandPlotForm from "../../hooks/useLandPlotForm";

// const LandPlotAdd = memo(
//   ({
//     show,
//     onClose,
//     onSubmit,
//     loading,
//     phuongXaOptions,
//     plotListOptions = [],
//     fetchLandPlots,
//     // errors,
//   }) => {
//     const [formData, setFormData] = useState({
//       ten_chu: "",
//       so_to: "",
//       so_thua: "",
//       ky_hieu_mdsd: [],
//       dien_tich: "",
//       phuong_xa: "",
//       ghi_chu: "",
//       plot_list_id: "",
//       geom: null,
//       status: "available",
//       land_use_details: [],
//     });

//     const [errors, setErrors] = useState({});
//     const [touched, setTouched] = useState({});
//     const [showGeometryInput, setShowGeometryInput] = useState(false);
//     const [plotListInfo, setPlotListInfo] = useState(null);
//     const [isSearchingPlotList, setIsSearchingPlotList] = useState(false);
//     const [autoDistributeEnabled, setAutoDistributeEnabled] = useState(true);

//     const searchTimeoutRef = useRef(null);
//     const formDataRef = useRef(formData);

//     useEffect(() => {
//       formDataRef.current = formData;
//     }, [formData]);

//     useEffect(() => {
//       if (show) {
//         setFormData({
//           ten_chu: "",
//           so_to: "",
//           so_thua: "",
//           ky_hieu_mdsd: [],
//           dien_tich: "",
//           phuong_xa: "",
//           ghi_chu: "",
//           plot_list_id: "",
//           geom: null,
//           status: "available",
//           land_use_details: [],
//         });
//         setErrors({});
//         setTouched({});
//         setShowGeometryInput(false);
//         setPlotListInfo(null);
//         setAutoDistributeEnabled(true);
//       }
//     }, [show]);

//     useEffect(() => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }

//       searchTimeoutRef.current = setTimeout(() => {
//         searchPlotList(
//           formData.so_to,
//           formData.so_thua,
//           setPlotListInfo,
//           setFormData,
//           setIsSearchingPlotList
//         );
//       }, 500);

//       return () => {
//         if (searchTimeoutRef.current) {
//           clearTimeout(searchTimeoutRef.current);
//         }
//       };
//     }, [formData.so_to, formData.so_thua]);

//     // const handleInputChange = useCallback(
//     //   (e) => {
//     //     const { name, value } = e.target;
//     //     let processedValue = value;

//     //     if (name === "ky_hieu_mdsd") {
//     //       processedValue = value
//     //         .split(/[,+\s]+/)
//     //         .map((type) => type.trim().toUpperCase())
//     //         .filter((type) => type.length > 0);

//     //       if (
//     //         autoDistributeEnabled &&
//     //         plotListInfo &&
//     //         processedValue.length > 1 &&
//     //         formData.land_use_details.length === 0
//     //       ) {
//     //         const totalArea = parseFloat(formData.dien_tich) || 0;
//     //         const defaultDetails = processedValue.map((type) => ({
//     //           ky_hieu_mdsd: type,
//     //           dien_tich: (totalArea / processedValue.length).toFixed(2),
//     //           geometry: null,
//     //         }));
//     //         setFormData((prev) => ({
//     //           ...prev,
//     //           ky_hieu_mdsd: processedValue,
//     //           land_use_details: defaultDetails,
//     //         }));
//     //         return;
//     //       }
//     //     }

//     //     if (name === "dien_tich") {
//     //       processedValue = value.replace(/[^0-9.,]/g, "");
//     //     }

//     //     setFormData((prev) => ({
//     //       ...prev,
//     //       [name]: processedValue,
//     //     }));

//     //     if (touched[name]) {
//     //       const newErrors = validateForm({
//     //         ...formDataRef.current,
//     //         [name]: processedValue,
//     //       });
//     //       setErrors((prev) => ({
//     //         ...prev,
//     //         [name]: newErrors[name] || "",
//     //       }));
//     //     }
//     //   },
//     //   [
//     //     touched,
//     //     validateForm,
//     //     plotListInfo,
//     //     autoDistributeEnabled,
//     //     formData.land_use_details.length,
//     //   ]
//     // );
//     const handleInputChange = useCallback(
//       (e) => {
//         const { name, value } = e.target;
//         let processedValue = value;

//         if (name === "ky_hieu_mdsd") {
//           // Tách chuỗi thành mảng để lưu vào formData
//           const types = value
//             .split(/[,+\s]+/)
//             .map((type) => type.trim().toUpperCase())
//             .filter((type) => type.length > 0);

//           if (
//             autoDistributeEnabled &&
//             plotListInfo &&
//             types.length > 1 &&
//             formData.land_use_details.length === 0
//           ) {
//             const totalArea = parseFloat(formData.dien_tich) || 0;
//             const defaultDetails = types.map((type) => ({
//               ky_hieu_mdsd: type,
//               dien_tich: (totalArea / types.length).toFixed(2),
//               geometry: null,
//             }));
//             setFormData((prev) => ({
//               ...prev,
//               ky_hieu_mdsd: types,
//               land_use_details: defaultDetails,
//             }));
//           } else {
//             setFormData((prev) => ({
//               ...prev,
//               ky_hieu_mdsd: types,
//             }));
//           }

//           // Không cần thay đổi processedValue cho ô input, để nguyên value
//         } else if (name === "dien_tich") {
//           processedValue = value.replace(/[^0-9.,]/g, "");
//           setFormData((prev) => ({
//             ...prev,
//             [name]: processedValue,
//           }));
//         } else {
//           setFormData((prev) => ({
//             ...prev,
//             [name]: processedValue,
//           }));
//         }

//         if (touched[name]) {
//           const newErrors = validateForm({
//             ...formDataRef.current,
//             [name]: name === "ky_hieu_mdsd" ? processedValue : value,
//           });
//           setErrors((prev) => ({
//             ...prev,
//             [name]: newErrors[name] || "",
//           }));
//         }
//       },
//       [
//         touched,
//         validateForm,
//         plotListInfo,
//         autoDistributeEnabled,
//         formData.land_use_details.length,
//       ]
//     );

//     const handleLandUseDetailChange = useCallback((index, field, value) => {
//       setFormData((prev) => {
//         const newDetails = [...prev.land_use_details];
//         newDetails[index] = {
//           ...newDetails[index],
//           [field]:
//             field === "dien_tich" ? value.replace(/[^0-9.,]/g, "") : value,
//         };
//         return { ...prev, land_use_details: newDetails };
//       });
//     }, []);

//     const bulkUpdateLandUseDetails = useCallback((updates) => {
//       setFormData((prev) => ({
//         ...prev,
//         land_use_details: updates,
//       }));
//     }, []);

//     const addLandUseDetail = useCallback(() => {
//       setFormData((prev) => {
//         const remainingArea = calculateRemainingArea(prev);
//         const newDetail = {
//           ky_hieu_mdsd: "",
//           dien_tich: remainingArea > 0 ? remainingArea.toFixed(2) : "",
//           geometry: null,
//         };
//         return {
//           ...prev,
//           land_use_details: [...prev.land_use_details, newDetail],
//         };
//       });
//     }, []);

//     const calculateRemainingArea = useCallback((data = formDataRef.current) => {
//       const totalArea = parseFloat(data.dien_tich) || 0;
//       const usedArea = data.land_use_details.reduce((sum, detail) => {
//         return sum + (parseFloat(detail.dien_tich) || 0);
//       }, 0);
//       return Math.max(0, totalArea - usedArea);
//     }, []);

//     const removeLandUseDetail = useCallback((index) => {
//       setFormData((prev) => ({
//         ...prev,
//         land_use_details: prev.land_use_details.filter((_, i) => i !== index),
//       }));
//     }, []);

//     const autoDistributeArea = useCallback(() => {
//       if (formData.land_use_details.length > 0 && formData.dien_tich) {
//         const totalArea = parseFloat(formData.dien_tich);
//         const equalArea = (
//           totalArea / formData.land_use_details.length
//         ).toFixed(2);
//         bulkUpdateLandUseDetails(
//           formData.land_use_details.map((detail) => ({
//             ...detail,
//             dien_tich: equalArea,
//           }))
//         );
//       }
//     }, [
//       formData.land_use_details,
//       formData.dien_tich,
//       bulkUpdateLandUseDetails,
//     ]);

//     const handleGeometryChange = useCallback(
//       (e) => {
//         const { value } = e.target;
//         setFormData((prev) => ({
//           ...prev,
//           geom: value,
//         }));

//         if (searchTimeoutRef.current) {
//           clearTimeout(searchTimeoutRef.current);
//         }

//         searchTimeoutRef.current = setTimeout(() => {
//           if (value.trim()) {
//             try {
//               JSON.parse(value);
//               if (errors.geom) {
//                 setErrors((prev) => ({
//                   ...prev,
//                   geom: "",
//                 }));
//               }
//             } catch {
//               setErrors((prev) => ({
//                 ...prev,
//                 geom: "Định dạng JSON không hợp lệ",
//               }));
//             }
//           } else {
//             if (errors.geom) {
//               setErrors((prev) => ({
//                 ...prev,
//                 geom: "",
//               }));
//             }
//           }
//         }, 300);
//       },
//       [errors.geom]
//     );

//     const formatGeometryJSON = useCallback(() => {
//       if (!formData.geom) return;

//       try {
//         const parsed = JSON.parse(formData.geom);
//         const formatted = JSON.stringify(parsed, null, 2);
//         setFormData((prev) => ({
//           ...prev,
//           geom: formatted,
//         }));
//         if (errors.geom) {
//           setErrors((prev) => ({ ...prev, geom: "" }));
//         }
//       } catch {
//         setErrors((prev) => ({
//           ...prev,
//           geom: "Không thể format: JSON không hợp lệ",
//         }));
//       }
//     }, [formData.geom, errors.geom]);

//     const handleBlur = useCallback((e) => {
//       const { name } = e.target;
//       setTouched((prev) => ({
//         ...prev,
//         [name]: true,
//       }));
//     }, []);

//     const toggleGeometryInput = useCallback(() => {
//       setShowGeometryInput((prev) => !prev);
//     }, []);

//     const toggleAutoDistribute = useCallback(() => {
//       setAutoDistributeEnabled((prev) => !prev);
//     }, []);

//     // const handleSubmit = useCallback(
//     //   async (e) => {
//     //     e.preventDefault();

//     //     const allTouched = Object.keys(formData).reduce((acc, key) => {
//     //       acc[key] = true;
//     //       return acc;
//     //     }, {});
//     //     setTouched(allTouched);

//     //     let parsedGeom = null;
//     //     if (formData.geom && formData.geom.trim()) {
//     //       try {
//     //         parsedGeom = JSON.parse(formData.geom);
//     //       } catch {
//     //         setErrors((prev) => ({
//     //           ...prev,
//     //           geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
//     //         }));
//     //         return;
//     //       }
//     //     }

//     //     const processedLandUseDetails = formData.land_use_details
//     //       .filter((detail) => detail.ky_hieu_mdsd.trim() && detail.dien_tich)
//     //       .map((detail) => ({
//     //         ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
//     //         dien_tich: parseFloat(detail.dien_tich.replace(",", ".")),
//     //         geometry: detail.geometry ? JSON.parse(detail.geometry) : null,
//     //       }));

//     //     const submitData = {
//     //       ...formData,
//     //       so_to: parseInt(formData.so_to),
//     //       so_thua: parseInt(formData.so_thua),
//     //       dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
//     //       plot_list_id: formData.plot_list_id || null,
//     //       geom: parsedGeom,
//     //       status: formData.ten_chu.trim() ? "owned" : "available",
//     //       ky_hieu_mdsd: formData.ky_hieu_mdsd,
//     //       land_use_details:
//     //         processedLandUseDetails.length > 0
//     //           ? processedLandUseDetails
//     //           : undefined,
//     //     };

//     //     const newErrors = validateForm(submitData);
//     //     setErrors(newErrors);

//     //     if (Object.keys(newErrors).length > 0) {
//     //       const firstErrorElement = document.querySelector(".error");
//     //       if (firstErrorElement) {
//     //         firstErrorElement.scrollIntoView({
//     //           behavior: "smooth",
//     //           block: "center",
//     //         });
//     //       }
//     //       return;
//     //     }

//     //     try {
//     //       await onSubmit(submitData);
//     //       if (fetchLandPlots) {
//     //         await fetchLandPlots();
//     //         alert("Thêm thửa đất thành công!");
//     //       }
//     //     } catch (error) {
//     //       alert(errors.message);
//     //       console.error("Error submitting form:", error);
//     //     }
//     //   },
//     //   [formData, onSubmit, validateForm, fetchLandPlots]
//     // );
//     // const handleSubmit = useCallback(
//     //   async (e) => {
//     //     e.preventDefault();

//     //     const allTouched = Object.keys(formData).reduce((acc, key) => {
//     //       acc[key] = true;
//     //       return acc;
//     //     }, {});
//     //     setTouched(allTouched);

//     //     let parsedGeom = null;
//     //     if (formData.geom && formData.geom.trim()) {
//     //       try {
//     //         parsedGeom = JSON.parse(formData.geom);
//     //       } catch {
//     //         setErrors((prev) => ({
//     //           ...prev,
//     //           geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
//     //         }));
//     //         return;
//     //       }
//     //     }

//     //     const processedLandUseDetails =
//     //       formData.land_use_details
//     //         ?.filter(
//     //           (detail) => detail.ky_hieu_mdsd?.trim() && detail.dien_tich
//     //         )
//     //         .map((detail) => ({
//     //           ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
//     //           dien_tich: parseFloat(detail.dien_tich.replace(",", ".")),
//     //           geometry: detail.geometry ? JSON.parse(detail.geometry) : null,
//     //         })) || [];

//     //     const submitData = {
//     //       ...formData,
//     //       so_to: parseInt(formData.so_to),
//     //       so_thua: parseInt(formData.so_thua),
//     //       dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
//     //       plot_list_id: formData.plot_list_id || null,
//     //       geom: parsedGeom,
//     //       status: formData.ten_chu?.trim() ? "owned" : "available",
//     //       ky_hieu_mdsd: formData.ky_hieu_mdsd,
//     //       land_use_details:
//     //         processedLandUseDetails.length > 0
//     //           ? processedLandUseDetails
//     //           : undefined,
//     //     };

//     //     const newErrors = validateForm(submitData);
//     //     setErrors(newErrors);

//     //     if (Object.keys(newErrors).length > 0) {
//     //       const firstErrorElement = document.querySelector(".error");
//     //       if (firstErrorElement) {
//     //         firstErrorElement.scrollIntoView({
//     //           behavior: "smooth",
//     //           block: "center",
//     //         });
//     //       }
//     //       return;
//     //     }

//     //     const toastId = toast.loading(" Đang gửi dữ liệu...");

//     //     try {
//     //       const result = await onSubmit(submitData);

//     //       //  Kiểm tra phản hồi thất bại
//     //       if (!result || result.success === false) {
//     //         toast.update(toastId, {
//     //           render:
//     //             result?.message ||
//     //             " Gửi thất bại: Không thể tìm thấy dữ liệu phù hợp!",
//     //           type: "error",
//     //           isLoading: false,
//     //           autoClose: 4000,
//     //           closeOnClick: true,
//     //         });
//     //         return; // Dừng lại — không hiện success
//     //       }

//     //       // ✅ Thành công
//     //       if (fetchLandPlots) {
//     //         await fetchLandPlots();
//     //       }

//     //       toast.update(toastId, {
//     //         render: " Thêm thửa đất thành công!",
//     //         type: "success",
//     //         isLoading: false,
//     //         autoClose: 2000,
//     //         closeOnClick: true,
//     //       });
//     //     } catch (error) {
//     //       const apiError = error.response?.data?.message || error.message;
//     //       toast.update(toastId, {
//     //         render: apiError || " Có lỗi xảy ra khi thêm thửa đất!",
//     //         type: "error",
//     //         isLoading: false,
//     //         autoClose: 4000,
//     //         closeOnClick: true,
//     //       });
//     //     }
//     //   },
//     //   [formData, onSubmit, validateForm, fetchLandPlots]
//     // );
//     const handleSubmit = useCallback(
//       async (e) => {
//         e.preventDefault();

//         const allTouched = Object.keys(formData).reduce((acc, key) => {
//           acc[key] = true;
//           return acc;
//         }, {});
//         setTouched(allTouched);

//         let parsedGeom = null;
//         if (formData.geom && formData.geom.trim()) {
//           try {
//             parsedGeom = JSON.parse(formData.geom);
//           } catch {
//             setErrors((prev) => ({
//               ...prev,
//               geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
//             }));
//             return;
//           }
//         }

//         // FIX: Xử lý geometry trong land_use_details an toàn
//         const processedLandUseDetails =
//           formData.land_use_details
//             ?.filter(
//               (detail) => detail.ky_hieu_mdsd?.trim() && detail.dien_tich
//             )
//             .map((detail) => {
//               let parsedGeometry = null;

//               // Xử lý geometry an toàn
//               if (detail.geometry) {
//                 // Nếu geometry đã là object, giữ nguyên
//                 if (
//                   typeof detail.geometry === "object" &&
//                   detail.geometry !== null
//                 ) {
//                   parsedGeometry = detail.geometry;
//                 }
//                 // Nếu là string, thử parse
//                 else if (
//                   typeof detail.geometry === "string" &&
//                   detail.geometry.trim()
//                 ) {
//                   try {
//                     parsedGeometry = JSON.parse(detail.geometry);
//                   } catch (parseError) {
//                     console.warn(
//                       `Lỗi parse geometry cho chi tiết ${detail.ky_hieu_mdsd}:`,
//                       parseError
//                     );
//                     // Không set error ở đây, chỉ bỏ qua geometry không hợp lệ
//                     parsedGeometry = null;
//                   }
//                 }
//               }

//               return {
//                 ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
//                 // FIX: Xử lý dien_tich an toàn
//                 dien_tich: parseFloat(
//                   String(detail.dien_tich).replace(",", ".")
//                 ),
//                 geometry: parsedGeometry,
//               };
//             }) || [];

//         const submitData = {
//           ...formData,
//           so_to: parseInt(formData.so_to),
//           so_thua: parseInt(formData.so_thua),
//           // FIX: Xử lý dien_tich an toàn
//           dien_tich: parseFloat(String(formData.dien_tich).replace(",", ".")),
//           plot_list_id: formData.plot_list_id || null,
//           geom: parsedGeom,
//           status: formData.ten_chu?.trim() ? "owned" : "available",
//           ky_hieu_mdsd: formData.ky_hieu_mdsd,
//           land_use_details:
//             processedLandUseDetails.length > 0
//               ? processedLandUseDetails
//               : undefined,
//         };

//         const newErrors = validateForm(submitData);
//         setErrors(newErrors);

//         if (Object.keys(newErrors).length > 0) {
//           const firstErrorElement = document.querySelector(".error");
//           if (firstErrorElement) {
//             firstErrorElement.scrollIntoView({
//               behavior: "smooth",
//               block: "center",
//             });
//           }
//           return;
//         }

//         const toastId = toast.loading(" Đang gửi dữ liệu...");

//         try {
//           const result = await onSubmit(submitData);

//           // Kiểm tra phản hồi thất bại
//           if (!result || result.success === false) {
//             toast.update(toastId, {
//               render:
//                 result?.message ||
//                 " Gửi thất bại: Không thể tìm thấy dữ liệu phù hợp!",
//               type: "error",
//               isLoading: false,
//               autoClose: 4000,
//               closeOnClick: true,
//             });
//             return; // Dừng lại — không hiện success
//           }

//           // ✅ Thành công
//           if (fetchLandPlots) {
//             await fetchLandPlots();
//           }

//           toast.update(toastId, {
//             render: " Thêm thửa đất thành công!",
//             type: "success",
//             isLoading: false,
//             autoClose: 2000,
//             closeOnClick: true,
//           });
//         } catch (error) {
//           const apiError = error.response?.data?.message || error.message;
//           toast.update(toastId, {
//             render: apiError || " Có lỗi xảy ra khi thêm thửa đất!",
//             type: "error",
//             isLoading: false,
//             autoClose: 4000,
//             closeOnClick: true,
//           });
//         }
//       },
//       [formData, onSubmit, validateForm, fetchLandPlots]
//     );

//     const totalLandUseArea = useMemo(() => {
//       return formData.land_use_details.reduce((sum, detail) => {
//         return sum + (parseFloat(detail.dien_tich) || 0);
//       }, 0);
//     }, [formData.land_use_details]);

//     const remainingArea = useMemo(() => {
//       return calculateRemainingArea(formData);
//     }, [formData, calculateRemainingArea]);

//     const areaDifference = useMemo(() => {
//       const totalArea = parseFloat(formData.dien_tich) || 0;
//       return Math.abs(totalLandUseArea - totalArea);
//     }, [totalLandUseArea, formData.dien_tich]);

//     const hasAreaMismatch = useMemo(() => {
//       return areaDifference > 0.01;
//     }, [areaDifference]);

//     if (!show) return null;

//     return (
//       <div className="blue-modal-overlay">
//         <div className="blue-modal-content large-modal">
//           <LandPlotAddHeader onClose={onClose} loading={loading} />
//           {errors.message && (
//             <div className="error-message">{errors.message}</div>
//           )}
//           <form onSubmit={handleSubmit} className="blue-land-form">
//             <LandPlotAddForm
//               formData={formData}
//               errors={errors}
//               touched={touched}
//               loading={loading}
//               phuongXaOptions={phuongXaOptions}
//               plotListOptions={plotListOptions}
//               plotListInfo={plotListInfo}
//               isSearchingPlotList={isSearchingPlotList}
//               autoDistributeEnabled={autoDistributeEnabled}
//               handleInputChange={handleInputChange}
//               handleBlur={handleBlur}
//               autoDistributeArea={autoDistributeArea}
//               toggleAutoDistribute={toggleAutoDistribute}
//             />
//             <LandUseDetailsSection
//               formData={formData}
//               errors={errors}
//               touched={touched}
//               loading={loading}
//               autoDistributeEnabled={autoDistributeEnabled}
//               totalLandUseArea={totalLandUseArea}
//               remainingArea={remainingArea}
//               hasAreaMismatch={hasAreaMismatch}
//               areaDifference={areaDifference}
//               handleLandUseDetailChange={handleLandUseDetailChange}
//               addLandUseDetail={addLandUseDetail}
//               removeLandUseDetail={removeLandUseDetail}
//               autoDistributeArea={autoDistributeArea}
//               toggleAutoDistribute={toggleAutoDistribute}
//             />
//             <GeometrySection
//               formData={formData}
//               errors={errors}
//               touched={touched}
//               loading={loading}
//               showGeometryInput={showGeometryInput}
//               handleGeometryChange={handleGeometryChange}
//               formatGeometryJSON={formatGeometryJSON}
//               toggleGeometryInput={toggleGeometryInput}
//               handleBlur={handleBlur}
//               autoDistributeEnabled={autoDistributeEnabled}
//               toggleAutoDistribute={toggleAutoDistribute}
//             />
//             <div className="form-row">
//               <div className="form-group full-width">
//                 <label className="blue-field-label">
//                   <FaStickyNote className="label-icon" />
//                   Ghi chú
//                 </label>
//                 <textarea
//                   name="ghi_chu"
//                   value={formData.ghi_chu}
//                   onChange={handleInputChange}
//                   onBlur={handleBlur}
//                   placeholder="Nhập ghi chú (nếu có)"
//                   className="blue-textarea"
//                   disabled={loading}
//                   rows={3}
//                 />
//               </div>
//             </div>
//             <FormActions
//               onClose={onClose}
//               loading={loading}
//               handleSubmit={handleSubmit}
//             />
//           </form>
//         </div>
//       </div>
//     );
//   }
// );
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

    const {
      searchPlotList,
      validateForm,
      handleInputChange,
      handleLandUseDetailChange,
      bulkUpdateLandUseDetails,
      addLandUseDetail,
      calculateRemainingArea,
      removeLandUseDetail,
      autoDistributeArea,
      handleGeometryChange,
      formatGeometryJSON,
      handleBlur,
      toggleGeometryInput,
      toggleAutoDistribute,
      handleSubmit,
    } = useLandPlotForm({
      formData,
      setFormData,
      errors,
      setErrors,
      touched,
      setTouched,
      showGeometryInput,
      setShowGeometryInput,
      plotListInfo,
      setPlotListInfo,
      isSearchingPlotList,
      setIsSearchingPlotList,
      autoDistributeEnabled,
      setAutoDistributeEnabled,
      searchTimeoutRef,
      formDataRef,
      onSubmit,
      fetchLandPlots,
      onClose,
    });

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
          <LandPlotAddHeader onClose={onClose} loading={loading} />

          <form onSubmit={handleSubmit} className="blue-land-form">
            <LandPlotAddForm
              formData={formData}
              errors={errors}
              touched={touched}
              handleInputChange={handleInputChange}
              handleBlur={handleBlur}
              loading={loading}
              isSearchingPlotList={isSearchingPlotList}
              plotListInfo={plotListInfo}
              plotListOptions={plotListOptions}
              autoDistributeEnabled={autoDistributeEnabled}
            />

            <LandUseDetailsSection
              formData={formData}
              errors={errors}
              loading={loading}
              autoDistributeEnabled={autoDistributeEnabled}
              toggleAutoDistribute={toggleAutoDistribute}
              handleLandUseDetailChange={handleLandUseDetailChange}
              addLandUseDetail={addLandUseDetail}
              removeLandUseDetail={removeLandUseDetail}
              autoDistributeArea={autoDistributeArea}
              totalLandUseArea={totalLandUseArea}
              remainingArea={remainingArea}
              hasAreaMismatch={hasAreaMismatch}
              areaDifference={areaDifference}
            />

            <GeometrySection
              formData={formData}
              errors={errors}
              touched={touched}
              showGeometryInput={showGeometryInput}
              handleGeometryChange={handleGeometryChange}
              formatGeometryJSON={formatGeometryJSON}
              toggleGeometryInput={toggleGeometryInput}
              handleBlur={handleBlur}
              loading={loading}
            />

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

            <FormActions
              onClose={onClose}
              loading={loading}
              handleSubmit={handleSubmit}
            />
          </form>
        </div>
      </div>
    );
  }
);

export default LandPlotAdd;
