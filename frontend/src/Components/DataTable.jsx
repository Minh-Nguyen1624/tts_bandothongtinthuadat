import React from "react";
import TableRow from "./TableRow";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import "../css/HomePage.css";

const DataTable = ({
  data,
  loading,
  error,
  currentType,
  tableHeaders,
  onRetry,
}) => {
  // console.log("DataTable data:", data);

  if (loading) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="table-header">
                  <div className="header-content">{header}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* SỬA: colSpan phải bằng tableHeaders.length, không +1 */}
              <td colSpan={tableHeaders.length} className="loading-cell">
                <LoadingSpinner />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="table-header">
                  <div className="header-content">{header}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* SỬA: colSpan phải bằng tableHeaders.length, không +1 */}
              <td colSpan={tableHeaders.length} className="error-cell">
                <div className="error-state">
                  <span className="error-icon">⚠️</span>
                  <div>
                    <p className="error-message">{error}</p>
                    <button className="btn primary" onClick={onRetry}>
                      Thử lại
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="table-header">
                  <div className="header-content">{header}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* SỬA: colSpan phải bằng tableHeaders.length, không +1 */}
              <td colSpan={tableHeaders.length} className="empty-cell">
                <EmptyState />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {tableHeaders.map((header) => (
              <th key={header} className="table-header">
                <div className="header-content">{header}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              item={item}
              index={index}
              currentType={currentType}
              tableHeaders={tableHeaders}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(DataTable);
