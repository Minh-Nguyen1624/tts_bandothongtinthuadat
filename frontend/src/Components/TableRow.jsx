import React, { useState } from "react";
import "../css/HomePage.css";

const TableRow = React.memo(({ item, index, currentType, tableHeaders }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Render nội dung cell theo cấu hình
  const renderCellContent = (header, item) => {
    console.log(`TableRow [${currentType}] item:`, item);
    console.log(`TableRow [${currentType}] header:`, header);

    // Chỉ xử lý cho land_plots
    switch (header) {
      case "STT":
        return index + 1;
      case "Tên chủ":
        return item.ten_chu || item.name || "-";
      case "Số tờ":
        return item.so_to || "-";
      case "Số thửa":
        return item.so_thua || "-";
      case "Ký hiệu mục đích sử dụng":
        return item.ky_hieu_mdsd || item.ky_hieu_muc_dich_su_dung || "-";
      case "Phường/Xã":
        return item.phuong_xa || item.dia_chi || "-";

      default:
        return item[header.toLowerCase()] || "-";
    }
  };

  return (
    <tr
      className={`table-row ${index % 2 === 0 ? "even" : "odd"} ${
        isHovered ? "hovered" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {tableHeaders.map((header) => (
        <td key={header} className="table-cell">
          {renderCellContent(header, item)}
        </td>
      ))}
    </tr>
  );
});

export default TableRow;
