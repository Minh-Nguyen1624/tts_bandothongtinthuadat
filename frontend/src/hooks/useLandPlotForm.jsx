// src/features/landPlot/hooks/useLandPlotForm.js
import { useCallback } from "react";
import axios from "axios";
// import { validateForm } from "../utils/validationUtils";
// import { searchPlotListApi } from "../services/landPlotApi";
import { validateForm } from "../features/landPlot/utils/validationAddUtils";
import { searchPlotListApi } from "../features/landPlot/services/landPlotApi";

// const useLandPlotForm = ({
//   formData,
//   setFormData,
//   errors,
//   setErrors,
//   touched,
//   setTouched,
//   showGeometryInput,
//   setShowGeometryInput,
//   plotListInfo,
//   setPlotListInfo,
//   isSearchingPlotList,
//   setIsSearchingPlotList,
//   autoDistributeEnabled,
//   setAutoDistributeEnabled,
//   searchTimeoutRef,
//   formDataRef,
//   onSubmit,
//   fetchLandPlots,
//   onClose,
// }) => {
//   const searchPlotList = useCallback(
//     async (so_to, so_thua) => {
//       if (!so_to || !so_thua) {
//         setPlotListInfo(null);
//         setFormData((prev) => ({
//           ...prev,
//           dien_tich: "",
//         }));
//         return;
//       }

//       setIsSearchingPlotList(true);

//       try {
//         const result = await searchPlotListApi(so_to, so_thua);

//         if (result.success && result.data.length > 0) {
//           const exactPlotList = result.data.find(
//             (plot) =>
//               String(plot.so_to) === String(so_to) &&
//               String(plot.so_thua) === String(so_thua)
//           );

//           if (exactPlotList) {
//             setPlotListInfo(exactPlotList);
//             setFormData((prev) => ({
//               ...prev,
//               dien_tich:
//                 exactPlotList.dien_tich != null
//                   ? String(exactPlotList.dien_tich)
//                   : "",
//             }));
//           } else {
//             setPlotListInfo(null);
//             setFormData((prev) => ({
//               ...prev,
//               dien_tich: "",
//             }));
//           }
//         } else {
//           setPlotListInfo(null);
//           setFormData((prev) => ({
//             ...prev,
//             dien_tich: "",
//           }));
//         }
//       } catch (error) {
//         console.error("❌ Error fetching plot list:", error);
//         setPlotListInfo(null);
//         setFormData((prev) => ({
//           ...prev,
//           dien_tich: "",
//         }));
//       } finally {
//         setIsSearchingPlotList(false);
//       }
//     },
//     [setFormData, setPlotListInfo, setIsSearchingPlotList]
//   );

//   const handleInputChange = useCallback(
//     (e) => {
//       const { name, value } = e.target;
//       let processedValue = value;

//       if (name === "ky_hieu_mdsd") {
//         processedValue = value
//           .split(/[,+\s]+/)
//           .map((type) => type.trim().toUpperCase())
//           .filter((type) => type.length > 0);

//         if (
//           autoDistributeEnabled &&
//           plotListInfo &&
//           processedValue.length > 1 &&
//           formData.land_use_details.length === 0
//         ) {
//           const totalArea = parseFloat(formData.dien_tich) || 0;
//           const defaultDetails = processedValue.map((type) => ({
//             ky_hieu_mdsd: type,
//             dien_tich: (totalArea / processedValue.length).toFixed(2),
//             geometry: null,
//           }));
//           setFormData((prev) => ({
//             ...prev,
//             ky_hieu_mdsd: processedValue,
//             land_use_details: defaultDetails,
//           }));
//           return;
//         }
//       }

//       if (name === "dien_tich") {
//         processedValue = value.replace(/[^0-9.,]/g, "");
//       }

//       setFormData((prev) => ({
//         ...prev,
//         [name]: processedValue,
//       }));

//       if (touched[name]) {
//         const newErrors = validateForm({
//           ...formDataRef.current,
//           [name]: processedValue,
//         });
//         setErrors((prev) => ({
//           ...prev,
//           [name]: newErrors[name] || "",
//         }));
//       }
//     },
//     [
//       touched,
//       plotListInfo,
//       autoDistributeEnabled,
//       formData.land_use_details.length,
//       formData.dien_tich,
//       setFormData,
//       setErrors,
//     ]
//   );

