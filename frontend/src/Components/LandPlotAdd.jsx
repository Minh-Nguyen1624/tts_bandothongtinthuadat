// import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
// import {
//   FaTimes,
//   FaSave,
//   FaUser,
//   FaMap,
//   FaTag,
//   FaRuler,
//   FaStickyNote,
//   FaLayerGroup,
//   FaDrawPolygon,
// } from "react-icons/fa";
// import "../css/LandPlotAdd.css";

// const LandPlotAdd = memo(
//   ({
//     show,
//     onClose,
//     onSubmit,
//     loading,
//     phuongXaOptions,
//     plotListOptions = [],
//     fetchLandPlots,
//   }) => {
//     const [formData, setFormData] = useState({
//       ten_chu: "",
//       so_to: "",
//       so_thua: "",
//       ky_hieu_mdsd: "",
//       dien_tich: "",
//       phuong_xa: "",
//       ghi_chu: "",
//       plot_list_id: "",
//       geom: null,
//     });

//     const [errors, setErrors] = useState({});
//     const [touched, setTouched] = useState({});
//     const [showGeometryInput, setShowGeometryInput] = useState(false);

//     // Reset form when modal opens
//     useEffect(() => {
//       if (show) {
//         setFormData({
//           ten_chu: "",
//           so_to: "",
//           so_thua: "",
//           ky_hieu_mdsd: "",
//           dien_tich: "",
//           phuong_xa: "",
//           ghi_chu: "",
//           plot_list_id: "",
//           geom: null,
//         });
//         setErrors({});
//         setTouched({});
//         setShowGeometryInput(false);
//       }
//     }, [show]);

//     // Validation function
//     const validateForm = useCallback((data) => {
//       const newErrors = {};

//       // if (data.ten_chu.trim() && data.ten_chu.trim().length > 100) {
//       //   newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
//       // }

//       if (data.ten_chu && data.ten_chu.trim().length > 100) {
//         newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
//       }

//       if (!data.so_to.trim()) {
//         newErrors.so_to = "Vui lòng nhập số tờ";
//       } else if (isNaN(data.so_to) || parseInt(data.so_to) <= 0) {
//         newErrors.so_to = "Số tờ phải là số dương";
//       }

//       if (!data.so_thua.trim()) {
//         newErrors.so_thua = "Vui lòng nhập số thửa";
//       } else if (isNaN(data.so_thua) || parseInt(data.so_thua) <= 0) {
//         newErrors.so_thua = "Số thửa phải là số dương";
//       }

//       if (!data.ky_hieu_mdsd.trim()) {
//         newErrors.ky_hieu_mdsd = "Vui lòng nhập ký hiệu mục đích sử dụng";
//       }

//       if (!data.dien_tich.trim()) {
//         newErrors.dien_tich = "Vui lòng nhập diện tích";
//       } else if (
//         isNaN(parseFloat(data.dien_tich)) ||
//         parseFloat(data.dien_tich) <= 0
//       ) {
//         newErrors.dien_tich = "Diện tích phải là số dương";
//       }

//       if (!data.phuong_xa.trim()) {
//         newErrors.phuong_xa = "Vui lòng chọn phường/xã";
//       }

//       // Validation for geometry (optional)
//       if (data.geom && typeof data.geom !== "object") {
//         newErrors.geom = "Định dạng geometry không hợp lệ";
//       }

//       return newErrors;
//     }, []);

//     // Handle input change
//     const handleInputChange = useCallback(
//       (e) => {
//         const { name, value } = e.target;
//         let processedValue = value;

//         // Auto-uppercase for land use code
//         if (name === "ky_hieu_mdsd") {
//           processedValue = value.toUpperCase();
//         }

//         // Format area input
//         if (name === "dien_tich") {
//           processedValue = value.replace(/[^0-9.,]/g, "");
//         }

//         setFormData((prev) => ({
//           ...prev,
//           [name]: processedValue,
//         }));

