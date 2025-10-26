import React, { useState } from "react";
import { FaRegEdit, FaSearchLocation, FaTrashAlt } from "react-icons/fa";
import LandPlotMapModal from "../Components/LandPlotMapModal.jsx";

const LandPlotTable = ({
  data,
  startIndex,
  loading,
  searching,
  search,
  onEditPlot,
  onDeletePlot,
  onViewLocation,
}) => {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const handleViewLocation = (landPlot) => {
    setSelectedPlot(landPlot);
    setShowMapModal(true);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
    setSelectedPlot(null);
  };

  const tableHeaders = [
    "STT",
    "Tên chủ",
    "Số tờ",
    "Số thửa",
    "Ký hiệu mục đích sử dụng",
    "Phường/Xã",
    "Thao tác",
  ];

  const getAlignment = (header) => {
    return header === "STT" ||
      header === "Tên chủ" ||
      header === "Số tờ" ||
      header === "Số thửa" ||
      header === "Thao tác" ||
      header === "Phường/Xã" ||
      header === "Ký hiệu mục đích sử dụng"
      ? "center"
      : "left";
  };

  return (
    <>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "4px",
          overflow: "hidden",
          border: "1px solid #dee2e6",
          marginBottom: "15px",
          minHeight: "400px",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: "14px",
              minWidth: "800px",
            }}
          >
            <thead
              style={{
                backgroundColor: "#f8f9fa",
                position: "sticky",
                top: 0,
              }}
            >
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "12px 8px",
                      textAlign: getAlignment(header),
                      // fontWeight: "bold",
                      background:
                        "linear-gradient(135deg, var(--primary-blue), var(--primary-light)",
                      color: "#000",
                      border: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr style={{ transition: "all var(--transition-fast)" }}>
                  <td
                    colSpan="7"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    {loading || searching
                      ? "Đang tải dữ liệu..."
                      : search
                      ? "Không tìm thấy kết quả phù hợp"
                      : "Không có dữ liệu thửa đất"}
                  </td>
                </tr>
              ) : (
                data.map((landPlot, index) => (
                  <TableRow
                    key={landPlot.id}
                    landPlot={landPlot}
                    index={index}
                    startIndex={startIndex}
                    onEditPlot={onEditPlot}
                    onDeletePlot={onDeletePlot}
                    // onViewLocation={onViewLocation}
                    onViewLocation={handleViewLocation}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMapModal && (
        <LandPlotMapModal plot={selectedPlot} onClose={handleCloseMapModal} />
      )}
    </>
  );
};

const TableRow = ({
  landPlot,
  index,
  startIndex,
  onEditPlot,
  onDeletePlot,
  onViewLocation,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEditPlot) {
      onEditPlot(landPlot);
    }
  };

  const handleViewLocation = () => {
    if (onViewLocation) {
      onViewLocation(landPlot);
    }
  };

  const handleDelete = () => {
    if (onDeletePlot) {
      onDeletePlot(landPlot.id);
      setShowDeleteConfirm(false);
    }
  };

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <tr
        style={{
          transition: "background-color 0.2s",
          backgroundColor: isHovered ? "#f8f9fa" : "transparent",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TableCell align="center">{startIndex + index + 1}</TableCell>
        <TableCell>{landPlot.ten_chu || landPlot.name || ""}</TableCell>
        <TableCell align="center">{landPlot.so_to || ""}</TableCell>
        <TableCell align="center">{landPlot.so_thua || ""}</TableCell>
        <TableCell align="center">
          {landPlot.ky_hieu_mdsd.toString() ||
            landPlot.ky_hieu_muc_dich_su_dung ||
            ""}
        </TableCell>
        <TableCell>{landPlot.phuong_xa || landPlot.dia_chi || ""}</TableCell>
        <TableCell align="center">
          <ActionButtons
            onEdit={handleEdit}
            onDelete={openDeleteConfirm}
            onViewLocation={handleViewLocation}
            hasLocation={!!landPlot.geom}
            hasCoordinates={!!landPlot.lat && !!landPlot.lng}
          />
        </TableCell>
      </tr>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <tr>
          <td
            colSpan="7"
            style={{
              padding: "10px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#856404", fontWeight: "500" }}>
                Bạn có chắc chắn muốn xóa thửa đất này?
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Xóa
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Sub-component for table cell
const TableCell = ({ children, align = "left", ...props }) => (
  <td
    style={{
      padding: "12px 8px",
      textAlign: align,
      border: "1px solid #dee2e6",
      color: "#000",
      padding: "20px 16px",
      borderBottom: "1px solid var(--border-light)",
      color: "var(--text-primary)",
      fontWeight: 500,
      transition: "all var(--transition-fast)",
    }}
    {...props}
  >
    {children}
  </td>
);

// Sub-component for action buttons
const ActionButtons = ({
  onEdit,
  onDelete,
  onViewLocation,
  hasLocation,
  hasCoordinates,
}) => {
  const [hoveredButton, setHoveredButton] = useState(null);

  const buttons = [
    {
      icon: FaSearchLocation,
      color: hasLocation ? "#17a2b8" : "#ccc",
      hoverColor: hasLocation ? "#e2f3f7" : "#f5f5f5",
      // title: "Xem vị trí",
      title: hasLocation ? "Xem vị trí" : "Chưa có vị trí",
      // onClick: () => (hasLocation ? onViewLocation : () => {}),
      onClick: () => (hasLocation ? onViewLocation() : null),
    },
    {
      icon: FaRegEdit,
      color: "#ffc107",
      hoverColor: "#fff3cd",
      title: "Sửa thông tin",
      onClick: onEdit,
    },
    {
      icon: FaTrashAlt,
      color: "#dc3545",
      hoverColor: "#f8d7da",
      title: "Xóa thửa đất",
      onClick: onDelete,
    },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "5px" }}>
      {buttons.map((button, index) => (
        <button
          key={index}
          style={{
            padding: "6px",
            backgroundColor:
              hoveredButton === index ? button.hoverColor : "transparent",
            color: button.color,
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
            transition: "background-color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={button.title}
          onMouseEnter={() => setHoveredButton(index)}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={button.onClick}
        >
          <button.icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default LandPlotTable;