//   const handleLandUseDetailChange = useCallback(
//     (index, field, value) => {
//       setFormData((prev) => {
//         const newDetails = [...prev.land_use_details];
//         newDetails[index] = {
//           ...newDetails[index],
//           [field]:
//             field === "dien_tich" ? value.replace(/[^0-9.,]/g, "") : value,
//         };
//         return { ...prev, land_use_details: newDetails };
//       });
//     },
//     [setFormData]
//   );

//   const bulkUpdateLandUseDetails = useCallback(
//     (updates) => {
//       setFormData((prev) => ({
//         ...prev,
//         land_use_details: updates,
//       }));
//     },
//     [setFormData]
//   );

//   const addLandUseDetail = useCallback(() => {
//     setFormData((prev) => {
//       const remainingArea = calculateRemainingArea(prev);
//       const newDetail = {
//         ky_hieu_mdsd: "",
//         dien_tich: remainingArea > 0 ? remainingArea.toFixed(2) : "",
//         geometry: null,
//       };
//       return {
//         ...prev,
//         land_use_details: [...prev.land_use_details, newDetail],
//       };
//     });
//   }, [setFormData]);

//   const calculateRemainingArea = useCallback((data = formDataRef.current) => {
//     const totalArea = parseFloat(data.dien_tich) || 0;
//     const usedArea = data.land_use_details.reduce((sum, detail) => {
//       return sum + (parseFloat(detail.dien_tich) || 0);
//     }, 0);
//     return Math.max(0, totalArea - usedArea);
//   }, []);

//   const removeLandUseDetail = useCallback(
//     (index) => {
//       setFormData((prev) => ({
//         ...prev,
//         land_use_details: prev.land_use_details.filter((_, i) => i !== index),
//       }));
//     },
//     [setFormData]
//   );

//   const autoDistributeArea = useCallback(() => {
//     if (formData.land_use_details.length > 0 && formData.dien_tich) {
//       const totalArea = parseFloat(formData.dien_tich);
//       const equalArea = (totalArea / formData.land_use_details.length).toFixed(
//         2
//       );
//       bulkUpdateLandUseDetails(
//         formData.land_use_details.map((detail) => ({
//           ...detail,
//           dien_tich: equalArea,
//         }))
//       );
//     }
//   }, [formData.land_use_details, formData.dien_tich, bulkUpdateLandUseDetails]);

//   const handleGeometryChange = useCallback(
//     (e) => {
//       const { value } = e.target;
//       setFormData((prev) => ({
//         ...prev,
//         geom: value,
//       }));

//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }

//       searchTimeoutRef.current = setTimeout(() => {
//         if (value.trim()) {
//           try {
//             JSON.parse(value);
//             if (errors.geom) {
//               setErrors((prev) => ({
//                 ...prev,
//                 geom: "",
//               }));
//             }
//           } catch {
//             setErrors((prev) => ({
//               ...prev,
//               geom: "Định dạng JSON không hợp lệ",
//             }));
//           }
//         } else {
//           if (errors.geom) {
//             setErrors((prev) => ({
//               ...prev,
//               geom: "",
//             }));
//           }
//         }
//       }, 300);
//     },
//     [errors.geom, setFormData, setErrors]
//   );

//   const formatGeometryJSON = useCallback(() => {
//     if (!formData.geom) return;

//     try {
//       const parsed = JSON.parse(formData.geom);
//       const formatted = JSON.stringify(parsed, null, 2);
//       setFormData((prev) => ({
//         ...prev,
//         geom: formatted,
//       }));
//       if (errors.geom) {
//         setErrors((prev) => ({ ...prev, geom: "" }));
//       }
//     } catch {
//       setErrors((prev) => ({
//         ...prev,
//         geom: "Không thể format: JSON không hợp lệ",
//       }));
//     }
//   }, [formData.geom, errors.geom, setFormData, setErrors]);