//         // Real-time validation for touched fields
//         if (touched[name]) {
//           const fieldError = validateForm({ [name]: processedValue })[name];
//           setErrors((prev) => ({
//             ...prev,
//             [name]: fieldError || "",
//           }));
//         }
//       },
//       [touched, validateForm]
//     );

//     // Handle geometry input
//     const handleGeometryChange = useCallback(
//       (e) => {
//         const { value } = e.target;

//         // Cập nhật giá trị textarea
//         setFormData((prev) => ({
//           ...prev,
//           geom: value,
//         }));

//         // Validate JSON format
//         if (value.trim()) {
//           try {
//             const parsed = JSON.parse(value);

//             // Validate GeoJSON structure
//             if (!isValidGeoJSON(parsed)) {
//               throw new Error("Cấu trúc GeoJSON không hợp lệ");
//             }

//             // Nếu parse thành công và đúng cấu trúc, xóa lỗi
//             if (errors.geom) {
//               setErrors((prev) => ({
//                 ...prev,
//                 geom: "",
//               }));
//             }
//           } catch (error) {
//             // Hiển thị lỗi chi tiết hơn
//             let errorMessage = "Định dạng JSON không hợp lệ";
//             if (error.message.includes("JSON")) {
//               errorMessage =
//                 "Lỗi cú pháp JSON. Kiểm tra dấu ngoặc và dấu phẩy.";
//             } else if (error.message.includes("GeoJSON")) {
//               errorMessage =
//                 "Cấu trúc GeoJSON không đúng. Cần có 'type' và 'coordinates'.";
//             }

//             setErrors((prev) => ({
//               ...prev,
//               geom: errorMessage,
//             }));
//           }
//         } else {
//           // Nếu empty, xóa lỗi
//           if (errors.geom) {
//             setErrors((prev) => ({
//               ...prev,
//               geom: "",
//             }));
//           }
//         }
//       },
//       [errors.geom]
//     );

//     // Helper function để validate GeoJSON
//     const isValidGeoJSON = (geojson) => {
//       if (!geojson || typeof geojson !== "object") return false;
//       if (!geojson.type) return false;

//       // Basic validation for Polygon
//       if (geojson.type === "Polygon") {
//         if (!Array.isArray(geojson.coordinates)) return false;
//         if (geojson.coordinates.length === 0) return false;

//         // Check first ring (exterior ring)
//         const exteriorRing = geojson.coordinates[0];
//         if (!Array.isArray(exteriorRing) || exteriorRing.length < 4)
//           return false;

//         // Check if first and last points are the same (closed ring)
//         const firstPoint = exteriorRing[0];
//         const lastPoint = exteriorRing[exteriorRing.length - 1];
//         if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
//           return false;
//         }

//         return true;
//       }

//       return false;
//     };

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
//       } catch (error) {
//         setErrors((prev) => ({
//           ...prev,
//           geom: "Không thể format: JSON không hợp lệ",
//         }));
//       }
//     }, [formData.geom, errors.geom]);

//     // Handle blur
//     const handleBlur = useCallback((e) => {
//       const { name } = e.target;
//       setTouched((prev) => ({
//         ...prev,
//         [name]: true,
//       }));
//     }, []);

//     // Toggle geometry input visibility
//     const toggleGeometryInput = useCallback(() => {
//       setShowGeometryInput((prev) => !prev);
//     }, []);

//     // Handle submit
//     // const handleSubmit = useCallback(
//     //   async (e) => {
//     //     e.preventDefault();

//     //     // Mark all fields as touched
//     //     const allTouched = Object.keys(formData).reduce((acc, key) => {
//     //       acc[key] = true;
//     //       return acc;
//     //     }, {});
//     //     setTouched(allTouched);

//     //     const newErrors = validateForm(formData);
//     //     setErrors(newErrors);

//     //     if (Object.keys(newErrors).length > 0) {
//     //       return;
//     //     }

//     //     // Prepare data for submission
//     //     const submitData = {
//     //       ...formData,
//     //       so_to: parseInt(formData.so_to),
//     //       so_thua: parseInt(formData.so_thua),
//     //       dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
//     //       plot_list_id: formData.plot_list_id || null,
//     //       geom: formData.geom || null,
//     //     };

