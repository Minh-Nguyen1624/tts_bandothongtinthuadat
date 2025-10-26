import React from "react";
import { FaTimes, FaSave } from "react-icons/fa";

// const FormAddActions = ({ onClose, loading, handleSubmit }) => (
//   <div className="blue-form-actions">
//     <button
//       type="button"
//       onClick={onClose}
//       className="blue-cancel-button"
//       disabled={loading}
//     >
//       Hủy
//     </button>
//     <button
//       type="submit"
//       onClick={handleSubmit}
//       className="blue-submit-button"
//       disabled={loading}
//     >
//       {loading ? (
//         <>
//           <div className="button-loading-spinner"></div>
//           Đang xử lý...
//         </>
//       ) : (
//         <>
//           <FaSave />
//           Thêm thửa đất
//         </>
//       )}
//     </button>
//   </div>
// );
const FormAddActions = ({ onClose, loading, handleSubmit }) => {
  return (
    <div className="blue-form-actions">
      <button
        type="button"
        onClick={onClose}
        className="blue-cancel-button"
        disabled={loading}
      >
        Hủy
      </button>
      <button type="submit" className="blue-submit-button" disabled={loading}>
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
  );
};

export default FormAddActions;
