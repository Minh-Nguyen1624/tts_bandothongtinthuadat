import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/ModalForm.css";
import "../css/Dashboard.css";
import { FaPen, FaTrash } from "react-icons/fa";

const API_URL = "http://127.0.0.1:8000";

export default function Dashboard() {
  const tabs = [
    { key: "users", label: " Người dùng" },
    { key: "units", label: " Đơn vị" },
    { key: "teams", label: " Nhóm" },
  ];

  const [types, setTypes] = useState("users");
  const [data, setData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  /* ---------- HELPERS ---------- */
  const getFormFields = (type, mode = "edit") => {
    if (type === "users") {
      const allFields = [
        { key: "first_name", label: "Họ", required: true },
        { key: "last_name", label: "Tên", required: true },
        { key: "name", label: "Tên đầy đủ" },
        { key: "email", label: "Email", type: "email", required: true },
        // {
        //   key: "password",
        //   label: "Mật khẩu",
        //   type: "password",
        //   required: mode === "add",
        // },
        { key: "phone", label: "Số điện thoại", type: "tel" },
        { key: "date_of_birth", label: "Ngày sinh", type: "date" },
        { key: "gender", label: "Giới tính" },
        { key: "address", label: "Địa chỉ" },
        { key: "avatar", label: "Ảnh đại diện" },
        { key: "role", label: "Vai trò", required: true },
        { key: "status", label: "Trạng thái" },
        { key: "unit_id", label: "ID đơn vị" },
        { key: "team_id", label: "ID nhóm" },
      ];
      return allFields;
    } else if (type === "units") {
      return [
        { key: "name", label: "Tên", required: true },
        { key: "type", label: "Loại", required: true },
        { key: "code", label: "Mã", required: true },
      ];
    } else if (type === "teams") {
      return [
        { key: "name", label: "Tên", required: true },
        { key: "unit_id", label: "ID đơn vị", required: true },
        { key: "description", label: "Mô tả" },
        { key: "status", label: "Trạng thái", required: true },
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

    // if (!addMode && payload.password === "") delete payload.password;
    return payload;
  };

  /* ---------- API ---------- */
  const fetchGetData = async () => {
    if (!token) {
      console.warn("No token found. Please login first.");
      return;
    }
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      alert("Vui lòng đăng nhập trước");
      return;
    }

    // Validate required fields
    const requiredFields = getFormFields(types, "add").filter(
      (f) => f.required
    );
    const missingFields = requiredFields.filter(
      (f) => !formData[f.key] || formData[f.key].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      alert(
        `Vui lòng điền các trường bắt buộc: ${missingFields
          .map((f) => f.label)
          .join(", ")}`
      );
      return;
    }

    setLoading(true);
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
        "Lỗi khi thêm: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/${types}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => prev.filter((it) => it.id !== id));
      alert("Xóa thành công!");
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      alert(
        "Xóa thất bại: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (item) => {
    setEditingItem(item);
    const { password, ...itemWithoutPassword } = item;
    setFormData({ ...itemWithoutPassword, password: "" });
    setAddMode(false);
    setShowPassword(false);
  };

  const handleUpdate = async () => {
    if (!token || !editingItem) return;

    // Validate required fields
    const requiredFields = getFormFields(types, "edit").filter(
      (f) => f.required
    );
    const missingFields = requiredFields.filter(
      (f) => !formData[f.key] || formData[f.key].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      alert(
        `Vui lòng điền các trường bắt buộc: ${missingFields
          .map((f) => f.label)
          .join(", ")}`
      );
      return;
    }

    setLoading(true);
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
        "Cập nhật thất bại: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    if (types === "users") {
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.email && item.email.toLowerCase().includes(searchLower)) ||
        (item.phone && item.phone.includes(searchTerm))
      );
    } else if (types === "units") {
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.code && item.code.toLowerCase().includes(searchLower))
      );
    } else if (types === "teams") {
      return (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.description &&
          item.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  /* ---------- RENDER FUNCTIONS ---------- */
  const displayValue = (val, fieldKey, mode) => {
    if (val === undefined || val === null) return "";
    if (fieldKey === "password" && mode === "edit") return "";
    if (typeof val === "object") {
      if (Array.isArray(val)) {
        return val.map((v) => v.name ?? v.id ?? "").join(", ");
      }
      return val.name ?? val.id ?? JSON.stringify(val);
    }
    return val;
  };

  const renderInputField = (f, value, onChange, mode = "add") => {
    const inputId = `${mode}-${f.key}`;

    // if (f.key === "password") {
    //   return (
    //     <div className="password-wrapper">
    //       <input
    //         id={inputId}
    //         className="form-input"
    //         type={showPassword ? "text" : "password"}
    //         value={value}
    //         onChange={onChange}
    //         placeholder={
    //           mode === "add" ? "Nhập mật khẩu" : "Để trống nếu không đổi"
    //         }
    //         required={f.required}
    //       />
    //       <button
    //         type="button"
    //         className="password-toggle"
    //         onClick={togglePasswordVisibility}
    //         title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    //       >
    //         {showPassword ? (
    //           <svg
    //             width="20"
    //             height="20"
    //             viewBox="0 0 24 24"
    //             fill="none"
    //             stroke="currentColor"
    //             strokeWidth="2"
    //           >
    //             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    //             <circle cx="12" cy="12" r="3"></circle>
    //           </svg>
    //         ) : (
    //           <svg
    //             width="20"
    //             height="20"
    //             viewBox="0 0 24 24"
    //             fill="none"
    //             stroke="currentColor"
    //             strokeWidth="2"
    //           >
    //             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    //             <line x1="1" y1="1" x2="23" y2="23"></line>
    //           </svg>
    //         )}
    //       </button>
    //     </div>
    //   );
    // }

    if (f.key === "date_of_birth") {
      return (
        <input
          id={inputId}
          className="form-input"
          type="date"
          value={value}
          onChange={onChange}
          required={f.required}
        />
      );
    }

    if (f.key === "gender") {
      return (
        <select
          id={inputId}
          className="form-input"
          value={value}
          onChange={onChange}
          required={f.required}
        >
          <option value="">Chọn giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      );
    }

    if (f.key === "role") {
      return (
        <select
          id={inputId}
          className="form-input"
          value={value}
          onChange={onChange}
          required={f.required}
        >
          <option value="">Chọn vai trò</option>
          <option value="admin">Quản trị</option>
          <option value="user">Người dùng</option>
          <option value="manager">Quản lý</option>
        </select>
      );
    }

    if (f.key === "status") {
      return (
        <select
          id={inputId}
          className="form-input"
          value={value}
          onChange={onChange}
          required={f.required}
        >
          <option value="">Chọn trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      );
    }

    return (
      <input
        id={inputId}
        className="form-input"
        value={value}
        onChange={onChange}
        type={f.type || "text"}
        placeholder={`Nhập ${f.label.toLowerCase()}`}
        required={f.required}
      />
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {types === "users"
            ? " Quản lý Người dùng"
            : types === "units"
            ? " Quản lý Đơn vị"
            : " Quản lý Nhóm"}
        </h2>

        <div className="dashboard-controls">
          <button
            onClick={() => {
              setFormData({});
              setAddMode(true);
              setEditingItem(null);
              setShowPassword(false);
            }}
            className="add-button"
            disabled={loading}
          >
            Thêm mới
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTypes(tab.key)}
            className={`tab-button ${types === tab.key ? "active" : ""}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="data-table">
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
                  ].map((h) => <th key={h}>{h}</th>)}
                {types === "units" &&
                  ["ID", "Tên", "Loại", "Mã", "Thao tác"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                {types === "teams" &&
                  [
                    "ID",
                    "Tên",
                    "Đơn vị",
                    "Mô tả",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={types === "users" ? 7 : types === "units" ? 5 : 6}
                    className="no-data"
                  >
                    {searchTerm
                      ? "Không tìm thấy kết quả phù hợp"
                      : "Không có dữ liệu"}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="table-row">
                    {types === "users" && (
                      <>
                        <td className="id-cell">{item.id}</td>
                        <td>
                          <div className="user-info">
                            {item.avatar && (
                              <img
                                src={item.avatar}
                                alt="Avatar"
                                className="avatar"
                              />
                            )}
                            <span>
                              {item.name ||
                                `${item.first_name} ${item.last_name}`}
                            </span>
                          </div>
                        </td>
                        <td>{item.email}</td>
                        <td>
                          <span className={`role-badge ${item.role}`}>
                            {item.role === "admin"
                              ? "Quản trị"
                              : item.role === "user"
                              ? "Người dùng"
                              : item.role}
                          </span>
                        </td>
                        <td>{item.unit?.name ?? "-"}</td>
                        <td>{item.team?.name ?? "-"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEditOpen(item)}
                              disabled={loading}
                            >
                              <FaPen />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {types === "units" && (
                      <>
                        <td className="id-cell">{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>
                          <span className="code-badge">{item.code}</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEditOpen(item)}
                              disabled={loading}
                            >
                              <FaPen />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {types === "teams" && (
                      <>
                        <td className="id-cell">{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.unit?.name ?? "-"}</td>
                        <td className="description-cell">
                          {item.description || "-"}
                        </td>
                        <td>
                          <span className={`status-badge ${item.status}`}>
                            {item.status === "active"
                              ? "Hoạt động"
                              : item.status === "inactive"
                              ? "Không hoạt động"
                              : item.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEditOpen(item)}
                              disabled={loading}
                            >
                              <FaPen />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {addMode && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                Thêm{" "}
                {types === "users"
                  ? "người dùng"
                  : types === "units"
                  ? "đơn vị"
                  : "nhóm"}
              </h3>
              <button
                className="close-button"
                onClick={() => {
                  setAddMode(false);
                  setFormData({});
                  setShowPassword(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              {getFormFields(types, "add").map((f) => (
                <div key={f.key} className="form-field">
                  <label className="form-label">
                    {f.label}
                    {f.required && <span className="required">*</span>}
                  </label>
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

            <div className="modal-actions">
              <button
                className="save-button"
                onClick={handleAddSubmit}
                disabled={loading}
              >
                {loading ? "⏳ Đang xử lý..." : "💾 Lưu"}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setAddMode(false);
                  setFormData({});
                  setShowPassword(false);
                }}
                disabled={loading}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                Sửa{" "}
                {types === "users"
                  ? "người dùng"
                  : types === "units"
                  ? "đơn vị"
                  : "nhóm"}
              </h3>
              <button
                className="close-button"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({});
                  setShowPassword(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              {getFormFields(types, "edit").map((f) => {
                const val = formData[f.key];
                const shown = displayValue(val, f.key, "edit");

                return (
                  <div key={f.key} className="form-field">
                    <label className="form-label">
                      {f.label}
                      {f.required && <span className="required">*</span>}
                    </label>
                    {typeof val === "object" && val !== null ? (
                      <input className="form-input" value={shown} disabled />
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

              {/* Metadata fields */}
              {["created_at", "updated_at", "email_verified_at"].map((meta) =>
                formData[meta] ? (
                  <div key={meta} className="form-field">
                    <label className="form-label">
                      {meta.replace("_", " ")}
                    </label>
                    <input
                      className="form-input"
                      value={formData[meta]}
                      disabled
                    />
                  </div>
                ) : null
              )}
            </div>

            <div className="modal-actions">
              <button
                className="save-button"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "⏳ Đang xử lý..." : "💾 Cập nhật"}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({});
                  setShowPassword(false);
                }}
                disabled={loading}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