//   const handleBlur = useCallback(
//     (e) => {
//       const { name } = e.target;
//       setTouched((prev) => ({
//         ...prev,
//         [name]: true,
//       }));
//     },
//     [setTouched]
//   );

//   const toggleGeometryInput = useCallback(() => {
//     setShowGeometryInput((prev) => !prev);
//   }, [setShowGeometryInput]);

//   const toggleAutoDistribute = useCallback(() => {
//     setAutoDistributeEnabled((prev) => !prev);
//   }, [setAutoDistributeEnabled]);

//   const handleSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();

//       const allTouched = Object.keys(formData).reduce((acc, key) => {
//         acc[key] = true;
//         return acc;
//       }, {});
//       setTouched(allTouched);

//       let parsedGeom = null;
//       if (formData.geom && formData.geom.trim()) {
//         try {
//           parsedGeom = JSON.parse(formData.geom);
//         } catch {
//           setErrors((prev) => ({
//             ...prev,
//             geom: "Định dạng JSON không hợp lệ. Không thể gửi form.",
//           }));
//           return;
//         }
//       }

//       const processedLandUseDetails = formData.land_use_details
//         .filter((detail) => detail.ky_hieu_mdsd.trim() && detail.dien_tich)
//         .map((detail) => ({
//           ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
//           dien_tich: parseFloat(detail.dien_tich.replace(",", ".")),
//           geometry: detail.geometry ? JSON.parse(detail.geometry) : null,
//         }));

//       const submitData = {
//         ...formData,
//         so_to: parseInt(formData.so_to),
//         so_thua: parseInt(formData.so_thua),
//         dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
//         plot_list_id: formData.plot_list_id || null,
//         geom: parsedGeom,
//         status: formData.ten_chu.trim() ? "owned" : "available",
//         ky_hieu_mdsd: formData.ky_hieu_mdsd,
//         land_use_details:
//           processedLandUseDetails.length > 0
//             ? processedLandUseDetails
//             : undefined,
//       };

//       const newErrors = validateForm(submitData);
//       setErrors(newErrors);

//       if (Object.keys(newErrors).length > 0) {
//         const firstErrorElement = document.querySelector(".error");
//         if (firstErrorElement) {
//           firstErrorElement.scrollIntoView({
//             behavior: "smooth",
//             block: "center",
//           });
//         }
//         return;
//       }

//       await onSubmit(submitData);
//       if (fetchLandPlots) {
//         await fetchLandPlots();
//       }
//     },
//     [formData, onSubmit, fetchLandPlots, setTouched, setErrors]
//   );

