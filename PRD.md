# Product Requirements Document (PRD)
## React Data Search & Dashboard Application

---

## 1. Document Overview

### 1.1 Document Information
- **Version**: 1.0
- **Last Updated**: December 2024
- **Status**: Draft
- **Owner**: Development Team

### 1.2 Purpose
This document outlines the requirements for a React-based web application that provides advanced search capabilities with a data grid interface and an interactive dashboard. The application will allow users to search data using multiple criteria, view results in a tabular format with advanced features, and monitor key metrics through a dashboard.

---

## 2. Product Overview

### 2.1 Product Vision
Build a modern, responsive React application that enables users to efficiently search, filter, and analyze data through an intuitive interface with a comprehensive dashboard for quick insights.

### 2.2 Target Users
- Data analysts
- Business users
- Operations teams
- Management personnel requiring quick access to business insights

### 2.3 Key Objectives
- Provide flexible search capabilities with multiple criteria
- Enable efficient data browsing and analysis through advanced table features
- Offer real-time data filtering and pagination
- Present key business metrics through an interactive dashboard
- Ensure optimal performance through efficient state management

---

## 3. Technical Stack

### 3.1 Core Technologies
- **Frontend Framework**: React 18+
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: CSS Modules / Styled Components / Tailwind CSS (TBD)
- **Build Tool**: Vite / Create React App
- **Language**: JavaScript / TypeScript (TypeScript recommended)

### 3.2 Key Libraries
- **UI Components**: Material-UI / Ant Design / Custom components
- **Data Tables**: React Table / AG Grid / MUI DataGrid
- **Charts/Widgets**: Recharts / Chart.js / ApexCharts
- **Form Handling**: React Hook Form / Formik
- **HTTP Client**: Axios (for future API integration)
- **Mock Data**: MSW (Mock Service Worker) / JSON mock files

---

## 4. Functional Requirements

### 4.1 Dashboard Page (Home)

#### 4.1.1 Overview
The dashboard serves as the landing page and provides a high-level overview of key metrics and insights.

#### 4.1.2 Features
- **Widget-based Layout**: Modular dashboard with customizable widgets
- **Key Metrics Display**:
  - Total records count
  - Recent searches count
  - Data summary statistics (average, min, max values)
  - Trend indicators (growth/decline percentages)
  
- **Visualizations**:
  - Bar charts for categorical data distribution
  - Line charts for trend analysis
  - Pie charts for proportion representation
  - Summary cards with key numbers
  
- **Quick Actions**:
  - Quick search shortcut
  - Recent searches list
  - Favorite filters access
  
- **Responsive Grid Layout**:
  - 12-column grid system
  - Widgets adapt to screen size
  - Mobile-friendly layout

#### 4.1.3 Widget Types
1. **Summary Cards**: Display single metric with icon and trend
2. **Chart Widgets**: Bar, Line, Pie charts with data visualization
3. **Table Widget**: Quick view of recent/important records
4. **Activity Feed**: Recent user actions and searches
5. **Statistics Widget**: Multi-metric comparison display

#### 4.1.4 User Stories
- As a user, I want to see key metrics at a glance when I land on the application
- As a user, I want to visualize data trends through charts and graphs
- As a user, I want quick access to search functionality from the dashboard
- As a user, I want to see my recent search activities

---

### 4.2 Search Page

#### 4.2.1 Search Criteria Section

##### 4.2.1.1 Features
- Multiple input fields for different search criteria
- Dynamic field addition capability
- Field type support:
  - Text input
  - Number input
  - Date picker
  - Dropdown/Select
  - Multi-select
  - Date range picker
  - Checkbox groups
  
##### 4.2.1.2 Search Fields (Example Schema)
- **ID**: Numeric input
- **Name**: Text input with autocomplete
- **Category**: Dropdown select
- **Status**: Multi-select dropdown
- **Date Range**: Date range picker (From - To)
- **Amount Range**: Numeric range (Min - Max)
- **Location**: Text input with suggestions
- **Tags**: Multi-select with chips

##### 4.2.1.3 Actions
- **Search Button**: Triggers data fetch and display
- **Clear/Reset Button**: Clears all search criteria
- **Save Search**: Option to save current search criteria
- **Load Saved Search**: Dropdown to load previously saved searches
- **Add Field Button**: Allows users to add additional search fields

