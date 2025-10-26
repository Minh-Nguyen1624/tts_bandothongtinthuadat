// import React from "react";
// import {
//   FaUser,
//   FaMap,
//   FaTag,
//   FaRuler,
//   FaStickyNote,
//   FaDrawPolygon,
//   FaPlus,
//   FaMinus,
//   FaLayerGroup,
//   FaTimes,
//   FaSave,
//   FaExpand,
//   FaCompress,
//   FaInfoCircle,
// } from "react-icons/fa";

// const LandPlotForm = ({
//   formData,
//   errors,
//   isLoading,
//   phuongXaOptions,
//   plotListOptions,
//   handleInputChange,
//   handleAddLandUseType,
//   handleRemoveLandUseType,
//   handleLandUseTypeChange,
//   handleGeometryChange,
//   formatGeometryJSON,
//   showGeometryInput,
//   toggleGeometryInput,
//   handleBlur,
//   isValidDienTich,
// }) => (
//   <>
//     <div className="form-row">
//       <div className="form-group">
//         <label className="blue-field-label">
//           <FaUser /> Tên chủ sở hữu
//           <span className="optional-badge">Tùy chọn</span>
//         </label>
//         <input
//           type="text"
//           name="ten_chu"
//           value={formData.ten_chu}
//           onChange={handleInputChange}
//           placeholder="Nhập tên chủ sở hữu"
//           className={`blue-input ${errors.ten_chu ? "error" : ""}`}
//           disabled={isLoading}
//           maxLength={100}
//           onBlur={handleBlur}
//         />
//         {errors.ten_chu && (
//           <span className="blue-error-message">{errors.ten_chu}</span>
//         )}
//       </div>
//       <div className="form-group compact-group">
//         <label className="blue-field-label">
//           <FaMap /> Thông tin thửa đất
//           <span className="required-asterisk">*</span>
//         </label>
//         <div className="compact-row">
//           <div className="compact-field">
//             <label className="blue-field-label">
//               Số tờ<span className="required-asterisk">*</span>
//             </label>
//             <input
//               type="number"
//               name="so_to"
//               value={formData.so_to}
//               onChange={handleInputChange}
//               placeholder="Số tờ"
//               className={`blue-input compact-input ${
//                 errors.so_to ? "error" : ""
//               }`}
//               min="1"
//               onBlur={handleBlur}
//             />
//             {errors.so_to && (
//               <span className="blue-error-message compact-error">
//                 {errors.so_to}
//               </span>
//             )}
//           </div>
//           <div className="compact-field">
//             <label className="blue-field-label">
//               Số thửa<span className="required-asterisk">*</span>
//             </label>
//             <input
//               type="number"
//               name="so_thua"
//               value={formData.so_thua}
//               onChange={handleInputChange}
//               placeholder="Số thửa"
//               className={`blue-input compact-input ${
//                 errors.so_thua ? "error" : ""
//               }`}
//               min="1"
//               onBlur={handleBlur}
//             />
//             {errors.so_thua && (
//               <span className="blue-error-message compact-error">
//                 {errors.so_thua}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>

//     <div className="form-row">
//       <div className="form-group">
//         <label className="blue-field-label">
//           <FaTag /> Mục đích sử dụng<span className="required-asterisk">*</span>
//         </label>
//         <div className="land-use-types-container">
//           {formData.ky_hieu_mdsd.map((type, index) => (
//             <div key={index} className="land-use-type-item">
//               <input
//                 type="text"
//                 value={type}
//                 onChange={(e) => handleLandUseTypeChange(index, e.target.value)}
//                 placeholder="VD: ODT, CLN, ONT..."
//                 className={`blue-input ${
//                   errors[`ky_hieu_mdsd_${index}`] ? "error" : ""
//                 }`}
//                 disabled={isLoading}
//                 maxLength={20}
//                 onBlur={handleBlur}
//               />
//               {formData.ky_hieu_mdsd.length > 1 && (
//                 <button
//                   type="button"
//                   onClick={() => handleRemoveLandUseType(index)}
//                   className="remove-type-button"
//                   disabled={isLoading}
//                 >
//                   <FaMinus />
//                 </button>
//               )}
//               {errors[`ky_hieu_mdsd_${index}`] && (
//                 <span className="blue-error-message">
//                   {errors[`ky_hieu_mdsd_${index}`]}
//                 </span>
//               )}
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={handleAddLandUseType}
//             className="add-type-button"
//             disabled={isLoading}
//           >
//             <FaPlus /> Thêm loại đất
//           </button>
//         </div>
//         {errors.ky_hieu_mdsd && (
//           <span className="blue-error-message">{errors.ky_hieu_mdsd}</span>
//         )}
//         <div className="input-hint">
//           Nhập mã mục đích sử dụng đất theo quy định
//         </div>
//       </div>