//     //     await onSubmit(submitData);
//     //   },
//     //   [formData, onSubmit, validateForm]
//     // );
//     const handleSubmit = useCallback(
//       async (e) => {
//         e.preventDefault();

//         const allTouched = Object.keys(formData).reduce((acc, key) => {
//           acc[key] = true;
//           return acc;
//         }, {});
//         setTouched(allTouched);

//         // Parse và validate geometry trước khi submit
//         let parsedGeom = null;
//         if (formData.geom && formData.geom.trim()) {
//           try {
//             parsedGeom = JSON.parse(formData.geom);
//           } catch (error) {
//             setErrors((prev) => ({
//               ...prev,
//               geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
//             }));
//             return;
//           }
//         }

//         const newErrors = validateForm({ ...formData, geom: parsedGeom });
//         setErrors(newErrors);

//         if (Object.keys(newErrors).length > 0) {
//           return;
//         }

//         const submitData = {
//           ...formData,
//           so_to: parseInt(formData.so_to),
//           so_thua: parseInt(formData.so_thua),
//           dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
//           plot_list_id: formData.plot_list_id || null,
//           geom: parsedGeom,
//         };

//         await onSubmit(submitData);

//         await fetchLandPlots();
//       },
//       [formData, onSubmit, validateForm]
//     );

//     if (!show) return null;

//     return (
//       <div className="blue-modal-overlay">
//         <div className="blue-modal-content large-modal">
//           {/* Header */}
//           <div
//             className="blue-modal-header"
//             style={{ display: "flex", color: "white" }}
//           >
//             <h2 className="blue-modal-title" style={{ color: "white" }}>
//               Thêm Thửa Đất Mới
//             </h2>
//             <button
//               onClick={onClose}
//               className="blue-close-button"
//               aria-label="Đóng"
//             >
//               <FaTimes />
//             </button>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="blue-land-form">
//             {/* First Row - Owner and Plot Info */}
//             <div className="form-row">
//               <div className="form-group">
//                 <label className="blue-field-label">
//                   <FaUser className="label-icon" />
//                   Tên chủ
//                 </label>
//                 <input
//                   type="text"
//                   name="ten_chu"
//                   value={formData.ten_chu}
//                   onChange={handleInputChange}
//                   onBlur={handleBlur}
//                   placeholder="Nhập tên chủ"
//                   className={`blue-input ${
//                     errors.ten_chu && touched.ten_chu ? "error" : ""
//                   }`}
//                   disabled={loading}
//                 />
//                 {errors.ten_chu && touched.ten_chu && (
//                   <span className="blue-error-message">{errors.ten_chu}</span>
//                 )}
//               </div>

//               <div className="form-group compact-group">
//                 <div className="compact-row">
//                   <div className="compact-field">
//                     <label className="blue-field-label">
//                       <FaMap className="label-icon" />
//                       Số tờ <span className="required-asterisk">*</span>
//                     </label>
//                     <input
//                       type="number"
//                       name="so_to"
//                       value={formData.so_to}
//                       onChange={handleInputChange}
//                       onBlur={handleBlur}
//                       placeholder="Số tờ"
//                       className={`blue-input compact-input ${
//                         errors.so_to && touched.so_to ? "error" : ""
//                       }`}
//                       disabled={loading}
//                     />
//                   </div>
//                   <div className="compact-field">
//                     <label className="blue-field-label">
//                       Số thửa <span className="required-asterisk">*</span>
//                     </label>
//                     <input
//                       type="number"
//                       name="so_thua"
//                       value={formData.so_thua}
//                       onChange={handleInputChange}
//                       onBlur={handleBlur}
//                       placeholder="Số thửa"
//                       className={`blue-input compact-input ${
//                         errors.so_thua && touched.so_thua ? "error" : ""
//                       }`}
//                       disabled={loading}
//                     />
//                   </div>
//                 </div>
//                 {(errors.so_to && touched.so_to) ||
//                 (errors.so_thua && touched.so_thua) ? (
//                   <span className="blue-error-message">
//                     {errors.so_to || errors.so_thua}
//                   </span>
//                 ) : null}
//               </div>
//             </div>