##### 4.2.1.4 Validation
- Field-level validation with error messages
- Required field indicators
- Format validation (email, phone, etc.)
- Min/Max value constraints

##### 4.2.1.5 User Stories
- As a user, I want to search data using multiple criteria simultaneously
- As a user, I want to add additional search fields as needed
- As a user, I want to save my frequently used search criteria
- As a user, I want to clear all search fields with one click

---

#### 4.2.2 Data Table Section

##### 4.2.2.1 Core Features
- **Tabular Display**: Results displayed in a structured table format
- **Column Management**:
  - Show/hide columns
  - Reorder columns (drag and drop)
  - Resize columns
  - Column pinning (freeze columns)
  
- **Sorting**:
  - Single column sort
  - Multi-column sort
  - Ascending/descending toggle
  - Sort indicators in headers
  
- **Filtering**:
  - Column-level filters
  - Multiple filter operators (equals, contains, starts with, etc.)
  - Filter by data type (text, number, date)
  - Clear individual or all filters
  - Advanced filter builder
  
- **Pagination**:
  - Configurable page size (10, 25, 50, 100 records per page)
  - Page navigation (First, Previous, Next, Last)
  - Jump to specific page
  - Total record count display
  - Current page range display (e.g., "Showing 1-25 of 250")

##### 4.2.2.2 Table Columns (Example Schema)
| Column Name | Type | Filterable | Sortable | Default Visible |
|-------------|------|------------|----------|-----------------|
| ID | Number | Yes | Yes | Yes |
| Name | Text | Yes | Yes | Yes |
| Category | Text | Yes | Yes | Yes |
| Status | Badge | Yes | Yes | Yes |
| Amount | Currency | Yes | Yes | Yes |
| Date | Date | Yes | Yes | Yes |
| Location | Text | Yes | Yes | No |
| Description | Text | Yes | No | No |
| Actions | Button Group | No | No | Yes |

##### 4.2.2.3 Row Actions
- **View Details**: Opens detailed view in modal/drawer
- **Edit**: Edit record inline or in form
- **Delete**: Remove record with confirmation
- **Select**: Checkbox for bulk operations
- **Export**: Export selected rows

##### 4.2.2.4 Bulk Operations
- Select all/none
- Select current page
- Bulk delete
- Bulk export
- Bulk status update

##### 4.2.2.5 Additional Features
- **Row Highlighting**: Hover effects, selected state
- **Empty State**: Friendly message when no results
- **Loading State**: Skeleton loaders during data fetch
- **Error State**: Error message display
- **Cell Formatting**:
  - Currency formatting
  - Date formatting
  - Status badges with colors
  - Truncated text with tooltips
  
##### 4.2.2.6 Export Options
- Export to CSV
- Export to Excel
- Export to PDF
- Print view

##### 4.2.2.7 User Stories
- As a user, I want to view search results in a clear tabular format
- As a user, I want to sort data by any column
- As a user, I want to filter data within the results
- As a user, I want to customize which columns are visible
- As a user, I want to navigate through large datasets using pagination
- As a user, I want to export filtered results to various formats
- As a user, I want to perform actions on individual or multiple records

---

### 4.3 State Management (Redux Toolkit)

#### 4.3.1 Store Structure
```javascript
{
  dashboard: {
    widgets: [],
    metrics: {},
    loading: false,
    error: null
  },
  search: {
    criteria: {
      fields: [],
      values: {}
    },
    savedSearches: [],
    results: {
      data: [],
      pagination: {
        currentPage: 1,
        pageSize: 25,
        totalRecords: 0,
        totalPages: 0
      },
      sorting: {
        field: null,
        order: 'asc'
      },
      filters: {},
      loading: false,
      error: null
    }
  },
  table: {
    columns: [],
    visibleColumns: [],
    columnOrder: [],
    columnWidths: {}
  },
  ui: {
    theme: 'light',
    sidebarOpen: true,
    notifications: []
  }
}
```

#### 4.3.2 Redux Slices
1. **dashboardSlice**: Manages dashboard data and widgets
2. **searchSlice**: Manages search criteria and results
3. **tableSlice**: Manages table configuration
4. **uiSlice**: Manages UI state and preferences

