import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import searchReducer from './slices/searchSlice';
import tableReducer from './slices/tableSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    search: searchReducer,
    table: tableReducer,
  },
});
