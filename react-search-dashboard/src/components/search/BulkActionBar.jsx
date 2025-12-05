import { useDispatch } from 'react-redux';
import { clearSelection } from '../../store/slices/tableSlice';
import Button from '../common/Button';
import './BulkActionBar.css';

const BulkActionBar = ({ selectedCount, selectedRows, data }) => {
  const dispatch = useDispatch();

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} record(s)?`)) {
      // In a real app, this would call an API to delete records
      console.log('Deleting records:', selectedRows);
      alert(`${selectedCount} record(s) deleted successfully!`);
      dispatch(clearSelection());
    }
  };

  const handleBulkExport = () => {
    // Filter data to only selected rows
    const selectedData = data.filter(row => selectedRows.includes(row.id));
    
    // Generate CSV
    const headers = Object.keys(selectedData[0] || {});
    const csvContent = [
      headers.join(','),
      ...selectedData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_records_${Date.now()}.csv`;
    a.click();
    
    alert(`Exported ${selectedCount} selected record(s) to CSV!`);
  };

  const handleBulkStatusUpdate = () => {
    const newStatus = prompt('Enter new status (Active, Completed, In Progress, Pending):');
    if (newStatus) {
      console.log('Updating status to:', newStatus, 'for records:', selectedRows);
      alert(`Status updated to "${newStatus}" for ${selectedCount} record(s)!`);
      dispatch(clearSelection());
    }
  };

  const handleClearSelection = () => {
    dispatch(clearSelection());
  };

  return (
    <div className="bulk-action-bar">
      <div className="bulk-info">
        <span className="selection-icon">✓</span>
        <span className="selection-text">
          <strong>{selectedCount}</strong> {selectedCount === 1 ? 'row' : 'rows'} selected
        </span>
      </div>
      
      <div className="bulk-actions">
        <Button size="small" variant="outline" onClick={handleBulkExport}>
          📤 Export Selected
        </Button>
        <Button size="small" variant="outline" onClick={handleBulkStatusUpdate}>
          ✏️ Update Status
        </Button>
        <Button size="small" variant="danger" onClick={handleBulkDelete}>
          🗑️ Delete Selected
        </Button>
        <button className="clear-selection-btn" onClick={handleClearSelection} title="Clear selection">
          ✕
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