#### 4.3.3 Actions
- `setSearchCriteria`
- `executeSearch`
- `clearSearch`
- `saveSearchCriteria`
- `loadSavedSearch`
- `updatePagination`
- `setSorting`
- `setFilters`
- `toggleColumn`
- `reorderColumns`
- `loadDashboardData`
- `updateWidget`

#### 4.3.4 Async Thunks (with Mock Data)
- `fetchSearchResults`: Simulates API call to fetch search results
- `fetchDashboardMetrics`: Simulates API call for dashboard data
- `fetchColumnOptions`: Simulates fetching available columns
- `exportData`: Simulates data export

---

### 4.4 Mock Data Implementation

#### 4.4.1 Mock Data Strategy
- Use JSON files for static mock data
- Implement mock API functions that simulate async behavior
- Add realistic delays (200-500ms) to simulate network latency
- Include success and error scenarios

#### 4.4.2 Mock Data Files
1. **mockSearchResults.json**: Sample search result records (100+ records)
2. **mockDashboardData.json**: Dashboard metrics and statistics
3. **mockCategories.json**: Dropdown options for category field
4. **mockLocations.json**: Location options
5. **mockUsers.json**: User data for assignment

#### 4.4.3 Mock API Functions
```javascript
// mockApi.js
- searchData(criteria, page, pageSize, sorting, filters)
- getDashboardMetrics()
- getCategories()
- getLocations()
- updateRecord(id, data)
- deleteRecord(id)
- exportData(filters, format)
```

#### 4.4.4 Mock Data Schema (Example Record)
```json
{
  "id": 1001,
  "name": "Sample Record Name",
  "category": "Category A",
  "status": "Active",
  "amount": 1500.50,
  "date": "2024-12-01T10:30:00Z",
  "location": "New York",
  "description": "Detailed description of the record",
  "tags": ["tag1", "tag2"],
  "createdAt": "2024-11-15T09:00:00Z",
  "updatedAt": "2024-12-01T14:20:00Z",
  "assignedTo": "John Doe"
}
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Initial page load: < 2 seconds
- Search execution: < 500ms (with mock data)
- Table rendering: < 300ms for 100 rows
- Smooth animations (60 FPS)
- Debounced search inputs (300ms delay)

### 5.2 Usability
- Intuitive user interface following modern design principles
- Responsive design (mobile, tablet, desktop)
- Keyboard navigation support
- Accessibility compliance (WCAG 2.1 Level AA)
- Clear error messages and user feedback
- Loading indicators for all async operations

### 5.3 Browser Compatibility
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 5.4 Security
- Input sanitization
- XSS protection
- Secure local storage usage
- No sensitive data in Redux DevTools (production)

### 5.5 Scalability
- Efficient rendering for large datasets (virtualization if needed)
- Optimized Redux state updates
- Memoization for expensive computations
- Code splitting for optimal bundle size

---

## 6. User Interface Design

### 6.1 Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  Header (Logo, Navigation, User Menu)              │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  Sidebar │  Main Content Area                       │
│          │                                          │
│  - Home  │  ┌────────────────────────────────────┐ │
│  - Search│  │  Page Content                      │ │
│  - ...   │  │  (Dashboard or Search Results)     │ │
│          │  └────────────────────────────────────┘ │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
│  Footer (Copyright, Links)                          │
└─────────────────────────────────────────────────────┘
```

