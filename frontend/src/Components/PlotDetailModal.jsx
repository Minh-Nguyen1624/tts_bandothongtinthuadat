import React, { useCallback, useMemo } from "react";
import { FaTimes, FaBuilding, FaMap, FaRuler, FaIdCard } from "react-icons/fa";
import "../css/PlotListTable.css";

// Component con cho từng item
const DetailItem = ({ icon, label, value, fullWidth = false }) => (
  <div className={`detail-item ${fullWidth ? "full-width" : ""}`}>
    <div className="detail-item-header">
      {icon}
      <span className="detail-label">{label}</span>
    </div>
    <div className="detail-value">{value || "—"}</div>
  </div>
);

const PlotDetailModal = ({ onClose, plotData, loading, show, error }) => {
  if (!show) return null;

  const handleOverlayClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleContentClick = useCallback((event) => {
    event.stopPropagation();
  }, []);

  const basicInfoSection = useMemo(() => {
    if (!plotData) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content plot-detail-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Chi tiết thửa đất</h2>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {!loading && plotData && (
            <div className="detail-content">
              <div className="detail-section">
                <h3>Thông tin cơ bản</h3>
                <div className="detail-grid">
                  <DetailItem
                    icon={<FaBuilding />}
                    label="Tổ Chức"
                    value={plotData.organization_name}
                  />
                  <DetailItem
                    icon={<FaIdCard />}
                    label="Số tờ"
                    value={plotData.so_to}
                  />
                  <DetailItem
                    icon={<FaIdCard />}
                    label="Số thửa"
                    value={plotData.so_thua}
                  />
                  <DetailItem
                    icon={<FaRuler />}
                    label="Diện tích"
                    value={
                      plotData.dien_tich ? `${plotData.dien_tich} m²` : "—"
                    }
                  />
                </div>
                <div className="detail-grid">
                  <DetailItem
                    icon={<FaMap />}
                    label="Địa chỉ thửa đất"
                    value={plotData.dia_chi_thua_dat}
                    fullWidth
                  />
                  <DetailItem
                    icon={<FaMap />}
                    label="Xã/Phường"
                    value={plotData.xa}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [plotData]);

  const loadingState = useMemo(
    () => (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <span>Đang tải dữ liệu...</span>
      </div>
    ),
    []
  );

  const errorState = useMemo(
    () => (
      <div className="no-data">
        <div className="no-data-icon">❌</div>
        <p>Không thể tải dữ liệu chi tiết</p>
        <button className="retry-btn" onClick={onClose}>
          Đóng
        </button>
      </div>
    ),
    [error]
  );

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content plot-detail-modal"
        onClick={handleContentClick}
      >
        <div className="modal-header">
          <h2>Chi tiết thửa đất</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        {loading && loadingState}
        {!loading && plotData && basicInfoSection}
        {!loading && !plotData && errorState}
      </div>
    </div>
  );
};

PlotDetailModal.displayName = "PlotDetailModal";

export default PlotDetailModal;
