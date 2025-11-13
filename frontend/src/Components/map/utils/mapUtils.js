// utils/mapUtils.js
export const getColorByLoaiDat = (loai) => {
  if (!loai) return "#adb5bd";
  const loaiStr = typeof loai === "string" ? loai : String(loai);
  const colors = {
    CAN: "#e03804ec",
    ONT: "#ff6b6b",
    ODT: "#ff8787",
    CLN: "#69db7c",
    LUC: "#51cf66",
    BHK: "#40c057",
    RSX: "#2f9e44",
    RPH: "#37b24d",
    NTS: "#20c997",
    DGT: "#4dabf7",
    HCC: "#748ffc",
    DHT: "#5c7cfa",
    TMD: "#ffa94d",
    SKC: "#fab005",
    SKK: "#f59f00",
    SKN: "#e67700",
    BCD: "#adb5bd",
    NCD: "#868e96",
    SONG: "#339af0",
    KNT: "#228be6",
  };
  const key = loaiStr.trim().toUpperCase();
  return colors[key] || "#868e96";
};

export const PHUONG_MAPPING = {
  "Phuong Trung An": "Phường Trung An",
  "Phuong Đạo Thạnh": "Phường Đạo Thạnh",
  "Phuong Mỹ Phong": "Phường Mỹ Phong",
  "Phuong Mỹ Thọ": "Phường Mỹ Thọ",
  "Phuong Thới Sơn": "Phường Thới Sơn",
};
