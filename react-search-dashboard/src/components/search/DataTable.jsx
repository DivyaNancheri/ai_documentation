import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSorting, setFilters, updatePagination, executeSearch } from '../../store/slices/searchSlice';
import { toggleRowSelection, setSelectedRows, clearSelection } from '../../store/slices/tableSlice';
import Button from '../common/Button';
import './DataTable.css';

const DataTable = () => {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.search.results);
  const pagination = useSelector((state) => state.search.pagination);
  const sorting = useSelector((state) => state.search.sorting);
  const filters = useSelector((state) => state.search.filters);
  const columns = useSelector((state) => state.table.columns);
  const selectedRows = useSelector((state) => state.table.selectedRows);

  const [columnFilters, setColumnFilters] = useState({});
  const [showColumnManager, setShowColumnManager] = useState(false);

  const visibleColumns = columns.filter(col => col.visible);

  const handleSort = (field) => {
    const newOrder = sorting.field === field && sorting.order === 'asc' ? 'desc' : 'asc';
    dispatch(setSorting({ field, order: newOrder }));
    dispatch(executeSearch());
  };

  const handleFilter = (column, value) => {
    const newFilters = { ...columnFilters, [column]: value };
    setColumnFilters(newFilters);
    dispatch(setFilters(newFilters));
  };

  const applyFilters = () => {
    dispatch(executeSearch());
  };

  const handlePageChange = (newPage) => {
    dispatch(updatePagination({ currentPage: newPage }));
    dispatch(executeSearch());
  };

  const handlePageSizeChange = (e) => {
    dispatch(updatePagination({ pageSize: parseInt(e.target.value), currentPage: 1 }));
    dispatch(executeSearch());
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      dispatch(setSelectedRows(data.map(row => row.id)));
    } else {
      dispatch(clearSelection());
    }
  };

  const handleRowSelect = (id) => {
    dispatch(toggleRowSelection(id));
  };

  const handleExport = () => {
    const csvContent = [
      visibleColumns.map(col => col.label).join(','),
      ...data.map(row => visibleColumns.map(col => row[col.id]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${Date.now()}.csv`;
    a.click();
  };

  const formatValue = (column, value) => {
    if (column === 'amount') {
      return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (column === 'date') {
      return new Date(value).toLocaleDateString();
    }
    if (column === 'status') {
      return <span className={`status-badge status-${value.toLowerCase().replace(' ', '-')}`}>{value}</span>;
    }
    return value;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-number ${i === pagination.currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  if (loading) {
    return <div className="table-loading">Loading results...</div>;
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <div className="table-info">
          <h3>Search Results ({pagination.totalRecords} records)</h3>
          {selectedRows.length > 0 && (
            <span className="selected-info">
              {selectedRows.length} row(s) selected
            </span>
          )}
        </div>
        <div className="table-actions">
          <Button size="small" variant="outline" onClick={() => setShowColumnManager(!showColumnManager)}>
            ⚙️ Columns
          </Button>
          <Button size="small" variant="outline" onClick={handleExport}>
            📤 Export
          </Button>
        </div>
      </div>

      {showColumnManager && (
        <div className="column-manager">
          <h4>Manage Columns</h4>
          <div className="column-list">
            {columns.map(col => (
              <label key={col.id} className="column-item">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => dispatch({ type: 'table/toggleColumnVisibility', payload: col.id })}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="select-column">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedRows.length === data.length && data.length > 0}
                />
              </th>
              {visibleColumns.map(column => (
                <th key={column.id} style={{ width: column.width }}>
                  <div className="th-content">
                    <span onClick={() => column.sortable && handleSort(column.id)} className="th-label">
                      {column.label}
                      {column.sortable && (
                        <span className="sort-icon">
                          {sorting.field === column.id ? (sorting.order === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                        </span>
                      )}
                    </span>
                    {column.filterable && (
                      <input
                        type="text"
                        className="column-filter"
                        placeholder="Filter..."
                        value={columnFilters[column.id] || ''}
                        onChange={(e) => handleFilter(column.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="empty-state">
                  No results found. Try adjusting your search criteria.
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className={selectedRows.includes(row.id) ? 'selected' : ''}>
                  <td className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleRowSelect(row.id)}
                    />
                  </td>
                  {visibleColumns.map(column => (
                    <td key={column.id}>
                      {formatValue(column.id, row[column.id])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalRecords > 0 && (
        <div className="table-footer">
          <div className="page-size-selector">
            <label>
              Rows per page:
              <select value={pagination.pageSize} onChange={handlePageSizeChange}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>

          <div className="pagination-info">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords}
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              ⏮️
            </button>
            <button
              className="page-btn"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              ◀️
            </button>
            {renderPageNumbers()}
            <button
              className="page-btn"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              ▶️
            </button>
            <button
              className="page-btn"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              ⏭️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
