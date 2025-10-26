// export const validateForm = (data, isEditMode = false, originalData = {}) => {
//   const newErrors = {};

//   // Only validate fields that are required or have been modified
//   if (
//     !isEditMode ||
//     !originalData.ten_chu ||
//     data.ten_chu !== originalData.ten_chu
//   ) {
//     if (data.ten_chu && data.ten_chu.trim().length > 100) {
//       newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
//     }
//   }

//   if (!isEditMode || !originalData.so_to || data.so_to !== originalData.so_to) {
//     if (!data.so_to || data.so_to.toString().trim() === "") {
//       newErrors.so_to = "Vui lòng nhập số tờ";
//     } else {
//       const soTo = parseInt(data.so_to);
//       if (isNaN(soTo) || soTo <= 0) newErrors.so_to = "Số tờ phải là số dương";
//     }
//   }

//   if (
//     !isEditMode ||
//     !originalData.so_thua ||
//     data.so_thua !== originalData.so_thua
//   ) {
//     if (!data.so_thua || data.so_thua.toString().trim() === "") {
//       newErrors.so_thua = "Vui lòng nhập số thửa";
//     } else {
//       const soThua = parseInt(data.so_thua);
//       if (isNaN(soThua) || soThua <= 0)
//         newErrors.so_thua = "Số thửa phải là số dương";
//     }
//   }

//   if (
//     !isEditMode ||
//     !originalData.ky_hieu_mdsd ||
//     JSON.stringify(data.ky_hieu_mdsd) !==
//       JSON.stringify(originalData.ky_hieu_mdsd)
//   ) {
//     if (!data.ky_hieu_mdsd || data.ky_hieu_mdsd.length === 0) {
//       newErrors.ky_hieu_mdsd =
//         "Vui lòng nhập ít nhất một ký hiệu mục đích sử dụng";
//     } else {
//       data.ky_hieu_mdsd.forEach((type, index) => {
//         if (!type.trim())
//           newErrors[`ky_hieu_mdsd_${index}`] = "Ký hiệu không được để trống";
//         else if (type.length > 20)
//           newErrors[`ky_hieu_mdsd_${index}`] =
//             "Ký hiệu không được vượt quá 20 ký tự";
//       });
//     }
//   }

//   if (
//     !isEditMode ||
//     !originalData.phuong_xa ||
//     data.phuong_xa !== originalData.phuong_xa
//   ) {
//     if (!data.phuong_xa?.trim())
//       newErrors.phuong_xa = "Vui lòng chọn phường/xã";
//   }

//   if (
//     !isEditMode ||
//     !originalData.dien_tich ||
//     data.dien_tich !== originalData.dien_tich
//   ) {
//     if (!data.dien_tich || data.dien_tich.toString().trim() === "") {
//       newErrors.dien_tich = "Vui lòng nhập diện tích";
//     } else {
//       const dienTich = parseFloat(data.dien_tich.replace(",", "."));
//       if (isNaN(dienTich) || dienTich <= 0)
//         newErrors.dien_tich = "Diện tích phải là số dương";
//     }
//   }

//   if (data.land_use_details && data.land_use_details.length > 0) {
//     data.land_use_details.forEach((detail, index) => {
//       if (!detail.ky_hieu_mdsd?.trim())
//         newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
//           "Ký hiệu không được để trống";
//       if (!detail.dien_tich || parseFloat(detail.dien_tich) <= 0)
//         newErrors[`land_use_details_${index}_dien_tich`] =
//           "Diện tích phải lớn hơn 0";
//     });
//     const totalDetailArea = data.land_use_details.reduce(
//       (sum, detail) => sum + (parseFloat(detail.dien_tich) || 0),
//       0
//     );
//     const plotArea = parseFloat(data.dien_tich) || 0;
//     if (data.ky_hieu_mdsd.length === 1) {
//       if (
//         Math.abs(parseFloat(data.land_use_details[0].dien_tich) - plotArea) >
//         0.01
//       )
//         newErrors.land_use_details = `Diện tích chi tiết (${
//           data.land_use_details[0].dien_tich
//         } m²) không khớp với diện tích tổng (${plotArea.toFixed(2)} m²)`;
//     } else if (Math.abs(totalDetailArea - plotArea) > 0.01)
//       newErrors.land_use_details = `Tổng diện tích chi tiết (${totalDetailArea.toFixed(
//         2
//       )} m²) không khớp với diện tích tổng (${plotArea.toFixed(2)} m²)`;
//     const detailTypes = data.land_use_details.map((d) => d.ky_hieu_mdsd);
//     const mainTypes = data.ky_hieu_mdsd || [];
//     const missingTypes = detailTypes.filter(
//       (type) => !mainTypes.includes(type)
//     );
//     if (missingTypes.length > 0)
//       newErrors.land_use_details_types = `Loại đất trong chi tiết (${missingTypes.join(
//         ", "
//       )}) không có trong loại đất chính`;
//   }