//   return {
//     searchPlotList,
//     validateForm,
//     handleInputChange,
//     handleLandUseDetailChange,
//     bulkUpdateLandUseDetails,
//     addLandUseDetail,
//     calculateRemainingArea,
//     removeLandUseDetail,
//     autoDistributeArea,
//     handleGeometryChange,
//     formatGeometryJSON,
//     handleBlur,
//     toggleGeometryInput,
//     toggleAutoDistribute,
//     handleSubmit,
//   };
// };
const useLandPlotForm = ({
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
}) => {
  const searchPlotList = useCallback(
    async (so_to, so_thua) => {
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
        const result = await searchPlotListApi(so_to, so_thua);

        if (result.success && result.data.length > 0) {
          const exactPlotList = result.data.find(
            (plot) =>
              String(plot.so_to) === String(so_to) &&
              String(plot.so_thua) === String(so_thua)
          );

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
            setPlotListInfo(null);
            setFormData((prev) => ({
              ...prev,
              dien_tich: "",
            }));
          }
        } else {
          setPlotListInfo(null);
          setFormData((prev) => ({
            ...prev,
            dien_tich: "",
          }));
        }
      } catch (error) {
        console.error("❌ Error fetching plot list:", error);
        setPlotListInfo(null);
        setFormData((prev) => ({
          ...prev,
          dien_tich: "",
        }));
      } finally {
        setIsSearchingPlotList(false);
      }
    },
    [setFormData, setPlotListInfo, setIsSearchingPlotList]
  );

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      let processedValue = value;

      // Xử lý đặc biệt cho ky_hieu_mdsd - tách dựa trên cả dấu , và +
      if (name === "ky_hieu_mdsd") {
        // Nếu value là mảng (từ component con), sử dụng trực tiếp
        if (Array.isArray(value)) {
          processedValue = value;
        } else {
          // Tách chuỗi dựa trên dấu phẩy hoặc dấu cộng, loại bỏ khoảng trắng thừa
          processedValue = value
            .split(/[,+]/)
            .map((type) => type.trim().toUpperCase())
            .filter((type) => type.length > 0);
        }

        // Tự động chia diện tích khi có nhiều ký hiệu
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
      } else if (name === "dien_tich") {
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
      plotListInfo,
      autoDistributeEnabled,
      formData.land_use_details.length,
      formData.dien_tich,
      setFormData,
      setErrors,
    ]
  );

  const handleLandUseDetailChange = useCallback(
    (index, field, value) => {
      setFormData((prev) => {
        const newDetails = [...prev.land_use_details];
        newDetails[index] = {
          ...newDetails[index],
          [field]:
            field === "dien_tich" ? value.replace(/[^0-9.,]/g, "") : value,
        };
        return { ...prev, land_use_details: newDetails };
      });
    },
    [setFormData]
  );

  const bulkUpdateLandUseDetails = useCallback(
    (updates) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: updates,
      }));
    },
    [setFormData]
  );

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
  }, [setFormData]);

  const calculateRemainingArea = useCallback((data = formDataRef.current) => {
    const totalArea = parseFloat(data.dien_tich) || 0;
    const usedArea = data.land_use_details.reduce((sum, detail) => {
      return sum + (parseFloat(detail.dien_tich) || 0);
    }, 0);
    return Math.max(0, totalArea - usedArea);
  }, []);

  const removeLandUseDetail = useCallback(
    (index) => {
      setFormData((prev) => ({
        ...prev,
        land_use_details: prev.land_use_details.filter((_, i) => i !== index),
      }));
    },
    [setFormData]
  );

  const autoDistributeArea = useCallback(() => {
    if (formData.land_use_details.length > 0 && formData.dien_tich) {
      const totalArea = parseFloat(formData.dien_tich);
      const equalArea = (totalArea / formData.land_use_details.length).toFixed(
        2
      );
      bulkUpdateLandUseDetails(
        formData.land_use_details.map((detail) => ({
          ...detail,
          dien_tich: equalArea,
        }))
      );
    }
  }, [formData.land_use_details, formData.dien_tich, bulkUpdateLandUseDetails]);

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
      }, 500);
    },
    [errors.geom, setFormData, setErrors]
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
  }, [formData.geom, errors.geom, setFormData, setErrors]);

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));
    },
    [setTouched]
  );

  const toggleGeometryInput = useCallback(() => {
    setShowGeometryInput((prev) => !prev);
  }, [setShowGeometryInput]);

  const toggleAutoDistribute = useCallback(() => {
    setAutoDistributeEnabled((prev) => !prev);
  }, [setAutoDistributeEnabled]);

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
        .filter((detail) => detail.ky_hieu_mdsd?.trim() && detail.dien_tich)
        .map((detail) => {
          let parsedGeometry = null;
          if (detail.geometry && detail.geometry.trim()) {
            try {
              parsedGeometry = JSON.parse(detail.geometry);
            } catch {
              console.warn(`Invalid geometry for ${detail.ky_hieu_mdsd}`);
            }
          }

          return {
            ky_hieu_mdsd: detail.ky_hieu_mdsd.trim(),
            dien_tich: parseFloat(detail.dien_tich.replace(",", ".")),
            geometry: parsedGeometry,
          };
        });

      const submitData = {
        ...formData,
        so_to: parseInt(formData.so_to),
        so_thua: parseInt(formData.so_thua),
        dien_tich: parseFloat(formData.dien_tich.replace(",", ".")),
        plot_list_id: formData.plot_list_id || null,
        geom: parsedGeom,
        status: formData.ten_chu.trim() ? "owned" : "available",
        ky_hieu_mdsd: formData.ky_hieu_mdsd,
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
    [formData, onSubmit, fetchLandPlots, setTouched, setErrors]
  );

  return {
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
  };
};

export default useLandPlotForm;
