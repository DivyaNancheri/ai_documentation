import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchData } from '../../utils/mockApi';

// Async thunk for executing search
export const executeSearch = createAsyncThunk(
  'search/executeSearch',
  async (_, { getState }) => {
    const state = getState().search;
    const response = await searchData(
      state.criteria,
      state.pagination,
      state.sorting,
      state.filters
    );
    return response;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    criteria: {
      name: '',
      category: '',
      status: [],
      location: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    },
    results: {
      data: [],
      loading: false,
      error: null,
    },
    pagination: {
      currentPage: 1,
      pageSize: 25,
      totalRecords: 0,
      totalPages: 0,
    },
    sorting: {
      field: null,
      order: 'asc',
    },
    filters: {},
    savedSearches: [],
  },
  reducers: {
    setSearchCriteria: (state, action) => {
      state.criteria = { ...state.criteria, ...action.payload };
    },
    clearSearchCriteria: (state) => {
      state.criteria = {
        name: '',
        category: '',
        status: [],
        location: '',
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: '',
      };
      state.filters = {};
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSorting: (state, action) => {
      state.sorting = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    saveSearch: (state, action) => {
      const search = {
        id: Date.now(),
        name: action.payload.name,
        criteria: state.criteria,
        timestamp: new Date().toISOString(),
      };
      state.savedSearches.push(search);
    },
    loadSavedSearch: (state, action) => {
      const search = state.savedSearches.find(s => s.id === action.payload);
      if (search) {
        state.criteria = search.criteria;
      }
    },
    deleteSavedSearch: (state, action) => {
      state.savedSearches = state.savedSearches.filter(s => s.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(executeSearch.pending, (state) => {
        state.results.loading = true;
        state.results.error = null;
      })
      .addCase(executeSearch.fulfilled, (state, action) => {
        state.results.loading = false;
        state.results.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(executeSearch.rejected, (state, action) => {
        state.results.loading = false;
        state.results.error = action.error.message;
      });
  },
});

export const {
  setSearchCriteria,
  clearSearchCriteria,
  updatePagination,
  setSorting,
  setFilters,
  clearFilters,
  saveSearch,
  loadSavedSearch,
  deleteSavedSearch,
} = searchSlice.actions;

export default searchSlice.reducer;