### 6.2 Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│  Dashboard Title                [Refresh] [Settings]│
├─────────────┬─────────────┬─────────────────────────┤
│ Total       │ Active      │                         │
│ Records     │ Records     │   Recent Activity       │
│ [1,234]     │ [956]       │   - Search at 10:30 AM  │
├─────────────┼─────────────┤   - Export at 09:15 AM  │
│ Pending     │ Completed   │                         │
│ Records     │ Records     │                         │
│ [278]       │ [678]       │                         │
├─────────────┴─────────────┴─────────────────────────┤
│                                                      │
│  Category Distribution Chart (Bar/Pie)              │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Trend Over Time (Line Chart)                       │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Recent Records (Quick Table View)                  │
│  ┌────┬──────────┬──────────┬────────┬─────────┐  │
│  │ ID │ Name     │ Category │ Status │ Amount  │  │
│  ├────┼──────────┼──────────┼────────┼─────────┤  │
│  │... │ ...      │ ...      │ ...    │ ...     │  │
│  └────┴──────────┴──────────┴────────┴─────────┘  │
└──────────────────────────────────────────────────────┘
```

### 6.3 Search Page Layout
```
┌─────────────────────────────────────────────────────┐
│  Search Title                                       │
├─────────────────────────────────────────────────────┤
│  Search Criteria                    [+ Add Field]   │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Name         │ │ Category     │ │ Status     │ │
│  │ [_________]  │ │ [Dropdown  ▼]│ │ [Select  ▼]│ │
│  └──────────────┘ └──────────────┘ └────────────┘ │
│  ┌──────────────┐ ┌──────────────┐                │
│  │ Date From    │ │ Date To      │                │
│  │ [MM/DD/YYYY] │ │ [MM/DD/YYYY] │                │
│  └──────────────┘ └──────────────┘                │
│                                                     │
│  [Clear]  [Search]  [Save Search ▼]                │
├─────────────────────────────────────────────────────┤
│  Results (250 records)          [⚙️] [Export ▼]    │
│  ┌─────────────────────────────────────────────────┤
│  │ ☑ │ ID │ Name │ Category │ Status │ Amount │...│
│  ├───┼────┼──────┼──────────┼────────┼────────┼───│
│  │ ☐ │ 01 │ ...  │ ...      │ Active │ $100   │...│
│  │ ☐ │ 02 │ ...  │ ...      │ Closed │ $200   │...│
│  │ ... (more rows)                                 │
│  └─────────────────────────────────────────────────┘
│                                                     │
│  Showing 1-25 of 250  [<] [1][2][3]...[10] [>]     │
│  [10 ▼] records per page                           │
└─────────────────────────────────────────────────────┘
```

### 6.4 Design Principles
- **Clean and Modern**: Minimalist design with appropriate whitespace
- **Consistent**: Uniform styling across all components
- **Intuitive**: Self-explanatory UI elements with helpful tooltips
- **Responsive**: Adaptive layout for all screen sizes
- **Accessible**: High contrast, keyboard navigation, screen reader support

### 6.5 Color Scheme (Example)
- **Primary**: #1976D2 (Blue)
- **Secondary**: #424242 (Dark Gray)
- **Success**: #4CAF50 (Green)
- **Warning**: #FF9800 (Orange)
- **Error**: #F44336 (Red)
- **Background**: #F5F5F5 (Light Gray)
- **Text**: #212121 (Almost Black)

---

## 7. Navigation & Routing

### 7.1 Routes
```
/ (or /dashboard)           → Dashboard Page
/search                     → Search Page
/search/:savedSearchId      → Search with pre-loaded criteria
/record/:id                 → Record Detail View (Optional)
/settings                   → Application Settings (Optional)
```

### 7.2 Navigation Menu
- **Dashboard**: Home icon, navigates to dashboard
- **Search**: Search icon, navigates to search page
- **Saved Searches**: Bookmark icon, quick access to saved searches
- **Settings**: Gear icon, application preferences

---

## 8. Component Architecture

### 8.1 Page Components
- `Dashboard`
- `SearchPage`
- `RecordDetailPage` (optional)

### 8.2 Feature Components

#### Dashboard Components
- `DashboardLayout`
- `MetricCard`
- `ChartWidget`
- `RecentActivityWidget`
- `QuickSearchWidget`
- `StatisticsWidget`

#### Search Components
- `SearchForm`
- `SearchField`
- `DynamicFieldAdder`
- `SavedSearchDropdown`
- `DataTable`
- `TableHeader`
- `TableRow`
- `TableCell`
- `ColumnManager`
- `FilterPanel`
- `PaginationControls`
- `BulkActionBar`
- `ExportMenu`

### 8.3 Common Components
- `Layout`
- `Header`
- `Sidebar`
- `Footer`
- `Button`
- `Input`
- `Select`
- `DatePicker`
- `Modal`
- `Drawer`
- `Notification`
- `LoadingSpinner`
- `ErrorBoundary`

### 8.4 Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main Content
│       ├── Dashboard
│       │   ├── DashboardLayout
│       │   ├── MetricCard (multiple)
│       │   ├── ChartWidget (multiple)
│       │   └── RecentActivityWidget
│       └── SearchPage
│           ├── SearchForm
│           │   ├── SearchField (multiple)
│           │   └── DynamicFieldAdder
│           └── DataTable
│               ├── TableHeader
│               │   ├── ColumnManager
│               │   └── FilterPanel
│               ├── TableBody
│               │   └── TableRow (multiple)
│               └── PaginationControls
└── Footer
```

