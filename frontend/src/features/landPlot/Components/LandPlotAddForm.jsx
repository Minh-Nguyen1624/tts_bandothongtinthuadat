import React from "react";
import {
  FaUser,
  FaMap,
  FaTag,
  FaRuler,
  FaLayerGroup,
  FaExclamationTriangle,
  FaCheck,
  FaSync,
  FaSpinner,
} from "react-icons/fa";

const LandPlotAddForm = ({
  formData,
  errors,
  touched,
  handleInputChange,
  handleBlur,
  loading,
  isSearchingPlotList,
  plotListInfo,
  plotListOptions,
  autoDistributeEnabled,
}) => {
  // Hàm xử lý riêng cho ky_hieu_mdsd
  const handleKyHieuMDSDChange = (e) => {
    const { value } = e.target;

    // Tách chuỗi dựa trên dấu phẩy hoặc dấu cộng, loại bỏ khoảng trắng thừa
    const types = value
      .split(/[,\s+]+/)
      .map((type) => type.trim().toUpperCase())
      .filter((type) => type.length > 0);

    // Tạo event giả để gửi đến handleInputChange
    const syntheticEvent = {
      target: {
        name: "ky_hieu_mdsd",
        value: types, // Gửi mảng đã được xử lý
      },
    };

    handleInputChange(syntheticEvent);
  };

  // Hiển thị giá trị dưới dạng chuỗi để người dùng có thể chỉnh sửa
  const displayKyHieuMDSD = Array.isArray(formData.ky_hieu_mdsd)
    ? formData.ky_hieu_mdsd.join(", ")
    : formData.ky_hieu_mdsd || "";

  return (
    <>
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

          <div className="form-group">
            <label className="blue-field-label" style={{ marginTop: "10px" }}>
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
            value={displayKyHieuMDSD} // Hiển thị dưới dạng chuỗi
            onChange={handleKyHieuMDSDChange} // Sử dụng hàm xử lý riêng
            onBlur={handleBlur}
            placeholder="VD: CAN, DGT, ODT hoặc CAN + DGT + ODT"
            className={`blue-input ${
              errors.ky_hieu_mdsd && touched.ky_hieu_mdsd ? "error" : ""
            }`}
            disabled={loading}
            maxLength={100}
          />
          {errors.ky_hieu_mdsd && touched.ky_hieu_mdsd && (
            <span className="blue-error-message">{errors.ky_hieu_mdsd}</span>
          )}
          {/* <div className="input-hint">
            Nhập nhiều loại đất bằng dấu phẩy (,) hoặc dấu cộng (+) (VD: CAN,
            DGT, ODT hoặc CAN + DGT + ODT)
            {autoDistributeEnabled && (
              <span style={{ color: "#28a745", marginLeft: "5px" }}>
                • Tự động chia diện tích
              </span>
            )}
          </div> */}
          {/* Hiển thị preview các ký hiệu đã nhập */}
          {Array.isArray(formData.ky_hieu_mdsd) &&
            formData.ky_hieu_mdsd.length > 0 && (
              <div className="ky-hieu-preview">
                <small>
                  Đã nhập:{" "}
                  {formData.ky_hieu_mdsd.map((type, index) => (
                    <span key={index} className="ky-hieu-tag">
                      {type}
                    </span>
                  ))}
                </small>
              </div>
            )}
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
            placeholder={
              plotListInfo
                ? "Diện tích (tự động từ PlotList)"
                : "Nhập diện tích thủ công"
            }
            className={`blue-input ${
              errors.dien_tich && touched.dien_tich ? "error" : ""
            }`}
            disabled={!!plotListInfo}
          />
          {errors.dien_tich && touched.dien_tich && (
            <span className="blue-error-message">{errors.dien_tich}</span>
          )}
          <div className="input-hint">
            {plotListInfo
              ? "Diện tích được lấy tự động từ PlotList"
              : "Không tìm thấy PlotList, vui lòng nhập diện tích thủ công"}
          </div>
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
    </>
  );
};

export default LandPlotAddForm;