//       <div className="form-group">
//         <label className="blue-field-label">
//           <FaRuler /> Diện tích (m²)<span className="required-asterisk">*</span>
//         </label>
//         <input
//           type="text"
//           name="dien_tich"
//           value={formData.dien_tich}
//           onChange={handleInputChange}
//           placeholder="Nhập diện tích"
//           className={`blue-input ${errors.dien_tich ? "error" : ""}`}
//           disabled={isLoading || isValidDienTich()}
//           onBlur={handleBlur}
//         />
//         {errors.dien_tich && (
//           <span className="blue-error-message">{errors.dien_tich}</span>
//         )}
//       </div>
//     </div>

//     <div className="form-row">
//       <div className="form-group">
//         <label className="blue-field-label">
//           <FaMap /> Phường/Xã<span className="required-asterisk">*</span>
//         </label>
//         <select
//           name="phuong_xa"
//           value={formData.phuong_xa}
//           onChange={handleInputChange}
//           className={`blue-select ${errors.phuong_xa ? "error" : ""}`}
//           disabled={isLoading}
//           onBlur={handleBlur}
//         >
//           <option value="">Chọn Phường/Xã</option>
//           {phuongXaOptions.map((px) => (
//             <option key={px} value={px}>
//               {px}
//             </option>
//           ))}
//         </select>
//         {errors.phuong_xa && (
//           <span className="blue-error-message">{errors.phuong_xa}</span>
//         )}
//       </div>

//       <div className="form-group">
//         <label className="blue-field-label">
//           <FaLayerGroup /> Danh sách thửa đất
//         </label>
//         <select
//           name="plot_list_id"
//           value={formData.plot_list_id}
//           onChange={handleInputChange}
//           className="blue-input blue-select"
//           disabled={isLoading}
//           onBlur={handleBlur}
//         >
//           <option value="">Chọn danh sách thửa đất</option>
//           {plotListOptions && plotListOptions.length > 0 ? (
//             plotListOptions.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name ||
//                   option.ten_danh_sach ||
//                   `Danh sách ${option.organization_name}`}
//               </option>
//             ))
//           ) : (
//             <option value="" disabled>
//               Không có danh sách nào
//             </option>
//           )}
//         </select>
//       </div>
//     </div>

//     <div className="form-group full-width">
//       <label className="blue-field-label">
//         <FaStickyNote /> Ghi chú<span className="optional-badge">Tùy chọn</span>
//       </label>
//       <textarea
//         name="ghi_chu"
//         value={formData.ghi_chu}
//         onChange={handleInputChange}
//         placeholder="Nhập ghi chú bổ sung về thửa đất..."
//         className="blue-textarea"
//         disabled={isLoading}
//         rows={3}
//         maxLength={500}
//         onBlur={handleBlur}
//       />
//       <div className="input-hint">
//         Ghi chú về tình trạng, đặc điểm hoặc thông tin khác của thửa đất
//       </div>
//     </div>

//     <div className="form-group full-width">
//       <div className="geometry-section">
//         <div className="geometry-header">
//           <label className="blue-field-label">
//             <FaDrawPolygon /> Dữ liệu Hình học (Geometry)
//           </label>
//           <button
//             type="button"
//             onClick={toggleGeometryInput}
//             className="geometry-toggle-button"
//             disabled={isLoading}
//           >
//             {showGeometryInput ? "Ẩn" : "Hiện"} Dữ liệu Geometry
//           </button>
//         </div>
//         {showGeometryInput && (
//           <div className="geometry-input-container">
//             <div className="geometry-toolbar">
//               <button
//                 type="button"
//                 onClick={formatGeometryJSON}
//                 className="geometry-format-button"
//                 disabled={isLoading || !formData.geom}
//               >
//                 Format JSON
//               </button>
//             </div>
//             <textarea
//               name="geom"
//               value={
//                 typeof formData.geom === "string"
//                   ? formData.geom
//                   : JSON.stringify(formData.geom || {}, null, 2)
//               }
//               onChange={handleGeometryChange}
//               placeholder='Nhập dữ liệu GeoJSON (VD: {"type": "Polygon", "coordinates": [[[106.38111,10.35724],[106.38689,10.35724],[106.38689,10.35174],[106.38111,10.35174],[106.38111,10.35724]]]})'
//               className={`blue-textarea geometry-textarea ${
//                 errors.geom ? "error" : ""
//               }`}
//               disabled={isLoading}
//               rows={6}
//               onBlur={handleBlur}
//             />
//             {errors.geom && (
//               <span className="blue-error-message">{errors.geom}</span>
//             )}
//             <div className="input-hint">
//               Nhập dữ liệu hình học dạng GeoJSON (tùy chọn). Đảm bảo định dạng
//               JSON hợp lệ.
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   </>
// );