---

## 9. Data Flow

### 9.1 Search Flow
1. User enters search criteria in SearchForm
2. User clicks Search button
3. SearchForm dispatches `executeSearch` action with criteria
4. Redux Toolkit thunk calls mock API function
5. Mock API simulates delay and returns mock data
6. Thunk dispatches success action with data
7. Redux store updates with search results
8. DataTable component re-renders with new data

### 9.2 Pagination Flow
1. User clicks page number or changes page size
2. Component dispatches `updatePagination` action
3. Redux updates pagination state
4. DataTable displays appropriate page of data from store

### 9.3 Filtering Flow
1. User applies filter on column
2. Component dispatches `setFilters` action
3. Redux updates filter state
4. Selector computes filtered data
5. DataTable displays filtered results

### 9.4 Dashboard Data Flow
1. Dashboard component mounts
2. useEffect dispatches `fetchDashboardMetrics` thunk
3. Mock API returns dashboard data
4. Redux store updates with metrics
5. Dashboard widgets render with data

---

## 10. Development Phases

### Phase 1: Project Setup & Foundation (Week 1)
- ✅ Initialize React project with Vite/CRA
- ✅ Set up Redux Toolkit and store structure
- ✅ Configure React Router
- ✅ Create basic layout components (Header, Sidebar, Footer)
- ✅ Set up styling solution (CSS Modules/Tailwind/Styled Components)
- ✅ Create mock data files and mock API functions
- ✅ Set up project structure and folders

### Phase 2: Dashboard Development (Week 1-2)
- ✅ Create Dashboard page layout
- ✅ Implement MetricCard component
- ✅ Implement ChartWidget components with charting library
- ✅ Create RecentActivityWidget
- ✅ Connect dashboard to Redux store
- ✅ Implement dashboard data fetching with mock API
- ✅ Add responsive design for dashboard

### Phase 3: Search Form Development (Week 2)
- ✅ Create SearchForm component
- ✅ Implement individual SearchField components
- ✅ Add dynamic field addition functionality
- ✅ Implement search validation
- ✅ Create saved search functionality
- ✅ Connect search form to Redux store
- ✅ Implement clear/reset functionality

### Phase 4: Data Table Development (Week 3)
- ✅ Create DataTable component structure
- ✅ Implement table rendering with mock data
- ✅ Add sorting functionality
- ✅ Implement column filtering
- ✅ Add column show/hide/reorder features
- ✅ Implement pagination controls
- ✅ Add row selection and bulk actions
- ✅ Create export functionality
- ✅ Add loading and empty states

### Phase 5: Integration & State Management (Week 3-4)
- ✅ Integrate search and table with Redux
- ✅ Implement all Redux actions and reducers
- ✅ Add selectors for computed data
- ✅ Test data flow end-to-end
- ✅ Optimize performance (memoization, virtualization if needed)

### Phase 6: Polish & Enhancement (Week 4)
- ✅ Responsive design refinement
- ✅ Add animations and transitions
- ✅ Implement error handling
- ✅ Add notifications/toasts
- ✅ Accessibility improvements
- ✅ Cross-browser testing
- ✅ Performance optimization

### Phase 7: Testing & Documentation (Week 5)
- ✅ Unit tests for components
- ✅ Integration tests for Redux flows
- ✅ User acceptance testing
- ✅ Code documentation
- ✅ User documentation/help section
- ✅ Final bug fixes

---

## 11. Success Metrics

### 11.1 User Experience Metrics
- Task completion rate: > 95%
- Time to complete search: < 30 seconds
- User satisfaction score: > 4.5/5
- Error rate: < 2%

### 11.2 Performance Metrics
- Page load time: < 2 seconds
- Search response time: < 500ms
- Table render time: < 300ms
- Bundle size: < 500KB (gzipped)