//             {/* Second Row - Land Use Code, Area, Ward */}
//             <div className="form-row">
//               <div className="form-group">
//                 <label className="blue-field-label">
//                   <FaTag className="label-icon" />
//                   Ký hiệu mục đích sử dụng{" "}
//                   <span className="required-asterisk">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="ky_hieu_mdsd"
//                   value={formData.ky_hieu_mdsd}
//                   onChange={handleInputChange}
//                   onBlur={handleBlur}
//                   placeholder="VD: ODT, CLN, ONT..."
//                   className={`blue-input ${
//                     errors.ky_hieu_mdsd && touched.ky_hieu_mdsd ? "error" : ""
//                   }`}
//                   disabled={loading}
//                   maxLength={40}
//                 />
//                 {errors.ky_hieu_mdsd && touched.ky_hieu_mdsd && (
//                   <span className="blue-error-message">
//                     {errors.ky_hieu_mdsd}
//                   </span>
//                 )}
//               </div>

//               <div className="form-group">
//                 <label className="blue-field-label">
//                   <FaRuler className="label-icon" />
//                   Diện tích <span className="required-asterisk">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="dien_tich"
//                   value={formData.dien_tich}
//                   onChange={handleInputChange}
//                   onBlur={handleBlur}
//                   placeholder="Nhập diện tích"
//                   className={`blue-input ${
//                     errors.dien_tich && touched.dien_tich ? "error" : ""
//                   }`}
//                   disabled={loading}
//                 />
//                 {errors.dien_tich && touched.dien_tich && (
//                   <span className="blue-error-message">{errors.dien_tich}</span>
//                 )}
//               </div>

//               <div className="form-group">
//                 <label className="blue-field-label">
//                   <FaMap className="label-icon" />
//                   Phường/Xã <span className="required-asterisk">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="phuong_xa"
//                   value={formData.phuong_xa}
//                   onChange={handleInputChange}
//                   onBlur={handleBlur}
//                   placeholder="Nhập Phường/Xã"
//                   className={`blue-input ${
//                     errors.phuong_xa && touched.phuong_xa ? "error" : ""
//                   }`}
//                   disabled={loading}
//                 />
//                 {errors.phuong_xa && touched.phuong_xa && (
//                   <span className="blue-error-message">{errors.phuong_xa}</span>
//                 )}
//               </div>
//             </div>

//             {/* Third Row - Plot List ID and Geometry */}
//             <div className="form-row">
//               <div className="form-group">
//                 <label className="blue-field-label">
//                   <FaLayerGroup className="label-icon" />
//                   Danh sách thửa đất
//                 </label>

//                 <select
//                   name="plot_list_id"
//                   value={formData.plot_list_id}
//                   onChange={handleInputChange}
//                   onBlur={handleBlur}
//                   className="blue-input blue-select"
//                   disabled={loading}
//                 >
//                   <option value="">Chọn danh sách thửa đất</option>
//                   {plotListOptions && plotListOptions.length > 0 ? (
//                     plotListOptions.map((option) => {
//                       // console.log("Option:", option); // Debug từng option
//                       return (
//                         <option key={option.id} value={option.id}>
//                           {option.name ||
//                             option.ten_danh_sach ||
//                             `Danh sách ${option.organization_name}`}
//                         </option>
//                       );
//                     })
//                   ) : (
//                     <option value="" disabled>
//                       Không có danh sách nào
//                     </option>
//                   )}
//                 </select>
//                 <div className="input-hint">
//                   Liên kết với danh sách thửa đất (tùy chọn)
//                 </div>
//               </div>

//               <div className="form-group full-width">
//                 <div className="geometry-section">
//                   <div className="geometry-header">
//                     <label className="blue-field-label">
//                       <FaDrawPolygon className="label-icon" />
//                       Dữ liệu hình học (Geometry)
//                     </label>
//                     <button
//                       type="button"
//                       onClick={toggleGeometryInput}
//                       className="geometry-toggle-button"
//                     >
//                       {showGeometryInput ? "Ẩn" : "Hiện"} Geometry
//                     </button>
//                   </div>

