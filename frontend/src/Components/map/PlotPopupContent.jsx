// PlotPopupContent.jsx
import React from "react";
import { getColorByLoaiDat } from "./utils/mapUtils";

const PlotInfo = ({ plot, detail }) => {
  const landUseTypes = plot.ky_hieu_mdsd || ["Chưa xác định"];

  const handleDirectionsClick = () => {
    if (!plot) {
      alert("Không có thông tin lô đất");
      return;
    }
    let destinationLat, destinationLng;
    try {
      const geometry = detail?.leafletGeometry || plot.geom;
      if (!geometry || !geometry[0] || !geometry[0][0]) {
        alert("Không có thông tin vị trí lô đất để hướng dẫn đường đi.");
        return;
      }
      const firstPoint = geometry[0][0];
      if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
        if (Math.abs(firstPoint[0]) <= 90 && Math.abs(firstPoint[1]) <= 180) {
          destinationLat = firstPoint[0];
          destinationLng = firstPoint[1];
        } else if (
          Math.abs(firstPoint[1]) <= 90 &&
          Math.abs(firstPoint[0]) <= 180
        ) {
          destinationLat = firstPoint[1];
          destinationLng = firstPoint[0];
        } else {
          const validCoords = geometry
            .flat(3)
            .filter(
              (coord) =>
                Array.isArray(coord) &&
                coord.length === 2 &&
                !isNaN(coord[0]) &&
                !isNaN(coord[1]) &&
                coord[0] !== 0 &&
                coord[1] !== 0
            );
          if (validCoords.length > 0) {
            const firstValidCoord = validCoords[0];
            destinationLat = firstValidCoord[0];
            destinationLng = firstValidCoord[1];
          }
        }
      }
    } catch (error) {
      console.error("Error parsing coordinates:", error);
    }

    if (
      !destinationLat ||
      !destinationLng ||
      isNaN(destinationLat) ||
      isNaN(destinationLng) ||
      Math.abs(destinationLat) > 90 ||
      Math.abs(destinationLng) > 180
    ) {
      alert("Tọa độ lô đất không hợp lệ, không thể hướng dẫn đường đi.");
      return;
    }

    const createGoogleMapsUrl = (origin = null) => {
      const baseUrl = "https://www.google.com/maps/dir/?api=1";
      const destination = `${destinationLat},${destinationLng}`;
      if (origin) {
        return `${baseUrl}&origin=${origin}&destination=${destination}&travelmode=driving`;
      } else {
        return `${baseUrl}&destination=${destination}&travelmode=driving`;
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const url = createGoogleMapsUrl(origin);
          window.open(url, "_blank");
        },
        () => {
          const url = createGoogleMapsUrl();
          window.open(url, "_blank");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const url = createGoogleMapsUrl();
      window.open(url, "_blank");
    }
  };

  if (detail) {
    const totalArea =
      plot.land_use_details?.reduce(
        (sum, d) => sum + parseFloat(d.dien_tich || 0),
        0
      ) || parseFloat(plot.dien_tich || 0);
    const percentage =
      totalArea > 0 ? (parseFloat(detail.dien_tich) / totalArea) * 100 : 0;
    return (
      <div style={{ minWidth: "280px" }}>
        <strong
          style={{
            color: detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
          }}
        >
          Phân loại đất: {detail.ky_hieu_mdsd.toString()}
        </strong>
        <p>Số tờ: {plot.so_to}</p>
        <p>Số thửa: {plot.so_thua}</p>
        <p>Diện tích: {parseFloat(detail.dien_tich).toLocaleString()} m²</p>
        <p>Tỷ lệ: {percentage.toFixed(2)}%</p>
        <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
        <p>Phường/Xã: {plot.phuong_xa}</p>
        <button
          onClick={handleDirectionsClick}
          style={{
            border: "none",
            background: "#007bff",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            marginTop: "10px",
            width: "100%",
          }}
        >
          Hướng dẫn đường đi
        </button>
      </div>
    );
  }

  const totalAreaFromDetails =
    plot.land_use_details?.reduce(
      (sum, detail) => sum + parseFloat(detail.dien_tich || 0),
      0
    ) || parseFloat(plot.dien_tich || 0);

  return (
    <div style={{ minWidth: "280px" }}>
      <strong>Thông tin lô đất</strong>
      <p>Số tờ: {plot.so_to}</p>
      <p>Số thửa: {plot.so_thua}</p>
      <p>Phường/Xã: {plot.phuong_xa}</p>
      <div style={{ margin: "10px 0" }}>
        <strong>Loại đất chính:</strong>
        {landUseTypes.map((type, index) => (
          <div
            key={index}
            style={{
              display: "inline-block",
              margin: "2px 5px 2px 0",
              padding: "2px 8px",
              backgroundColor: getColorByLoaiDat(type),
              color: "white",
              borderRadius: "3px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {type}
          </div>
        ))}
      </div>
      {plot.land_use_details && plot.land_use_details.length > 0 && (
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            background: "#f8f9fa",
            borderRadius: "5px",
          }}
        >
          <strong>Chi tiết diện tích:</strong>
          {plot.land_use_details.map((detail, index) => {
            const percentage =
              totalAreaFromDetails > 0
                ? (
                    (parseFloat(detail.dien_tich) / totalAreaFromDetails) *
                    100
                  ).toFixed(2)
                : "0";
            return (
              <div
                key={index}
                style={{
                  margin: "5px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor:
                        detail.color || getColorByLoaiDat(detail.ky_hieu_mdsd),
                      marginRight: "8px",
                      border: "1px solid #333",
                    }}
                  ></div>
                  <span>{detail.ky_hieu_mdsd}:</span>
                </div>
                <div>
                  <strong>
                    {parseFloat(detail.dien_tich).toLocaleString()} m² (
                    {percentage}%)
                  </strong>
                </div>
              </div>
            );
          })}
          <div
            style={{
              marginTop: "5px",
              paddingTop: "5px",
              borderTop: "1px solid #ddd",
              fontWeight: "bold",
            }}
          >
            Tổng diện tích: {totalAreaFromDetails.toLocaleString()} m²
          </div>
        </div>
      )}
      <p>Chủ sở hữu: {plot.ten_chu || "Chưa cập nhật"}</p>
      <button
        onClick={handleDirectionsClick}
        style={{
          border: "none",
          background: "#007bff",
          color: "white",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          marginTop: "10px",
          width: "100%",
        }}
      >
        Hướng dẫn đường đi
      </button>
    </div>
  );
};

export default PlotInfo;