### 11.3 Feature Adoption
- % of users using saved searches: > 40%
- % of users using advanced filters: > 60%
- % of users customizing columns: > 30%
- Dashboard engagement rate: > 80%

---

## 12. Future Enhancements

### 12.1 Phase 2 Features (Post-MVP)
- Real API integration (replace mock data)
- Advanced chart interactions (drill-down, zoom)
- Customizable dashboard (drag-and-drop widgets)
- User preferences and personalization
- Real-time data updates (WebSocket)
- Advanced export options (custom templates)
- Scheduled reports
- Data visualization builder
- Mobile app version

### 12.2 Advanced Features
- AI-powered search suggestions
- Natural language queries
- Predictive analytics
- Collaborative features (share searches, annotations)
- Audit trail and activity logs
- Role-based access control
- Multi-language support
- Dark mode
- Offline mode capability

---

## 13. Dependencies & Assumptions

### 13.1 Dependencies
- Node.js v16+ and npm/yarn
- Modern web browser with ES6+ support
- Development environment with Git

### 13.2 Assumptions
- All data operations use mock data (no real backend)
- Single-user application (no authentication required for MVP)
- English language only
- Desktop-first approach (mobile as responsive adaptation)
- Mock data represents real data structure

### 13.3 Constraints
- No real-time data synchronization
- Limited to client-side data processing
- Mock data set size limitations
- No server-side pagination/filtering

---

## 14. Glossary

- **Widget**: A self-contained UI component displaying specific data or functionality
- **Redux Slice**: A collection of reducer logic and actions for a specific feature
- **Mock Data**: Simulated data used for development and testing
- **Pagination**: Dividing data into discrete pages
- **Redux Toolkit**: Official Redux toolset for efficient Redux development
- **Thunk**: Async action creator in Redux
- **Selector**: Function that extracts specific data from Redux store

---

## 15. Appendix

### 15.1 Example Mock Data Structure

#### Dashboard Metrics
```json
{
  "totalRecords": 1234,
  "activeRecords": 956,
  "pendingRecords": 278,
  "completedRecords": 678,
  "trends": {
    "totalRecords": "+12%",
    "activeRecords": "+5%"
  },
  "categoryDistribution": [
    { "name": "Category A", "value": 450 },
    { "name": "Category B", "value": 320 },
    { "name": "Category C", "value": 280 }
  ],
  "monthlyTrend": [
    { "month": "Jan", "count": 100 },
    { "month": "Feb", "count": 120 }
  ]
}
```

#### Search Result Record
```json
{
  "id": 1001,
  "name": "Project Alpha",
  "category": "Development",
  "status": "Active",
  "amount": 25000.00,
  "date": "2024-12-01",
  "location": "New York",
  "description": "Full-stack development project",
  "tags": ["urgent", "development"],
  "assignedTo": "John Doe",
  "createdAt": "2024-11-15T09:00:00Z",
  "updatedAt": "2024-12-01T14:20:00Z"
}
```

### 15.2 Redux Store Example
```javascript
{
  "dashboard": {
    "metrics": { /* dashboard data */ },
    "loading": false,
    "error": null
  },
  "search": {
    "criteria": {
      "name": "Project",
      "category": "Development",
      "status": ["Active", "Pending"]
    },
    "results": {
      "data": [ /* array of records */ ],
      "pagination": {
        "currentPage": 1,
        "pageSize": 25,
        "totalRecords": 250,
        "totalPages": 10
      },
      "sorting": {
        "field": "date",
        "order": "desc"
      },
      "filters": {
        "amount": { "min": 1000, "max": 50000 }
      }
    }
  }
}
```

### 15.3 Component Props Examples

#### DataTable Props
```typescript
interface DataTableProps {
  data: Array<Record>;
  columns: Array<ColumnDefinition>;
  loading?: boolean;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  onFilter?: (filters: FilterObject) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (record: Record) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: Array<number>) => void;
}
```

#### MetricCard Props
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: string;
  loading?: boolean;
}
```

---

## 16. Sign-off

### 16.1 Approval
This document requires approval from:
- [ ] Product Manager
- [ ] Development Team Lead
- [ ] UI/UX Designer
- [ ] QA Lead

### 16.2 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Dev Team | Initial draft |

---

**End of Document**
