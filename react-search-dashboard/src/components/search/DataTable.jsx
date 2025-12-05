import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSorting, setFilters, updatePagination, executeSearch } from '../../store/slices/searchSlice';
import { toggleRowSelection, setSelectedRows, clearSelection } from '../../store/slices/tableSlice';
import Button from '../common/Button';
import BulkActionBar from './BulkActionBar';
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
          aria-label={`Go to page ${i}`}
          aria-current={i === pagination.currentPage ? 'page' : undefined}
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
    <div className="data-table-container" role="region" aria-label="Search results">
      {selectedRows.length > 0 && (
        <BulkActionBar 
          selectedCount={selectedRows.length}
          selectedRows={selectedRows}
          data={data}
        />
      )}

      <div className="table-header">
        <div className="table-info">
          <h3 id="results-title">
            Search Results 
            <span className="sr-only">:</span>
            <span aria-live="polite"> ({pagination.totalRecords} records)</span>
          </h3>
        </div>
        <div className="table-actions">
          <Button 
            size="small" 
            variant="outline" 
            onClick={() => setShowColumnManager(!showColumnManager)}
            aria-expanded={showColumnManager}
            aria-label="Manage table columns"
          >
            ⚙️ Columns
          </Button>
          <Button 
            size="small" 
            variant="outline" 
            onClick={handleExport}
            aria-label="Export all results to CSV"
          >
            📤 Export All
          </Button>
        </div>
      </div>

      {showColumnManager && (
        <div className="column-manager" role="dialog" aria-label="Column visibility settings">
          <h4>Manage Columns</h4>
          <div className="column-list">
            {columns.map(col => (
              <label key={col.id} className="column-item">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => dispatch({ type: 'table/toggleColumnVisibility', payload: col.id })}
                  aria-label={`${col.visible ? 'Hide' : 'Show'} ${col.label} column`}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="table-wrapper" role="region" aria-labelledby="results-title" tabIndex="0">
        <table className="data-table" role="table" aria-label="Search results table">
          <thead>
            <tr role="row">
              <th className="select-column" role="columnheader">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedRows.length === data.length && data.length > 0}
                  aria-label={`Select all ${data.length} rows on this page`}
                />
              </th>
              {visibleColumns.map(column => (
                <th key={column.id} style={{ width: column.width }} role="columnheader" aria-sort={
                  sorting.field === column.id 
                    ? (sorting.order === 'asc' ? 'ascending' : 'descending')
                    : 'none'
                }>
                  <div className="th-content">
                    <span 
                      onClick={() => column.sortable && handleSort(column.id)} 
                      className="th-label"
                      role={column.sortable ? 'button' : undefined}
                      tabIndex={column.sortable ? 0 : undefined}
                      onKeyPress={(e) => column.sortable && e.key === 'Enter' && handleSort(column.id)}
                      aria-label={column.sortable 
                        ? `${column.label}, ${sorting.field === column.id 
                            ? `sorted ${sorting.order === 'asc' ? 'ascending' : 'descending'}, click to sort ${sorting.order === 'asc' ? 'descending' : 'ascending'}`
                            : 'not sorted, click to sort ascending'}`
                        : column.label
                      }
                    >
                      {column.label}
                      {column.sortable && (
                        <span className="sort-icon" aria-hidden="true">
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
                        aria-label={`Filter ${column.label} column`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr role="row">
                <td colSpan={visibleColumns.length + 1} className="empty-state" role="cell">
                  No results found. Try adjusting your search criteria.
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={selectedRows.includes(row.id) ? 'selected' : ''}
                  role="row"
                  aria-selected={selectedRows.includes(row.id)}
                >
                  <td className="select-column" role="cell">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleRowSelect(row.id)}
                      aria-label={`Select row ${index + 1}, ${row.name}`}
                    />
                  </td>
                  {visibleColumns.map(column => (
                    <td key={column.id} role="cell">
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
        <div className="table-footer" role="navigation" aria-label="Table pagination">
          <div className="page-size-selector">
            <label htmlFor="page-size-select">
              Rows per page:
              <select 
                id="page-size-select"
                value={pagination.pageSize} 
                onChange={handlePageSizeChange}
                aria-label="Select number of rows per page"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>

          <div className="pagination-info" aria-live="polite" aria-atomic="true">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords}
          </div>

          <div className="pagination" role="group" aria-label="Pagination controls">
            <button
              className="page-btn"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
              aria-label="Go to first page"
            >
              ⏮️
            </button>
            <button
              className="page-btn"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              aria-label="Go to previous page"
            >
              ◀️
            </button>
            {renderPageNumbers()}
            <button
              className="page-btn"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              aria-label="Go to next page"
            >
              ▶️
            </button>
            <button
              className="page-btn"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              aria-label="Go to last page"
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
