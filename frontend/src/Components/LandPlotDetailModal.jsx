import React, { useCallback, useMemo } from "react";
import {
  FaTimes,
  FaBuilding,
  FaMap,
  FaRuler,
  FaIdCard,
  FaLandmark,
} from "react-icons/fa";
import "../css/LandPlotDetailModal.css";

const DetailItem = ({ icon, label, value, fullWidth = false }) => (
  <div className={`detail-item-land ${fullWidth ? "full-width" : ""}`}>
    <div className="detail-item-land-header">
      {icon}
      <span className="detail-label-land">{label}</span>
    </div>
    <div className="detail-value-land">{value || "—"}</div>
  </div>
);

const LandPLotDetailModal = ({
  show,
  onClose,
  loading,
  landPlotDetail,
  error,
  setError,
}) => {
  console.log("landPlotDetail", landPlotDetail);
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

  // Lấy tất cả ky_hieu_mdsd từ cả hai nguồn
  const allKyHieuMDSD = useMemo(() => {
    if (!landPlotDetail) return [];

    const mainKyHieu = landPlotDetail.ky_hieu_mdsd || [];
    const detailKyHieu =
      landPlotDetail.land_use_details?.map((item) => item.ky_hieu_mdsd) || [];

    return [...mainKyHieu, ...detailKyHieu];
  }, [landPlotDetail]);

  // Lấy ky_hieu_mdsd unique (không trùng lặp)
  const uniqueKyHieuMDSD = useMemo(() => {
    return [...new Set(allKyHieuMDSD)];
  }, [allKyHieuMDSD]);

  const basicInfoSection = useMemo(() => {
    if (!landPlotDetail) return null;

    return (
      <div className="detail-content-land">
        <div className="detail-section-land">
          <h3>Thông tin cơ bản</h3>
          <div className="detail-grid-land">
            <DetailItem
              icon={<FaBuilding />}
              label="Tổ Chức"
              value={landPlotDetail?.ten_chu}
            />
            <DetailItem
              icon={<FaIdCard />}
              label="Số tờ"
              value={landPlotDetail?.so_to}
            />
            <DetailItem
              icon={<FaIdCard />}
              label="Số thửa"
              value={landPlotDetail?.so_thua}
            />
            <DetailItem
              icon={<FaRuler />}
              label="Diện tích"
              value={
                landPlotDetail?.dien_tich
                  ? `${landPlotDetail?.dien_tich} m²`
                  : "—"
              }
            />
          </div>
          <div className="detail-grid-land">
            <DetailItem
              icon={<FaMap />}
              label="Địa chỉ thửa đất"
              value={landPlotDetail?.plot_list?.dia_chi_thua_dat || "—"}
              fullWidth
            />
            <DetailItem
              icon={<FaMap />}
              label="Xã/Phường"
              value={landPlotDetail?.phuong_xa || "—"}
            />
          </div>
        </div>

        {/* Section Mục đích sử dụng đất */}
        <div style={{ width: "40%" }}>
          <div className="detail-section-land">
            <h3>Mục đích sử dụng đất</h3>
            <div className="detail-grid-land">
              <DetailItem
                icon={<FaLandmark />}
                label="Tất cả ký hiệu MDSD"
                value={uniqueKyHieuMDSD.join(", ")}
                fullWidth
              />
            </div>

            {/* Hiển thị chi tiết từng mục đích sử dụng */}
            {landPlotDetail.land_use_details?.map((detail, index) => (
              <div key={detail.id || index} className="detail-item-land">
                <div className="detail-item-land-header">
                  <FaLandmark />
                  <span className="detail-label-land">MDSD {index + 1}</span>
                </div>
                <div className="detail-value-land">
                  <div>
                    <strong>Ký hiệu:</strong> {detail.ky_hieu_mdsd}
                  </div>
                  <div>
                    <strong>Diện tích:</strong> {detail.dien_tich} m²
                  </div>
                  <div>
                    <strong>Màu sắc:</strong>
                    <span
                      style={{
                        color: detail.color,
                        marginLeft: "8px",
                        fontSize: "16px",
                      }}
                    >
                      ●
                    </span>
                    <span style={{ marginLeft: "4px" }}>{detail.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section Ký hiệu MDSD chính */}
          {landPlotDetail.ky_hieu_mdsd &&
            landPlotDetail.ky_hieu_mdsd.length > 0 && (
              <div className="detail-section-land">
                <h3>Ký hiệu MDSD chính</h3>
                <div className="detail-grid-land">
                  <DetailItem
                    icon={<FaLandmark />}
                    label="Ký hiệu"
                    value={landPlotDetail.ky_hieu_mdsd.join(", ")}
                    fullWidth
                  />
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }, [landPlotDetail, uniqueKyHieuMDSD]);

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
    [onClose] // Sửa từ [error] thành [onClose]
  );

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content plot-detail-modal"
        style={{ maxWidth: "100%" }}
        onClick={handleContentClick}
      >
        <div className="modal-header">
          <h2>Chi tiết thửa đất</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        {loading && loadingState}
        {!loading && landPlotDetail && basicInfoSection}
        {!loading && !landPlotDetail && errorState}
      </div>
    </div>
  );
};

LandPLotDetailModal.displayName = "LandPLotDetailModal";

export default LandPLotDetailModal;
