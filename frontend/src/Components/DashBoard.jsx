import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/ModalForm.css";
import "../css/Dashboard.css";
import { FaPen, FaTrash, FaEye, FaEyeSlash, FaSearch } from "react-icons/fa";

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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ---------- HELPERS ---------- */
  const getFormFields = (type, mode = "edit") => {
    if (type === "users") {
      const allFields = [
        { key: "first_name", label: "Họ", required: true },
        { key: "last_name", label: "Tên", required: true },
        { key: "name", label: "Tên đầy đủ" },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "phone", label: "Số điện thoại", type: "tel" },
        { key: "date_of_birth", label: "Ngày sinh", type: "date" },
        { key: "gender", label: "Giới tính" },
        { key: "address", label: "Địa chỉ" },
        { key: "avatar", label: "Ảnh đại diện" },
        { key: "role", label: "Vai trò", required: true },
        { key: "status", label: "Trạng thái" },
        { key: "unit_code", label: "Mã đơn vị" },
        { key: "team_code", label: "Mã nhóm" },
      ];

      allFields.splice(4, 0, {
        key: "password",
        label: mode === "add" ? "Mật khẩu" : "Mật khẩu",
        type: "password",
        required: mode === "add",
        disabled: mode === "edit",
      });

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
        { key: "code", label: "Mã nhóm", required: true },
        { key: "unit_code", label: "Mã đơn vị", required: true },
        { key: "description", label: "Mô tả" },
        { key: "status", label: "Trạng thái", required: true },
      ];
    }
    return [];
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
        unit_id: obj.unit_id ?? (obj.unit ? obj.unit.id : null),
        unit_code: obj.unit?.code ?? obj.unit_code ?? "",
        team: obj.team ?? null,
        team_id: obj.team_id ?? (obj.team ? obj.team.id : null),
        team_code: obj.team?.code ?? obj.team_code ?? "",
        avatar: obj.avatar ?? "",
        status: obj.status ?? "",
        date_of_birth: obj.date_of_birth ?? "",
        address: obj.address ?? "",
        gender: obj.gender ?? "",
        phone: obj.phone ?? "",
        email_verified_at: obj.email_verified_at ?? null,
        created_at: obj.created_at ?? null,
        updated_at: obj.updated_at ?? null,
        // password: obj.password ?? "", // LẤY MẬT KHẨU THẬT TỪ DB (hashed)
        password:
          obj.password && obj.password.trim() !== ""
            ? obj.password
            : "••••••••", // LẤY MẬT KHẨU THẬT TỪ DB (hashed)
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
        code: obj.code ?? "",
        unit: obj.unit ?? null,
        unit_id: obj.unit_id ?? (obj.unit ? obj.unit.id : null),
        unit_code: obj.unit?.code ?? obj.unit_code ?? "",
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

  const buildPayloadForType = (type, form, mode) => {
    const fields = getFormFields(type, mode).map((f) => f.key);
    const payload = {};

    fields.forEach((k) => {
      const val = form[k];
      if (val === undefined || val === null || val === "") return;

      // BỎ HOÀN TOÀN password khi edit
      if (type === "users" && k === "password" && mode === "edit") return;

      if (type === "users" && (k === "unit_code" || k === "team_code")) {
        if (val && val.trim() !== "") payload[k] = val;
        return;
      }

      if (type === "teams" && k === "unit_code") {
        payload[k] = val;
        return;
      }

      payload[k] = val;
    });

    return payload;
  };

  /* ---------- API ---------- */
  const fetchGetData = async (currentType) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/${currentType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (currentType === types) {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? [];
        setData(normalizeList(list, currentType));
      }
    } catch (error) {
      if (currentType === types) {
        setError(
          "Lỗi tải dữ liệu: " + (error.response?.data?.message || error.message)
        );
        setData([]);
      }
    } finally {
      if (currentType === types) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGetData(types);
  }, [types, token]);

  const handleGetDetail = useCallback(
    async (item) => {
      setDetailLoading(true);
      setShowDetailModal(true);
      setSelectedDetailItem(null);
      setError(null);

      if (!token) {
        setError("Vui lòng đăng nhập trước");
        setDetailLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/${types}/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const detailData = response.data?.data || response.data;
        setSelectedDetailItem(normalizeItem(detailData, types));
      } catch (error) {
        setError("Không thể tải chi tiết.");
      } finally {
        setDetailLoading(false);
      }
    },
    [token, types]
  );

  const handleAddSubmit = async () => {
    if (!token) return alert("Vui lòng đăng nhập");

    const required = getFormFields(types, "add").filter((f) => f.required);
    const missing = required.filter(
      (f) => !formData[f.key] || formData[f.key].toString().trim() === ""
    );

    if (missing.length > 0) {
      alert(`Thiếu: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayloadForType(types, formData, "add");
      const res = await axios.post(`${API_URL}/api/${types}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newItem = normalizeItem(res.data?.data ?? res.data, types);
      setData((prev) => [...prev, newItem]);
      setAddMode(false);
      setFormData({});
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token || !window.confirm("Xóa mục này?")) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/${types}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => prev.filter((it) => it.id !== id));
    } catch (error) {
      alert(
        "Xóa thất bại: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (item) => {
    console.log("Editing item:", item);
    setEditingItem(item);
    setFormData({
      ...item,
      password:
        item.password && item.password.trim() !== ""
          ? item.password
          : "••••••••", // HIỂN THỊ HASH HOẶC CHẤM
    });
    setShowPassword(false);
  };

  const handleUpdate = async () => {
    if (!token || !editingItem) return;

    const required = getFormFields(types, "edit").filter((f) => f.required);
    const missing = required.filter(
      (f) => !formData[f.key] || formData[f.key].toString().trim() === ""
    );

    if (missing.length > 0) {
      alert(`Thiếu: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayloadForType(types, formData, "edit");
      const res = await axios.put(
        `${API_URL}/api/${types}/${editingItem.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = normalizeItem(res.data?.data ?? res.data, types);
      setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      alert(
        "Cập nhật thất bại: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.trim().toLowerCase();

    return data.filter((item) => {
      if (types === "users") {
        const fullName = `${item.first_name || ""} ${item.last_name || ""} ${
          item.name || ""
        }`.toLowerCase();
        const email = (item.email || "").toLowerCase();
        const phone = (item.phone || "").toLowerCase();
        const unitName = (item.unit?.name || "").toLowerCase();
        const teamName = (item.team?.name || "").toLowerCase();

        return (
          fullName.includes(term) ||
          email.includes(term) ||
          phone.includes(term) ||
          unitName.includes(term) ||
          teamName.includes(term)
        );
      }

      if (types === "units") {
        const name = (item.name || "").toLowerCase();
        const code = (item.code || "").toLowerCase();
        return name.includes(term) || code.includes(term);
      }

      if (types === "teams") {
        const name = (item.name || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        const unitCode = (item.unit_code || "").toLowerCase();
        return (
          name.includes(term) ||
          description.includes(term) ||
          unitCode.includes(term)
        );
      }

      return false;
    });
  }, [data, searchTerm, types]);

  const renderInputField = (f, value, onChange, mode) => {
    const inputId = `${mode}-${f.key}`;

    if (f.key === "date_of_birth") {
      return (
        <input
          id={inputId}
          className="form-input"
          type="date"
          value={value || ""}
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
          value={value || ""}
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
          value={value || ""}
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
          value={value || ""}
          onChange={onChange}
          required={f.required}
        >
          <option value="">Chọn trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      );
    }

    if (f.key === "password") {
      return (
        <div className="password-wrapper">
          <input
            id={inputId}
            className="form-input"
            type={showPassword ? "text" : "password"}
            value={mode === "add" ? value : value || "••••••••"}
            onChange={mode === "add" ? onChange : undefined}
            placeholder={mode === "add" ? "Nhập mật khẩu" : ""}
            required={mode === "add"}
            disabled={mode === "edit"}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>
      );
    }
    return (
      <input
        id={inputId}
        className="form-input"
        value={value || ""}
        onChange={onChange}
        type={f.type || "text"}
        placeholder={`Nhập ${f.label.toLowerCase()}`}
        required={f.required}
      />
    );
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setAddMode(false);
        setEditingItem(null);
        setFormData({});
        setShowPassword(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {types === "users"
            ? " Quản lý Người dùng"
            : types === "units"
            ? " Quản lý Đơn vị"
            : " Quản lý Nhóm"}
        </h2>
        <div className="dashboard-controls">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
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

      {/* TABS */}
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setTypes(tab.key);
              setEditingItem(null);
              setAddMode(false);
              setFormData({});
            }}
            className={`tab-button ${types === tab.key ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-close">
            x
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {types === "users" &&
                  [
                    "STT",
                    "Tên",
                    "Email",
                    "Vai trò",
                    "Đơn vị",
                    "Nhóm",
                    "Thao tác",
                  ].map((h) => <th key={h}>{h}</th>)}
                {types === "units" &&
                  ["STT", "Tên", "Loại", "Mã", "Thao tác"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                {types === "teams" &&
                  [
                    "STT",
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
                    {searchTerm ? "Không tìm thấy" : "Không có dữ liệu"}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="table-row clickable-row"
                    onClick={() => handleGetDetail(item)}
                  >
                    {types === "users" && (
                      <>
                        <td>{index + 1}</td>
                        <td>
                          <div className="user-info">
                            {item.avatar && (
                              <img
                                src={item.avatar}
                                alt=""
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
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEditOpen(item)}
                            >
                              <FaPen />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(item.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                    {types === "units" && (
                      <>
                        <td>{index + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>
                          <span className="code-badge">{item.code}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEditOpen(item)}
                            >
                              <FaPen />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(item.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                    {types === "teams" && (
                      <>
                        <td>{index + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.unit?.name ?? "-"}</td>
                        <td className="description-cell">
                          {item.description || "-"}
                        </td>
                        <td>
                          <span className={`status-badge ${item.status}`}>
                            {item.status === "active"
                              ? "Hoạt động"
                              : "Không hoạt động"}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEditOpen(item)}
                            >
                              <FaPen />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(item.id)}
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

      {/* ADD MODAL */}
      {addMode && (
        <div
          className="modal-overlay"
          onClick={() => {
            setAddMode(false);
            setFormData({});
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                }}
              >
                x
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
                    formData[f.key] || "",
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
                {loading ? "Đang xử lý..." : "Lưu"}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setAddMode(false);
                  setFormData({});
                }}
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setEditingItem(null);
            setFormData({});
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                }}
              >
                x
              </button>
            </div>
            <div className="form-grid">
              {getFormFields(types, "edit").map((f) => (
                <div key={f.key} className="form-field">
                  <label className="form-label">
                    {f.label}
                    {f.required && <span className="required">*</span>}
                  </label>
                  {renderInputField(
                    f,
                    formData[f.key] || "",
                    (e) =>
                      setFormData({ ...formData, [f.key]: e.target.value }),
                    "edit"
                  )}
                </div>
              ))}
              {["created_at", "updated_at"].map((meta) =>
                formData[meta] ? (
                  <div key={meta} className="form-field">
                    <label className="form-label">
                      {meta.replace(/_/g, " ")}
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
                {loading ? "Đang xử lý..." : "Cập nhật"}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({});
                }}
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Chi tiết{" "}
                {types === "users"
                  ? "người dùng"
                  : types === "units"
                  ? "đơn vị"
                  : "nhóm"}
              </h3>
              <button
                className="close-button"
                onClick={() => setShowDetailModal(false)}
              >
                x
              </button>
            </div>

            <div className="modal-body detail-modal-body">
              {detailLoading ? (
                <div className="detail-loading">
                  <div className="spinner"></div>
                  <p>Đang tải...</p>
                </div>
              ) : selectedDetailItem ? (
                <div className="detail-content">
                  {/* USERS */}
                  {types === "users" && (
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Họ:</span>
                        <span className="detail-value">
                          {selectedDetailItem.first_name || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tên:</span>
                        <span className="detail-value">
                          {selectedDetailItem.last_name || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tên đầy đủ:</span>
                        <span className="detail-value">
                          {selectedDetailItem.name || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">
                          {selectedDetailItem.email}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số điện thoại:</span>
                        <span className="detail-value">
                          {selectedDetailItem.phone || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ngày sinh:</span>
                        <span className="detail-value">
                          {selectedDetailItem.date_of_birth || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Giới tính:</span>
                        <span className="detail-value">
                          {selectedDetailItem.gender === "male"
                            ? "Nam"
                            : selectedDetailItem.gender === "female"
                            ? "Nữ"
                            : selectedDetailItem.gender === "other"
                            ? "Khác"
                            : "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Địa chỉ:</span>
                        <span className="detail-value">
                          {selectedDetailItem.address || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Vai trò:</span>
                        <span className="detail-value role-badge">
                          {selectedDetailItem.role === "admin"
                            ? "Quản trị"
                            : selectedDetailItem.role === "user"
                            ? "Người dùng"
                            : selectedDetailItem.role === "manager"
                            ? "Quản lý"
                            : selectedDetailItem.role}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Trạng thái:</span>
                        <span
                          className={`detail-value status-badge ${selectedDetailItem.status}`}
                        >
                          {selectedDetailItem.status === "active"
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mã đơn vị:</span>
                        <span className="detail-value code-badge">
                          {selectedDetailItem.unit_code || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Đơn vị:</span>
                        <span className="detail-value">
                          {selectedDetailItem.unit?.name || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mã nhóm:</span>
                        <span className="detail-value code-badge">
                          {selectedDetailItem.team_code || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nhóm:</span>
                        <span className="detail-value">
                          {selectedDetailItem.team?.name || "-"}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Ngày tạo:</span>
                        <span className="detail-value">
                          {selectedDetailItem.created_at
                            ? new Date(
                                selectedDetailItem.created_at
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Cập nhật cuối:</span>
                        <span className="detail-value">
                          {selectedDetailItem.updated_at
                            ? new Date(
                                selectedDetailItem.updated_at
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* UNITS */}
                  {types === "units" && (
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">
                          {selectedDetailItem.id}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tên đơn vị:</span>
                        <span className="detail-value">
                          {selectedDetailItem.name}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Loại:</span>
                        <span className="detail-value">
                          {selectedDetailItem.type}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mã đơn vị:</span>
                        <span className="detail-value code-badge">
                          {selectedDetailItem.code}
                        </span>
                      </div>

                      {/* Hiển thị danh sách teams nếu có */}
                      {selectedDetailItem.teams &&
                        selectedDetailItem.teams.length > 0 && (
                          <div className="detail-item full-width">
                            <span className="detail-label">
                              Các nhóm trực thuộc:
                            </span>
                            <div className="teams-list">
                              {selectedDetailItem.teams.map((team) => (
                                <div key={team.id} className="team-item">
                                  <span className="team-name">{team.name}</span>
                                  <span className="team-code">
                                    ({team.code})
                                  </span>
                                  <span
                                    className={`team-status ${team.status}`}
                                  >
                                    {team.status === "active"
                                      ? "Hoạt động"
                                      : "Không hoạt động"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="detail-item full-width">
                        <span className="detail-label">Ngày tạo:</span>
                        <span className="detail-value">
                          {selectedDetailItem.created_at
                            ? new Date(
                                selectedDetailItem.created_at
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Cập nhật cuối:</span>
                        <span className="detail-value">
                          {selectedDetailItem.updated_at
                            ? new Date(
                                selectedDetailItem.updated_at
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TEAMS */}
                  {types === "teams" && (
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">
                          {selectedDetailItem.id}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tên nhóm:</span>
                        <span className="detail-value">
                          {selectedDetailItem.name}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mã nhóm:</span>
                        <span className="detail-value code-badge">
                          {selectedDetailItem.code}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mã đơn vị:</span>
                        <span className="detail-value code-badge">
                          {selectedDetailItem.unit_code}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Đơn vị:</span>
                        <span className="detail-value">
                          {selectedDetailItem.unit?.name || "-"}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Mô tả:</span>
                        <span className="detail-value">
                          {selectedDetailItem.description || "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Trạng thái:</span>
                        <span
                          className={`detail-value status-badge ${selectedDetailItem.status}`}
                        >
                          {selectedDetailItem.status === "active"
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Ngày tạo:</span>
                        <span className="detail-value">
                          {selectedDetailItem.created_at
                            ? new Date(
                                selectedDetailItem.created_at
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Cập nhật cuối:</span>
                        <span className="detail-value">
                          {selectedDetailItem.updated_at
                            ? new Date(
                                selectedDetailItem.updated_at
                              ).toLocaleString("vi-VN")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="detail-error">
                  <p>{error || "Không có dữ liệu chi tiết"}</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
