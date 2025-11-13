// SearchPanel.jsx
import React from "react";
import { FaSearch, FaSpinner } from "react-icons/fa";

const SearchPanel = ({
  selectedPhuong,
  soTo,
  soThua,
  phuongList,
  isLoading,
  onPhuongChange,
  onSoToChange,
  onSoThuaChange,
  onSearch,
}) => {
  return (
    <div className="header">
      <div>
        <select
          className="select_xa"
          value={selectedPhuong}
          onChange={onPhuongChange}
        >
          <option value="">--Chọn Phường/Xã--</option>
          {phuongList.map((phuong, index) => (
            <option key={index} value={phuong.ten_phuong_xa}>
              {phuong.ten_phuong_xa}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="so_to"
          placeholder="Số Tờ"
          value={soTo}
          onChange={onSoToChange}
        />
        <input
          type="number"
          className="so_thua"
          placeholder="Số Thửa"
          value={soThua}
          onChange={onSoThuaChange}
        />
        <button className="btn-search" onClick={onSearch} disabled={isLoading}>
          {isLoading ? (
            <FaSpinner className="spinner" />
          ) : (
            <FaSearch style={{ marginRight: "5px" }} />
          )}
          {isLoading ? "Đang tải..." : "Tra cứu"}
        </button>
      </div>
      <select className="select_qh">
        <option value="">Chọn quy hoạch</option>
        <option value="Đất ở">Đất ở</option>
        <option value="Đất công cộng">Đất công cộng</option>
        <option value="Đất nông nghiệp">Đất nông nghiệp</option>
      </select>
    </div>
  );
};

export default SearchPanel;
