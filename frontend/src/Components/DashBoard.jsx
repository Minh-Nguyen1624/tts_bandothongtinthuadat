import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/ModalForm.css";

const API_URL = "http://127.0.0.1:8000";

export default function Dashboard() {
  const tabs = [
    { key: "users", label: "Người dùng" },
    { key: "units", label: "Đơn vị" },
    { key: "teams", label: "Nhóm" },
  ];

  const [types, setTypes] = useState("users");
  const [data, setData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const token = localStorage.getItem("token");

  /* ---------- HELPERS ---------- */

  const getFormFields = (type, mode = "edit") => {
    if (type === "users") {
      // Định nghĩa tất cả các field theo thứ tự mong muốn
      const allFields = [
        { key: "first_name", label: "Họ" },
        { key: "last_name", label: "Tên" },
        { key: "name", label: "Tên đầy đủ" },
        { key: "email", label: "Email" },
        { key: "password", label: "Mật khẩu", type: "password" },
        { key: "phone", label: "Số điện thoại" },
        { key: "date_of_birth", label: "Ngày sinh" },
        { key: "gender", label: "Giới tính" },
        { key: "address", label: "Địa chỉ" },
        { key: "avatar", label: "Ảnh đại diện" },
        { key: "role", label: "Vai trò" },
        { key: "status", label: "Trạng thái" },
        { key: "unit_id", label: "ID đơn vị" },
        { key: "team_id", label: "ID nhóm" },
      ];

      // Cả add và edit mode đều hiển thị tất cả các field
      return allFields;
    } else if (type === "units") {
      return [
        { key: "name", label: "Tên" },
        { key: "type", label: "Loại" },
        { key: "code", label: "Mã" },
      ];
    } else if (type === "teams") {
      return [
        { key: "name", label: "Tên" },
        { key: "unit_id", label: "ID đơn vị" },
        { key: "description", label: "Mô tả" },
        { key: "status", label: "Trạng thái" },
      ];
    }
    return [];
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const normalizeItem = (raw, type) => {
    const obj = raw && raw.data ? raw.data : raw;

    if (!obj) return obj;

    if (type === "users") {
      return {
        id: obj.id,
        name: obj.name ?? "",
        first_name: obj.first_name ?? "",
        last_name: obj.last_name ?? "",
        email: obj.email ?? "",
        role: obj.role ?? "",
        unit: obj.unit ?? null,
        team: obj.team ?? null,
        avatar: obj.avatar ?? "",
        status: obj.status ?? "",
        date_of_birth: obj.date_of_birth ?? "",
        address: obj.address ?? "",
        gender: obj.gender ?? "",
        phone: obj.phone ?? "",
        email_verified_at: obj.email_verified_at ?? null,
        created_at: obj.created_at ?? null,
        updated_at: obj.updated_at ?? null,
      };
    } else if (type === "units") {
      return {
        id: obj.id,
        name: obj.name ?? "",
        type: obj.type ?? "",
        code: obj.code ?? "",
        created_at: obj.created_at ?? null,
        updated_at: obj.updated_at ?? null,
        teams: obj.teams ?? null,
      };
    } else if (type === "teams") {
      return {
        id: obj.id,
        name: obj.name ?? "",
        unit: obj.unit ?? null,
        unit_id: obj.unit_id ?? (obj.unit ? obj.unit.id : null),
        description: obj.description ?? "",
        status: obj.status ?? "",
        created_at: obj.created_at ?? null,
        updated_at: obj.updated_at ?? null,
      };
    }
    return obj;
  };

  const normalizeList = (list, type) => {
    if (!Array.isArray(list)) return [];
    return list.map((i) => normalizeItem(i, type));
  };

  const buildPayloadForType = (type, form) => {
    const fields = getFormFields(type, addMode ? "add" : "edit").map(
      (f) => f.key
    );
    const payload = {};
    fields.forEach((k) => {
      const val = form[k];
      if (val === undefined) return;
      if (val === null) {
        payload[k] = null;
        return;
      }
      if (typeof val === "object") {
        if (val.id !== undefined) {
          if (k === "unit" || k === "team") {
            payload[`${k}_id`] = val.id;
          }
        }
        return;
      }

      payload[k] = val;
    });

    // Nếu update (edit) và có password rỗng, không gửi password
    if (!addMode && payload.password === "") delete payload.password;

    return payload;
  };

  /* ---------- API ---------- */

  const fetchGetData = async () => {
    if (!token) {
      console.warn("No token found. Please login first.");
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/${types}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      setData(normalizeList(list, types));
    } catch (error) {
      console.error("Fetch error:", error.response?.data || error.message);
      setData([]);
    }
  };

  useEffect(() => {
    fetchGetData();
    setEditingItem(null);
    setAddMode(false);
    setFormData({});
    setShowPassword(false);
  }, [types]);

  const handleAddSubmit = async () => {
    if (!token) {
      alert("No token - please login");
      return;
    }
    try {
      const payload = buildPayloadForType(types, formData);
      const response = await axios.post(`${API_URL}/api/${types}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newItemRaw = response.data?.data ?? response.data;
      const newItem = normalizeItem(newItemRaw, types);
      setData((prev) => [...prev, newItem]);
      setAddMode(false);
      setFormData({});
      setShowPassword(false);
      alert("Thêm thành công!");
    } catch (error) {
      console.error("Add error:", error.response?.data || error.message);
      alert(
        "Lỗi khi thêm. Kiểm tra console. " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
    try {
      await axios.delete(`${API_URL}/api/${types}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => prev.filter((it) => it.id !== id));
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      alert("Xóa thất bại. Kiểm tra console.");
    }
  };

  const handleEditOpen = (item) => {
    setEditingItem(item);
    // Khi edit, KHÔNG copy password từ item cũ - để trống
    const { password, ...itemWithoutPassword } = item;
    setFormData({ ...itemWithoutPassword, password: "" }); // Đặt password thành rỗng
    setAddMode(false);
    setShowPassword(false);
  };

  const handleUpdate = async () => {
    if (!token || !editingItem) return;
    try {
      const payload = buildPayloadForType(types, formData);
      const response = await axios.put(
        `${API_URL}/api/${types}/${editingItem.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedRaw = response.data?.data ?? response.data;
      const updated = normalizeItem(updatedRaw, types);

      setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingItem(null);
      setFormData({});
      setShowPassword(false);
      alert("Cập nhật thành công!");
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      alert(
        "Cập nhật thất bại. Kiểm tra console. " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  /* ---------- UI helpers ---------- */

  const displayValue = (val, fieldKey, mode) => {
    if (val === undefined || val === null) return "";

    // Đặc biệt xử lý cho password field trong edit mode - luôn trả về rỗng
    if (fieldKey === "password" && mode === "edit") {
      return "";
    }

    if (typeof val === "object") {
      if (Array.isArray(val)) {
        return val.map((v) => v.name ?? v.id ?? "").join(", ");
      }
      return val.name ?? val.id ?? JSON.stringify(val);
    }
    return val;
  };

  /* ---------- STYLES ---------- */
  const tdStyle = { border: "1px solid #ddd", padding: "8px" };
  const btnStyle = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
    marginLeft: "8px",
  };
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  };
  const modalStyle = {
    background: "white",
    padding: "22px",
    borderRadius: "8px",
    width: "900px",
    maxWidth: "95%",
    margin: "60px auto",
    boxSizing: "border-box",
    maxHeight: "90vh",
    overflowY: "auto",
  };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "18px",
    alignItems: "start",
  };
  const labelStyle = {
    textAlign: "center",
    fontSize: "15px",
    marginBottom: "6px",
    display: "block",
    fontWeight: "bold",
  };
  const inputStyle = {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    border: "1px solid #ddd",
    borderRadius: "4px",
  };

  const passwordWrapperStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const passwordToggleStyle = {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
  };

  // Hàm render input field với hỗ trợ password
  const renderInputField = (f, value, onChange, mode = "add") => {
    if (f.key === "password") {
      return (
        <div style={passwordWrapperStyle}>
          <input
            style={inputStyle}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={
              mode === "add"
                ? "Nhập mật khẩu"
                : "Để trống nếu không đổi mật khẩu"
            }
          />
          <button
            type="button"
            style={passwordToggleStyle}
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      );
    } else {
      return (
        <input
          style={inputStyle}
          value={value}
          onChange={onChange}
          type="text"
        />
      );
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ marginTop: 0 }}>
        {types === "users"
          ? "Quản lý người dùng"
          : types === "units"
          ? "Quản lý đơn vị"
          : "Quản lý nhóm, tổ"}
      </h2>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          {tabs.map((tab) => (
            <button
              key={tab.key} // Sửa: dùng tab.key thay vì tab
              onClick={() => {
                setTypes(tab.key);
              }}
              style={{
                marginRight: "10px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                backgroundColor: types === tab.key ? "#0d6efd" : "#f0f0f0",
                color: types === tab.key ? "#fff" : "#000",
              }}
            >
              {tab.label} {/* Sửa: dùng tab.label thay vì tab */}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setFormData({});
            setAddMode(true);
            setEditingItem(null);
            setShowPassword(false);
          }}
          style={{
            background: "#0d6efd",
            color: "white",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Thêm
        </button>
      </div>

      {/* Table - cập nhật tiêu đề tiếng Việt */}
      <table
        style={{ margin: "0 auto", borderCollapse: "collapse", width: "90%" }}
      >
        <thead>
          <tr>
            {types === "users" &&
              [
                "ID",
                "Tên",
                "Email",
                "Vai trò",
                "Đơn vị",
                "Nhóm",
                "Thao tác",
              ].map((h) => (
                <th key={h} style={tdStyle}>
                  {h}
                </th>
              ))}
            {types === "units" &&
              ["ID", "Tên", "Loại", "Mã", "Thao tác"].map((h) => (
                <th key={h} style={tdStyle}>
                  {h}
                </th>
              ))}
            {types === "teams" &&
              ["ID", "Tên", "Đơn vị", "Mô tả", "Trạng thái", "Thao tác"].map(
                (h) => (
                  <th key={h} style={tdStyle}>
                    {h}
                  </th>
                )
              )}
          </tr>
        </thead>

        <tbody>
          {!Array.isArray(data) || data.length === 0 ? (
            <tr>
              <td
                colSpan={types === "users" ? 7 : types === "units" ? 5 : 6}
                style={tdStyle}
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                {types === "users" && (
                  <>
                    <td style={tdStyle}>{item.id}</td>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.email}</td>
                    <td style={tdStyle}>
                      {item.role === "admin"
                        ? "Quản trị"
                        : item.role === "user"
                        ? "Người dùng"
                        : item.role}
                    </td>
                    <td style={tdStyle}>{item.unit?.name ?? "-"}</td>
                    <td style={tdStyle}>{item.team?.name ?? "-"}</td>
                    <td style={tdStyle}>
                      <button
                        style={btnStyle}
                        onClick={() => handleEditOpen(item)}
                      >
                        Sửa
                      </button>
                      <button
                        style={{ ...btnStyle, backgroundColor: "red" }}
                        onClick={() => handleDelete(item.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </>
                )}

                {types === "units" && (
                  <>
                    <td style={tdStyle}>{item.id}</td>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.type}</td>
                    <td style={tdStyle}>{item.code}</td>
                    <td style={tdStyle}>
                      <button
                        style={btnStyle}
                        onClick={() => handleEditOpen(item)}
                      >
                        Sửa
                      </button>
                      <button
                        style={{ ...btnStyle, backgroundColor: "red" }}
                        onClick={() => handleDelete(item.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </>
                )}

                {types === "teams" && (
                  <>
                    <td style={tdStyle}>{item.id}</td>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.unit?.name ?? "-"}</td>
                    <td style={tdStyle}>{item.description}</td>
                    <td style={tdStyle}>
                      {item.status === "active"
                        ? "Hoạt động"
                        : item.status === "inactive"
                        ? "Không hoạt động"
                        : item.status}
                    </td>
                    <td style={tdStyle}>
                      <button
                        style={btnStyle}
                        onClick={() => handleEditOpen(item)}
                      >
                        Sửa
                      </button>
                      <button
                        style={{ ...btnStyle, backgroundColor: "red" }}
                        onClick={() => handleDelete(item.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ---------- ADD MODAL ---------- */}
      {addMode && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ textAlign: "center", marginTop: 0 }}>
              Thêm{" "}
              {types === "users"
                ? "người dùng"
                : types === "units"
                ? "đơn vị"
                : "nhóm"}
            </h3>

            <div style={gridStyle}>
              {getFormFields(types, "add").map((f) => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  {renderInputField(
                    f,
                    displayValue(formData[f.key], f.key, "add"),
                    (e) =>
                      setFormData({ ...formData, [f.key]: e.target.value }),
                    "add"
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                style={{ ...btnStyle, backgroundColor: "#007bff" }}
                onClick={handleAddSubmit}
              >
                Lưu
              </button>
              <button
                style={{ ...btnStyle, backgroundColor: "gray" }}
                onClick={() => {
                  setAddMode(false);
                  setFormData({});
                  setShowPassword(false);
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- EDIT MODAL ---------- */}
      {editingItem && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ textAlign: "center", marginTop: 0 }}>
              Sửa{" "}
              {types === "users"
                ? "người dùng"
                : types === "units"
                ? "đơn vị"
                : "nhóm"}
            </h3>

            <div style={gridStyle}>
              {getFormFields(types, "edit").map((f) => {
                const val = formData[f.key];
                const shown = displayValue(val, f.key, "edit");

                return (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    {typeof val === "object" && val !== null ? (
                      <input style={inputStyle} value={shown} disabled />
                    ) : (
                      renderInputField(
                        f,
                        shown,
                        (e) =>
                          setFormData({ ...formData, [f.key]: e.target.value }),
                        "edit"
                      )
                    )}
                  </div>
                );
              })}

              {/* Hiển thị các trường metadata */}
              {["created_at", "updated_at", "email_verified_at"].map((meta) =>
                formData[meta] ? (
                  <div key={meta}>
                    <label style={labelStyle}>{meta}</label>
                    <input style={inputStyle} value={formData[meta]} disabled />
                  </div>
                ) : null
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                style={{ ...btnStyle, backgroundColor: "#0d6efd" }}
                onClick={handleUpdate}
              >
                Lưu
              </button>
              <button
                style={{ ...btnStyle, backgroundColor: "gray" }}
                onClick={() => {
                  setEditingItem(null);
                  setFormData({});
                  setShowPassword(false);
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
