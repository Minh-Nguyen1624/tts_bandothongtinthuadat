import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PlotListPagination = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  visibleDataCount,
  onPageChange,
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`page-button ${currentPage === i ? "active" : ""}`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="plotlist-pagination">
      <div className="pagination-info">
        Hiển thị {startIndex + 1}-{endIndex} trong tổng số {totalItems} bản ghi
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          <FaChevronLeft />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default PlotListPagination;