// export default LandPlotForm;

import React from "react";
import {
  FaUser,
  FaMap,
  FaTag,
  FaRuler,
  FaStickyNote,
  FaDrawPolygon,
  FaPlus,
  FaMinus,
  FaLayerGroup,
  FaTimes,
  FaSave,
  FaExpand,
  FaCompress,
  FaInfoCircle,
} from "react-icons/fa";

const LandPlotForm = ({
  formData,
  errors,
  isLoading,
  phuongXaOptions,
  plotListOptions,
  handleInputChange,
  handleAddLandUseType,
  handleRemoveLandUseType,
  handleLandUseTypeChange,
  handleGeometryChange,
  formatGeometryJSON,
  showGeometryInput,
  toggleGeometryInput,
  handleBlur,
  isValidDienTich,
}) => (
  <>
    <div className="form-row">
      <div className="form-group">
        <label className="blue-field-label">
          <FaUser /> Tên chủ sở hữu
          <span className="optional-badge">Tùy chọn</span>
        </label>
        <input
          type="text"
          name="ten_chu"
          value={formData.ten_chu}
          onChange={handleInputChange}
          placeholder="Nhập tên chủ sở hữu"
          className={`blue-input ${errors.ten_chu ? "error" : ""}`}
          disabled={isLoading}
          maxLength={100}
          onBlur={handleBlur}
        />
        {errors.ten_chu && (
          <span className="blue-error-message">{errors.ten_chu}</span>
        )}
      </div>
      <div className="form-group compact-group">
        <label className="blue-field-label">
          <FaMap /> Thông tin thửa đất
          <span className="required-asterisk">*</span>
        </label>
        <div className="compact-row">
          <div className="compact-field">
            <label className="blue-field-label">
              Số tờ<span className="required-asterisk">*</span>
            </label>
            <input
              type="number"
              name="so_to"
              value={formData.so_to}
              onChange={handleInputChange}
              placeholder="Số tờ"
              className={`blue-input compact-input ${
                errors.so_to ? "error" : ""
              }`}
              min="1"
              onBlur={handleBlur}
            />
            {errors.so_to && (
              <span className="blue-error-message compact-error">
                {errors.so_to}
              </span>
            )}
          </div>
          <div className="compact-field">
            <label className="blue-field-label">
              Số thửa<span className="required-asterisk">*</span>
            </label>
            <input
              type="number"
              name="so_thua"
              value={formData.so_thua}
              onChange={handleInputChange}
              placeholder="Số thửa"
              className={`blue-input compact-input ${
                errors.so_thua ? "error" : ""
              }`}
              min="1"
              onBlur={handleBlur}
            />
            {errors.so_thua && (
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
          <FaTag /> Mục đích sử dụng<span className="required-asterisk">*</span>
        </label>
        <div className="land-use-types-container">
          {formData.ky_hieu_mdsd.map((type, index) => (
            <div key={index} className="land-use-type-item">
              <input
                type="text"
                value={type}
                onChange={(e) => handleLandUseTypeChange(index, e.target.value)}
                placeholder="VD: ODT, CLN, ONT..."
                className={`blue-input ${
                  errors[`ky_hieu_mdsd_${index}`] ? "error" : ""
                }`}
                disabled={isLoading}
                maxLength={20}
                onBlur={handleBlur}
              />
              {formData.ky_hieu_mdsd.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLandUseType(index)}
                  className="remove-type-button"
                  disabled={isLoading}
                >
                  <FaMinus />
                </button>
              )}
              {errors[`ky_hieu_mdsd_${index}`] && (
                <span className="blue-error-message">
                  {errors[`ky_hieu_mdsd_${index}`]}
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddLandUseType}
            className="add-type-button"
            disabled={isLoading}
          >
            <FaPlus /> Thêm loại đất
          </button>
        </div>
        {errors.ky_hieu_mdsd && (
          <span className="blue-error-message">{errors.ky_hieu_mdsd}</span>
        )}
        <div className="input-hint">
          Nhập mã mục đích sử dụng đất theo quy định
        </div>
      </div>

      <div className="form-group">
        <label className="blue-field-label">
          <FaRuler /> Diện tích (m²)<span className="required-asterisk">*</span>
        </label>
        <input
          type="text"
          name="dien_tich"
          value={formData.dien_tich}
          onChange={handleInputChange}
          placeholder="Nhập diện tích"
          className={`blue-input ${errors.dien_tich ? "error" : ""}`}
          disabled={isLoading || isValidDienTich()}
          onBlur={handleBlur}
        />
        {errors.dien_tich && (
          <span className="blue-error-message">{errors.dien_tich}</span>
        )}
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label className="blue-field-label">
          <FaMap /> Phường/Xã<span className="required-asterisk">*</span>
        </label>
        <select
          name="phuong_xa"
          value={formData.phuong_xa}
          onChange={handleInputChange}
          className={`blue-select ${errors.phuong_xa ? "error" : ""}`}
          disabled={isLoading}
          onBlur={handleBlur}
        >
          <option value="">Chọn Phường/Xã</option>
          {phuongXaOptions.map((px) => (
            <option key={px} value={px}>
              {px}
            </option>
          ))}
        </select>
        {errors.phuong_xa && (
          <span className="blue-error-message">{errors.phuong_xa}</span>
        )}
      </div>

      <div className="form-group">
        <label className="blue-field-label">
          <FaLayerGroup /> Danh sách thửa đất
        </label>
        <select
          name="plot_list_id"
          value={formData.plot_list_id}
          onChange={handleInputChange}
          className="blue-input blue-select"
          disabled={isLoading}
          onBlur={handleBlur}
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
    </div>

    <div className="form-group full-width">
      <label className="blue-field-label">
        <FaStickyNote /> Ghi chú<span className="optional-badge">Tùy chọn</span>
      </label>
      <textarea
        name="ghi_chu"
        value={formData.ghi_chu}
        onChange={handleInputChange}
        placeholder="Nhập ghi chú bổ sung về thửa đất..."
        className="blue-textarea"
        disabled={isLoading}
        rows={3}
        maxLength={500}
        onBlur={handleBlur}
      />
      <div className="input-hint">
        Ghi chú về tình trạng, đặc điểm hoặc thông tin khác của thửa đất
      </div>
    </div>
    {/* 
    <div className="form-group full-width">
      <div className="geometry-section">
        <div className="geometry-header">
          <label className="blue-field-label">
            <FaDrawPolygon /> Dữ liệu Hình học (Geometry)
          </label>
          <button
            type="button"
            onClick={toggleGeometryInput}
            className="geometry-toggle-button"
            disabled={isLoading}
          >
            {showGeometryInput ? "Ẩn" : "Hiện"} Dữ liệu Geometry
          </button>
        </div>
        {showGeometryInput && (
          <div className="geometry-input-container">
            <div className="geometry-toolbar">
              <button
                type="button"
                onClick={formatGeometryJSON}
                className="geometry-format-button"
                disabled={isLoading || !formData.geom}
              >
                Format JSON
              </button>
            </div>
            <textarea
              name="geom"
              value={
                typeof formData.geom === "string"
                  ? formData.geom
                  : JSON.stringify(formData.geom || {}, null, 2)
              }
              onChange={(e) => {
                const value = e.target.value;
                try {
                  // Làm sạch dữ liệu: loại bỏ điểm trùng lặp cuối cùng nếu có
                  const parsed = JSON.parse(value);
                  if (parsed.type === "Polygon" && parsed.coordinates[0]) {
                    const coords = parsed.coordinates[0];
                    if (
                      coords.length > 2 &&
                      coords[0][0] === coords[coords.length - 1][0] &&
                      coords[0][1] === coords[coords.length - 1][1]
                    ) {
                      parsed.coordinates[0] = coords.slice(0, -1); // Loại bỏ điểm cuối trùng
                    }
                    handleGeometryChange({
                      target: { name: "geom", value: JSON.stringify(parsed) },
                    });
                  } else {
                    handleGeometryChange(e);
                  }
                } catch (error) {
                  handleGeometryChange(e); // Giữ nguyên nếu không parse được
                }
              }}
              placeholder='Nhập dữ liệu GeoJSON (VD: {"type": "Polygon", "coordinates": [[[106.38111,10.35724],[106.38689,10.35724],[106.38689,10.35174],[106.38111,10.35174],[106.38111,10.35724]]]})'
              className={`blue-textarea geometry-textarea ${
                errors.geom ? "error" : ""
              }`}
              disabled={isLoading}
              rows={6}
              onBlur={handleBlur}
            />
            {errors.geom && (
              <span className="blue-error-message">{errors.geom}</span>
            )}
            <div className="input-hint">
              Nhập dữ liệu hình học dạng GeoJSON (tùy chọn). Đảm bảo định dạng
              JSON hợp lệ.
            </div>
          </div>
        )}
      </div>
    </div> */}
  </>
);

export default LandPlotForm;
