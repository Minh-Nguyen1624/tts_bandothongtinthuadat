// export const validateForm = (data) => {
//   const newErrors = {};

//   const so_to = data.so_to != null ? String(data.so_to) : "";
//   const so_thua = data.so_thua != null ? String(data.so_thua) : "";
//   const dien_tich = data.dien_tich != null ? String(data.dien_tich) : "";
//   const ky_hieu_mdsd = data.ky_hieu_mdsd != null ? data.ky_hieu_mdsd : [];
//   const geom = data.geom != null ? data.geom : null;

//   if (data.ten_chu && data.ten_chu.trim().length > 100) {
//     newErrors.ten_chu = "Tên chủ không được vượt quá 100 ký tự";
//   }

//   if (!so_to.trim()) {
//     newErrors.so_to = "Vui lòng nhập số tờ";
//   } else if (isNaN(parseInt(so_to)) || parseInt(so_to) <= 0) {
//     newErrors.so_to = "Số tờ phải là số dương";
//   }

//   if (!so_thua.trim()) {
//     newErrors.so_thua = "Vui lòng nhập số thửa";
//   } else if (isNaN(parseInt(so_thua)) || parseInt(so_thua) <= 0) {
//     newErrors.so_thua = "Số thửa phải là số dương";
//   }

//   if (!data.ky_hieu_mdsd.length) {
//     newErrors.ky_hieu_mdsd =
//       "Vui lòng nhập ít nhất một ký hiệu mục đích sử dụng";
//   } else {
//     data.ky_hieu_mdsd.forEach((type, index) => {
//       if (type.trim().length > 20) {
//         newErrors[`ky_hieu_mdsd_${index}`] =
//           "Ký hiệu không được vượt quá 20 ký tự";
//       }
//     });
//   }

//   if (!dien_tich.trim()) {
//     newErrors.dien_tich = "Vui lòng nhập diện tích";
//   } else if (isNaN(parseFloat(dien_tich)) || parseFloat(dien_tich) <= 0) {
//     newErrors.dien_tich = "Diện tích phải là số dương";
//   }

//   if (!data.phuong_xa.trim()) {
//     newErrors.phuong_xa = "Vui lòng chọn phường/xã";
//   } else if (data.phuong_xa.trim().length > 100) {
//     newErrors.phuong_xa = "Phường/Xã không được vượt quá 100 ký tự";
//   }

//   if (data.land_use_details && data.land_use_details.length > 0) {
//     const totalDetailArea = data.land_use_details.reduce((sum, detail) => {
//       return sum + (parseFloat(detail.dien_tich) || 0);
//     }, 0);
//     const plotListArea = parseFloat(dien_tich) || 0;

//     if (Math.abs(totalDetailArea - plotListArea) > 0.01) {
//       newErrors.land_use_details = `Tổng diện tích chi tiết (${totalDetailArea.toFixed(
//         2
//       )} m²) không khớp với diện tích tổng (${plotListArea.toFixed(2)} m²)`;
//     }

//     data.land_use_details.forEach((detail, index) => {
//       if (!detail.ky_hieu_mdsd?.trim()) {
//         newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
//           "Vui lòng nhập ký hiệu MDSD";
//       } else if (detail.ky_hieu_mdsd.trim().length > 50) {
//         newErrors[`land_use_details_${index}_ky_hieu_mdsd`] =
//           "Ký hiệu không được vượt quá 50 ký tự";
//       }
//       if (!detail.dien_tich || parseFloat(detail.dien_tich) <= 0) {
//         newErrors[`land_use_details_${index}_dien_tich`] =
//           "Diện tích phải là số dương";
//       }
//     });
//   }

//   if (data.geom && String(data.geom).trim() && typeof data.geom !== "object") {
//     try {
//       JSON.parse(data.geom);
//     } catch {
//       newErrors.geom = "Định dạng JSON không hợp lệ";
//     }
//   }

//   return newErrors;
// };

// src/features/landPlot/utils/validationUtils.js
export const validateForm = (data) => {
  const newErrors = {};

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

  if (data.geom && String(data.geom).trim() && typeof data.geom !== "object") {
    try {
      JSON.parse(data.geom);
    } catch {
      newErrors.geom = "Định dạng JSON không hợp lệ";
    }
  }

  return newErrors;
};
