import React from "react";

const SearchStatus = ({ search, phuongXa, resultCount }) => {
  if (!search) return null;

  return (
    <div
      style={{
        padding: "8px 12px",
        backgroundColor: "#e7f3ff",
        border: "1px solid #b3d9ff",
        borderRadius: "4px",
        marginBottom: "15px",
        fontSize: "14px",
        color: "#0066cc",
      }}
    >
      🔍 Đang tìm kiếm: "<strong>{search}</strong>"
      {phuongXa && ` trong Phường/xã: ${phuongXa}`}
      {resultCount > 0 && ` - Tìm thấy ${resultCount} kết quả`}
      <br />
      <small style={{ color: "#666", fontSize: "12px" }}>
        ✓ Tìm kiếm không phân biệt chữ hoa/chữ thường
      </small>
    </div>
  );
};

export default SearchStatus;