//                   {/* {showGeometryInput && (
//                     <div className="geometry-input-container">
//                       <textarea
//                         name="geom"
//                         value={
//                           formData.geom
//                             ? JSON.stringify(formData.geom, null, 2)
//                             : ""
//                         }
//                         onChange={handleGeometryChange}
//                         onBlur={handleBlur}
//                         placeholder='Nhập dữ liệu GeoJSON (VD: {"type": "Polygon", "coordinates": [...]})'
//                         className={`blue-textarea geometry-textarea ${
//                           errors.geom && touched.geom ? "error" : ""
//                         }`}
//                         disabled={loading}
//                         rows={6}
//                       />
//                       {errors.geom && touched.geom && (
//                         <span className="blue-error-message">
//                           {errors.geom}
//                         </span>
//                       )}
//                       <div className="input-hint">
//                         Nhập dữ liệu hình học dạng GeoJSON (tùy chọn)
//                       </div>
//                     </div>
//                   )} */}
//                   {showGeometryInput && (
//                     <div className="geometry-input-container">
//                       <div className="geometry-toolbar">
//                         <button
//                           type="button"
//                           onClick={formatGeometryJSON}
//                           className="geometry-format-button"
//                           disabled={loading || !formData.geom}
//                         >
//                           Format JSON
//                         </button>
//                       </div>
//                       <textarea
//                         name="geom"
//                         value={formData.geom || ""}
//                         onChange={handleGeometryChange}
//                         onBlur={handleBlur}
//                         placeholder='Nhập dữ liệu GeoJSON (VD: {"type": "Polygon", "coordinates": [[[106.38111,10.35724],[106.38689,10.35724],[106.38689,10.35174],[106.38111,10.35174],[106.38111,10.35724]]]})'
//                         className={`blue-textarea geometry-textarea ${
//                           errors.geom && touched.geom ? "error" : ""
//                         }`}
//                         disabled={loading}
//                         rows={8}
//                       />
//                       {errors.geom && touched.geom && (
//                         <span className="blue-error-message">
//                           {errors.geom}
//                         </span>
//                       )}
//                       <div className="input-hint">
//                         Nhập dữ liệu hình học dạng GeoJSON (tùy chọn). Đảm bảo
//                         định dạng JSON hợp lệ.
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Notes Section */}
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

//             {/* Action Buttons */}
//             <div className="blue-form-actions">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="blue-cancel-button"
//                 disabled={loading}
//               >
//                 Hủy
//               </button>
//               <button
//                 type="submit"
//                 className="blue-submit-button"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <div className="button-loading-spinner"></div>
//                     Đang xử lý...
//                   </>
//                 ) : (
//                   <>
//                     <FaSave />
//                     Thêm thửa đất
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     );
//   }
// );

