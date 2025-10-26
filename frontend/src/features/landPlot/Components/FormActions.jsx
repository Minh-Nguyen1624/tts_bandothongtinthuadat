// import React from "react";
// import { FaTimes, FaSave, FaGlobe, FaExpand, FaCompress } from "react-icons/fa";

// // const FormActions = ({
// //   isLoading,
// //   formStatus,
// //   handleClose,
// //   handleSubmit,
// //   showMap,
// //   hasValidGeometry,
// //   toggleMap,
// //   isMapExpanded,
// //   toggleMapExpand,
// // }) => (
// //   <div className="blue-form-actions">
// //     <div className="left-actions">
// //       <button
// //         type="button"
// //         onClick={toggleMap}
// //         className="blue-map-toggle-button"
// //         disabled={isLoading || !hasValidGeometry}
// //         title={hasValidGeometry ? "Ẩn/hiện bản đồ" : "Không có dữ liệu bản đồ"}
// //       >
// //         <FaGlobe className="button-icon" />
// //         {showMap ? "Ẩn Bản Đồ" : "Hiện Bản Đồ"}
// //       </button>
// //       {showMap && (
// //         <button
// //           type="button"
// //           onClick={toggleMapExpand}
// //           className="blue-expand-button"
// //           title={isMapExpanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"}
// //         >
// //           {isMapExpanded ? <FaCompress /> : <FaExpand />}
// //         </button>
// //       )}
// //     </div>
// //     <div className="action-buttons-right">
// //       <button
// //         type="button"
// //         onClick={handleClose}
// //         className="blue-cancel-button"
// //         disabled={isLoading}
// //       >
// //         <FaTimes className="button-icon" />
// //         Hủy
// //       </button>
// //       <button
// //         type="submit"
// //         className="blue-submit-button"
// //         // disabled={isLoading || !formStatus.isComplete}
// //         // disable
// //         title={
// //           !formStatus.isComplete
// //             ? "Vui lòng điền đầy đủ thông tin bắt buộc"
// //             : ""
// //         }
// //       >
// //         {isLoading ? (
// //           <>
// //             <div
// //               className="button-loading-spinner"
// //               aria-label="Đang xử lý"
// //             ></div>
// //             Đang cập nhật...
// //           </>
// //         ) : (
// //           <>
// //             <FaSave className="button-icon" />
// //             Cập nhật thửa đất
// //           </>
// //         )}
// //       </button>
// //     </div>
// //   </div>
// // );

// // export default FormActions;

// const FormActions = ({
//   isLoading,
//   formStatus,
//   handleClose,
//   handleSubmit,
//   showMap,
//   hasValidGeometry,
//   toggleMap,
//   isMapExpanded,
//   toggleMapExpand,
// }) => (
//   <div className="blue-form-actions">
//     <div className="left-actions">
//       <button
//         type="button"
//         onClick={toggleMap}
//         className="blue-map-toggle-button"
//         disabled={isLoading || !hasValidGeometry}
//         title={hasValidGeometry ? "Ẩn/hiện bản đồ" : "Không có dữ liệu bản đồ"}
//       >
//         <FaGlobe className="button-icon" />
//         {showMap ? "Ẩn Bản Đồ" : "Hiện Bản Đồ"}
//       </button>
//       {showMap && (
//         <button
//           type="button"
//           onClick={toggleMapExpand}
//           className="blue-expand-button"
//           title={isMapExpanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"}
//         >
//           {isMapExpanded ? <FaCompress /> : <FaExpand />}
//         </button>
//       )}
//     </div>
//     <div className="action-buttons-right">
//       <button
//         type="button"
//         onClick={handleClose}
//         className="blue-cancel-button"
//         disabled={isLoading}
//       >
//         <FaTimes className="button-icon" />
//         Hủy
//       </button>
//       <button
//         type="submit"
//         onClick={handleSubmit}
//         className="blue-submit-button"
//         disabled={isLoading}
//       >
//         {isLoading ? (
//           <>
//             <div
//               className="button-loading-spinner"
//               aria-label="Đang xử lý"
//             ></div>
//             Đang cập nhật...
//           </>
//         ) : (
//           <>
//             <FaSave className="button-icon" />
//             Cập nhật thửa đất
//           </>
//         )}
//       </button>
//     </div>
//   </div>
// );

// export default FormActions;

import React from "react";
import { FaTimes, FaSave, FaGlobe, FaExpand, FaCompress } from "react-icons/fa";

const FormActions = ({
  isLoading,
  formStatus,
  handleClose,
  handleSubmit,
  showMap,
  hasValidGeometry,
  toggleMap,
  isMapExpanded,
  toggleMapExpand,
  isEditMode = false,
}) => (
  <div className="blue-form-actions">
    <div className="left-actions">
      <button
        type="button"
        onClick={toggleMap}
        className="blue-map-toggle-button"
        disabled={isLoading || !hasValidGeometry}
        title={hasValidGeometry ? "Ẩn/hiện bản đồ" : "Không có dữ liệu bản đồ"}
      >
        <FaGlobe className="button-icon" />
        {showMap ? "Ẩn Bản Đồ" : "Hiện Bản Đồ"}
      </button>
      {showMap && (
        <button
          type="button"
          onClick={toggleMapExpand}
          className="blue-expand-button"
          title={isMapExpanded ? "Thu nhỏ bản đồ" : "Mở rộng bản đồ"}
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
        disabled={isLoading || (!isEditMode && !formStatus.isComplete)}
        title={
          !isEditMode && !formStatus.isComplete
            ? "Vui lòng điền đầy đủ thông tin bắt buộc"
            : ""
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
  </div>
);

export default FormActions;
