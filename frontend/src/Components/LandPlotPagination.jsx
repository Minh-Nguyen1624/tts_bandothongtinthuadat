import React from "react";

const LandPlotPagination = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  visibleDataCount,
  onPageChange,
}) => {
  const paginationButtons = [
    {
      label: "<",
      page: 1,
      title: "Về trang đầu",
      disabled: currentPage === 1,
    },
    {
      label: "Trước",
      page: currentPage - 1,
      title: "Trang trước",
      disabled: currentPage === 1,
    },
    {
      label: currentPage.toString(),
      page: currentPage,
      title: `Trang ${currentPage}`,
      disabled: false,
      active: true,
    },
    {
      label: "Tiếp",
      page: currentPage + 1,
      title: "Trang sau",
      disabled: currentPage === totalPages,
    },
    {
      label: ">",
      page: totalPages,
      title: "Đến trang cuối",
      disabled: currentPage === totalPages,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "14px",
        color: "#000",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div>
        Hiển thị{" "}
        <strong>
          {visibleDataCount > 0 ? startIndex + 1 : 0}-{endIndex}
        </strong>{" "}
        trên tổng số <strong>{totalItems.toLocaleString()}</strong> mục
        {totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "2px" }}>
          {paginationButtons.map((button, index) => (
            <button
              key={index}
              onClick={() => !button.disabled && onPageChange(button.page)}
              disabled={button.disabled}
              style={{
                padding: "6px 12px",
                backgroundColor: button.active ? "#007bff" : "white",
                color: button.active ? "white" : "#007bff",
                border: `1px solid ${button.active ? "#007bff" : "#dee2e6"}`,
                cursor: button.disabled ? "not-allowed" : "pointer",
                fontSize: "14px",
                opacity: button.disabled ? 0.5 : 1,
              }}
              title={button.title}
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandPlotPagination;
