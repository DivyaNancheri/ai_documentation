import { createSlice } from '@reduxjs/toolkit';

const defaultColumns = [
  { id: 'id', label: 'ID', visible: true, width: 80, sortable: true, filterable: true },
  { id: 'name', label: 'Name', visible: true, width: 200, sortable: true, filterable: true },
  { id: 'category', label: 'Category', visible: true, width: 150, sortable: true, filterable: true },
  { id: 'status', label: 'Status', visible: true, width: 120, sortable: true, filterable: true },
  { id: 'amount', label: 'Amount', visible: true, width: 120, sortable: true, filterable: true },
  { id: 'date', label: 'Date', visible: true, width: 120, sortable: true, filterable: true },
  { id: 'location', label: 'Location', visible: false, width: 150, sortable: true, filterable: true },
  { id: 'assignedTo', label: 'Assigned To', visible: true, width: 150, sortable: true, filterable: true },
];

const tableSlice = createSlice({
  name: 'table',
  initialState: {
    columns: defaultColumns,
    selectedRows: [],
  },
  reducers: {
    toggleColumnVisibility: (state, action) => {
      const column = state.columns.find(col => col.id === action.payload);
      if (column) {
        column.visible = !column.visible;
      }
    },
    setColumnWidth: (state, action) => {
      const { columnId, width } = action.payload;
      const column = state.columns.find(col => col.id === columnId);
      if (column) {
        column.width = width;
      }
    },
    reorderColumns: (state, action) => {
      state.columns = action.payload;
    },
    setSelectedRows: (state, action) => {
      state.selectedRows = action.payload;
    },
    toggleRowSelection: (state, action) => {
      const id = action.payload;
      const index = state.selectedRows.indexOf(id);
      if (index > -1) {
        state.selectedRows.splice(index, 1);
      } else {
        state.selectedRows.push(id);
      }
    },
    clearSelection: (state) => {
      state.selectedRows = [];
    },
    resetColumns: (state) => {
      state.columns = defaultColumns;
    },
  },
});

export const {
  toggleColumnVisibility,
  setColumnWidth,
  reorderColumns,
  setSelectedRows,
  toggleRowSelection,
  clearSelection,
  resetColumns,
} = tableSlice.actions;

export default tableSlice.reducer;