// export default LandPlotAdd;

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
      ky_hieu_mdsd: "",
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

    // Refs để tránh re-render không cần thiết
    const searchTimeoutRef = useRef(null);
    const formDataRef = useRef(formData);

    // Cập nhật ref khi formData thay đổi
    useEffect(() => {
      formDataRef.current = formData;
    }, [formData]);

    // Reset form khi modal mở - được tối ưu
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

    // ✅ TỐI ƯU: Debounced search cho PlotList
    const searchPlotList = useCallback(
      async (so_to, so_thua) => {
        if (!so_to || !so_thua) {
          setPlotListInfo(null);
          return;
        }

        setIsSearchingPlotList(true);

        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `http://127.0.0.1:8000/api/plot-lists?so_to=${so_to}&so_thua=${so_thua}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.length > 0) {
              const plotList = data.data[0];
              setPlotListInfo(plotList);

              // ✅ TỰ ĐỘNG điền diện tích từ PlotList
              setFormData((prev) => ({
                ...prev,
                dien_tich: plotList.dien_tich || "",
              }));

              // ✅ TỰ ĐỘNG tạo land_use_details nếu có nhiều loại đất
              const currentFormData = formDataRef.current;
              if (
                currentFormData.ky_hieu_mdsd &&
                currentFormData.land_use_details.length === 0
              ) {
                const landTypes = currentFormData.ky_hieu_mdsd
                  .split("+")
                  .map((type) => type.trim())
                  .filter((type) => type.length > 0);

                if (landTypes.length > 1 && autoDistributeEnabled) {
                  const totalArea = parseFloat(plotList.dien_tich) || 0;
                  const defaultDetails = landTypes.map((type, index) => ({
                    ky_hieu_mdsd: type,
                    dien_tich: (totalArea / landTypes.length).toFixed(2),
                  }));
                  setFormData((prev) => ({
                    ...prev,
                    land_use_details: defaultDetails,
                  }));
                }
              }
            } else {
              setPlotListInfo(null);
            }
          }
        } catch (error) {
          console.error("Error fetching plot list:", error);
          setPlotListInfo(null);
        } finally {
          setIsSearchingPlotList(false);
        }
      },
      [autoDistributeEnabled]
    );

    // ✅ TỐI ƯU: Sử dụng debounce cho search PlotList
    useEffect(() => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlotList(formData.so_to, formData.so_thua);
      }, 500); // Debounce 500ms

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [formData.so_to, formData.so_thua, searchPlotList]);

    // ✅ TỐI ƯU: Validation với useMemo
    const validateForm = useCallback((data) => {
      const newErrors = {};

      // Basic validations
      if (data.ten_chu && data.ten_chu.trim().length > 100) {
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

      // ✅ VALIDATE land_use_details với tính toán hiệu quả
      if (data.land_use_details && data.land_use_details.length > 0) {
        const totalDetailArea = data.land_use_details.reduce((sum, detail) => {
          return sum + (parseFloat(detail.dien_tich) || 0);
        }, 0);

        const plotListArea = parseFloat(data.dien_tich) || 0;

        if (Math.abs(totalDetailArea - plotListArea) > 0.01) {
          newErrors.land_use_details = `Tổng diện tích chi tiết (${totalDetailArea.toFixed(
            2
          )} m²) không khớp với diện tích tổng (${plotListArea.toFixed(2)} m²)`;
        }

        // Validate từng detail - chỉ validate khi touched
        data.land_use_details.forEach((detail, index) => {
          if (!detail.ky_hieu_mdsd?.trim()) {
            newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
              "Vui lòng nhập ký hiệu MDSD";
          }
          if (!detail.dien_tich || parseFloat(detail.dien_tich) <= 0) {
            newErrors[`land_use_details_${index}_dien_tich`] =
              "Diện tích phải là số dương";
          }
        });
      }

      // Validation for geometry (chỉ khi có giá trị)
      if (data.geom && data.geom.trim() && typeof data.geom !== "object") {
        try {
          JSON.parse(data.geom);
        } catch {
          newErrors.geom = "Định dạng JSON không hợp lệ";
        }
      }

      return newErrors;
    }, []);

    // ✅ TỐI ƯU: Input change với batch updates
    const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Auto-uppercase for land use code
        if (name === "ky_hieu_mdsd") {
          processedValue = value.toUpperCase();

          // ✅ TỰ ĐỘNG tạo land_use_details khi người dùng nhập nhiều loại đất
          if (value.includes("+") && autoDistributeEnabled && plotListInfo) {
            const landTypes = value
              .split("+")
              .map((type) => type.trim())
              .filter((type) => type.length > 0);

            if (
              landTypes.length > 1 &&
              formData.land_use_details.length === 0
            ) {
              const totalArea = parseFloat(formData.dien_tich) || 0;
              const defaultDetails = landTypes.map((type) => ({
                ky_hieu_mdsd: type,
                dien_tich: (totalArea / landTypes.length).toFixed(2),
              }));

              setFormData((prev) => ({
                ...prev,
                [name]: processedValue,
                land_use_details: defaultDetails,
              }));
              return; // Early return để tránh setFormData 2 lần
            }
          }
        }

        // Format area input
        if (name === "dien_tich") {
          processedValue = value.replace(/[^0-9.,]/g, "");
        }

        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
        }));

        // Real-time validation chỉ cho các trường đã touched
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

    // ✅ TỐI ƯU: Xử lý land_use_details với batch updates
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

    // ✅ THÊM: Bulk update land use details
    const bulkUpdateLandUseDetails = useCallback((updates) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: updates,
      }));
    }, []);

    // ✅ THÊM: Thêm land use detail với giá trị mặc định thông minh
    const addLandUseDetail = useCallback(() => {
      setFormData((prev) => {
        const remainingArea = calculateRemainingArea(prev);
        const newDetail = {
          ky_hieu_mdsd: "",
          dien_tich: remainingArea > 0 ? remainingArea.toFixed(2) : "",
        };

        return {
          ...prev,
          land_use_details: [...prev.land_use_details, newDetail],
        };
      });
    }, []);

    // ✅ TÍNH diện tích còn lại
    const calculateRemainingArea = useCallback((data = formDataRef.current) => {
      const totalArea = parseFloat(data.dien_tich) || 0;
      const usedArea = data.land_use_details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.dien_tich) || 0);
      }, 0);
      return Math.max(0, totalArea - usedArea);
    }, []);

    // ✅ Xóa land use detail
    const removeLandUseDetail = useCallback((index) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.filter((_, i) => i !== index),
      }));
    }, []);

    // ✅ TỰ ĐỘNG chia diện tích đều - được tối ưu
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

    // ✅ XỬ LÝ geometry input với debounce
    const handleGeometryChange = useCallback(
      (e) => {
        const { value } = e.target;

        setFormData((prev) => ({
          ...prev,
          geom: value,
        }));

        // Debounced validation cho geometry
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
            } catch (error) {
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

    // ✅ FORMAT JSON
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
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          geom: "Không thể format: JSON không hợp lệ",
        }));
      }
    }, [formData.geom, errors.geom]);

    // ✅ HANDLE blur
    const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    }, []);

    // ✅ TOGGLE geometry input
    const toggleGeometryInput = useCallback(() => {
      setShowGeometryInput((prev) => !prev);
    }, []);

    // ✅ TOGGLE auto distribute
    const toggleAutoDistribute = useCallback(() => {
      setAutoDistributeEnabled((prev) => !prev);
    }, []);

    // ✅ HANDLE submit được tối ưu
    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(formData).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setTouched(allTouched);

        // Parse geometry
        let parsedGeom = null;
        if (formData.geom && formData.geom.trim()) {
          try {
            parsedGeom = JSON.parse(formData.geom);
          } catch (error) {
            setErrors((prev) => ({
              ...prev,
              geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
            }));
            return;
          }
        }

        // Process land_use_details
        const processedLandUseDetails = formData.land_use_details
          .filter((detail) => detail.ky_hieu_mdsd.trim() && detail.dien_tich)
          .map((detail) => ({
            ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
            dien_tich: parseFloat(detail.dien_tich.replace(",", ".")),
          }));

        const submitData = {
          ...formData,
          so_to: parseInt(formData.so_to),
          so_thua: parseInt(formData.so_thua),
          dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
          plot_list_id: formData.plot_list_id || null,
          geom: parsedGeom,
          status: formData.ten_chu.trim() ? "owned" : "available",
          land_use_details:
            processedLandUseDetails.length > 0
              ? processedLandUseDetails
              : undefined,
        };

        const newErrors = validateForm(submitData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
          // Scroll to first error
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

    // ✅ TÍNH TOÁN được memoize
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

                {/* PlotList Info với loading state */}
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
                  Nhập nhiều loại đất bằng dấu + (VD: ODT+CLN)
                  {autoDistributeEnabled && (
                    <span style={{ color: "#28a745", marginLeft: "5px" }}>
                      • Tự động chia diện tích
                    </span>
                  )}
                </div>
              </div>

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

            {/* Land Use Details Section */}
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

                      {/* Summary với real-time feedback */}
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

            {/* Geometry Section */}
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