//   return newErrors;
// };

export const validateForm = (data, isEditMode = false) => {
  const newErrors = {};

  if (data.ten_chu && data.ten_chu.trim().length > 100) {
    newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
  }

  if (!isEditMode && (!data.so_to || data.so_to.toString().trim() === "")) {
    newErrors.so_to = "Vui lòng nhập số tờ";
  } else if (data.so_to && data.so_to.toString().trim() !== "") {
    const soTo = parseInt(data.so_to);
    if (isNaN(soTo) || soTo <= 0) newErrors.so_to = "Số tờ phải là số dương";
  }

  if (!isEditMode && (!data.so_thua || data.so_thua.toString().trim() === "")) {
    newErrors.so_thua = "Vui lòng nhập số thửa";
  } else if (data.so_thua && data.so_thua.toString().trim() !== "") {
    const soThua = parseInt(data.so_thua);
    if (isNaN(soThua) || soThua <= 0)
      newErrors.so_thua = "Số thửa phải là số dương";
  }

  if (!isEditMode && (!data.ky_hieu_mdsd || data.ky_hieu_mdsd.length === 0)) {
    newErrors.ky_hieu_mdsd =
      "Vui lòng nhập ít nhất một ký hiệu mục đích sử dụng";
  } else if (data.ky_hieu_mdsd && data.ky_hieu_mdsd.length > 0) {
    data.ky_hieu_mdsd.forEach((type, index) => {
      if (!type.trim())
        newErrors[`ky_hieu_mdsd_${index}`] = "Ký hiệu không được để trống";
      else if (type.length > 20)
        newErrors[`ky_hieu_mdsd_${index}`] =
          "Ký hiệu không được vượt quá 20 ký tự";
    });
  }

  if (!isEditMode && !data.phuong_xa?.trim()) {
    newErrors.phuong_xa = "Vui lòng chọn phường/xã";
  }

  if (
    !isEditMode &&
    (!data.dien_tich || data.dien_tich.toString().trim() === "")
  ) {
    newErrors.dien_tich = "Vui lòng nhập diện tích";
  } else if (data.dien_tich && data.dien_tich.toString().trim() !== "") {
    const dienTich = parseFloat(data.dien_tich.replace(",", "."));
    if (isNaN(dienTich) || dienTich <= 0)
      newErrors.dien_tich = "Diện tích phải là số dương";
  }

  if (data.land_use_details && data.land_use_details.length > 0) {
    data.land_use_details.forEach((detail, index) => {
      if (!detail.ky_hieu_mdsd?.trim())
        newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
          "Ký hiệu không được để trống";
      if (!detail.dien_tich || parseFloat(detail.dien_tich) <= 0)
        newErrors[`land_use_details_${index}_dien_tich`] =
          "Diện tích phải lớn hơn 0";
    });

    const totalDetailArea = data.land_use_details.reduce(
      (sum, detail) => sum + (parseFloat(detail.dien_tich) || 0),
      0
    );
    const plotArea = parseFloat(data.dien_tich) || 0;

    if (data.ky_hieu_mdsd.length === 1) {
      if (
        Math.abs(parseFloat(data.land_use_details[0].dien_tich) - plotArea) >
        0.01
      )
        newErrors.land_use_details = `Diện tích chi tiết (${
          data.land_use_details[0].dien_tich
        } m²) không khớp với diện tích tổng (${plotArea.toFixed(2)} m²)`;
    } else if (Math.abs(totalDetailArea - plotArea) > 0.01)
      newErrors.land_use_details = `Tổng diện tích chi tiết (${totalDetailArea.toFixed(
        2
      )} m²) không khớp với diện tích tổng (${plotArea.toFixed(2)} m²)`;

    const detailTypes = data.land_use_details.map((d) => d.ky_hieu_mdsd);
    const mainTypes = data.ky_hieu_mdsd || [];
    const missingTypes = detailTypes.filter(
      (type) => !mainTypes.includes(type)
    );
    if (missingTypes.length > 0)
      newErrors.land_use_details_types = `Loại đất trong chi tiết (${missingTypes.join(
        ", "
      )}) không có trong loại đất chính`;
  }

  return newErrors;
};
