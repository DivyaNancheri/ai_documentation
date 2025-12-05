# React Search & Dashboard Application

A modern React application featuring advanced search capabilities, data grid with filtering/sorting/pagination, and an interactive dashboard with widgets and charts.

## 🚀 Features

### Dashboard Page
- **Metric Cards**: Display key statistics (Total, Active, Pending, Completed records)
- **Trend Indicators**: Show percentage changes with visual indicators
- **Interactive Charts**: 
  - Category Distribution (Pie Chart)
  - Monthly Trend (Line Chart)
  - Status Distribution (Bar Chart)
- **Recent Activity Feed**: Track user actions and searches
- **Responsive Design**: Adapts to all screen sizes

### Search Page
- **Multi-Field Search**: Search with multiple criteria simultaneously
  - Name (text search)
  - Category (dropdown)
  - Status (multi-select)
  - Location (dropdown)
  - Date Range (from/to)
  - Amount Range (min/max)
- **Save/Load Searches**: Save frequently used search criteria
- **Clear Functionality**: Reset all search fields with one click

### Data Table
- **Column Management**: Show/hide columns, reorder, and resize
- **Sorting**: Click column headers to sort (ascending/descending)
- **Column Filters**: Filter individual columns with text input
- **Pagination**: 
  - Configurable page sizes (10, 25, 50, 100 rows)
  - Navigate with First, Previous, Next, Last buttons
  - Jump to specific page numbers
- **Row Selection**: Select single or multiple rows
- **Export**: Export filtered results to CSV
- **Status Badges**: Color-coded status indicators
- **Responsive Table**: Horizontal scroll on mobile devices

## 🛠️ Tech Stack

- **React 19** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Vite** - Build tool and dev server

## 📦 Installation

```bash
# Navigate to the project directory
cd react-search-dashboard

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

## 🎯 Usage Guide

### Dashboard
1. Navigate to the home page (Dashboard)
2. View key metrics at the top
3. Explore charts for data insights
4. Check recent activity feed
5. Click "Refresh" to reload dashboard data

### Search & Filter
1. Navigate to "Search" from the sidebar
2. Enter search criteria in any combination of fields
3. For Status field: Hold Ctrl/Cmd to select multiple options
4. Click "Search" to execute the search
5. Results appear in the table below

### Working with the Data Table
**Sorting:**
- Click on any column header to sort
- Click again to reverse sort order
- Look for ▲ (ascending) or ▼ (descending) indicators

**Filtering:**
- Use the filter input boxes under each column header
- Type to filter specific columns
- Press Enter to apply filters
- Works in combination with search criteria

**Column Management:**
- Click "⚙️ Columns" button
- Check/uncheck columns to show/hide
- Changes apply immediately

**Pagination:**
- Use ⏮️ ◀️ ▶️ ⏭️ buttons to navigate
- Click page numbers directly
- Change "Rows per page" dropdown for different page sizes

**Export:**
- Select rows (optional)
- Click "📤 Export" button
- Downloads CSV file with current results

**Row Selection:**
- Click checkbox in first column to select rows
- Click header checkbox to select all on current page
- Selected count appears in table header

### Saving Searches
1. Enter your search criteria
2. Click "💾 Save Search" button
3. Enter a name for the search
4. Search is saved for future use

## 📊 Mock Data

The application uses mock data to simulate API calls:
- **20 sample records** with various categories and statuses
- **Dashboard metrics** with trends and distributions
- **Realistic delays** (200-500ms) to simulate network latency
- All data operations happen in-memory

### Mock Data Structure
Each record contains:
- ID, Name, Category, Status
- Amount, Date, Location
- Description, Tags, Assigned To
- Created At, Updated At timestamps

## 🗂️ Project Structure

```
react-search-dashboard/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Select.jsx
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── MetricCard.jsx
│   │   │   ├── ChartWidget.jsx
│   │   │   └── RecentActivity.jsx
│   │   └── search/           # Search components
│   │       ├── SearchForm.jsx
│   │       └── DataTable.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── SearchPage.jsx
│   ├── store/
│   │   ├── store.js
│   │   └── slices/
│   │       ├── dashboardSlice.js
│   │       ├── searchSlice.js
│   │       └── tableSlice.js
│   ├── data/
│   │   └── mockData.js       # Mock data definitions
│   ├── utils/
│   │   └── mockApi.js        # Mock API functions
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## 🎨 Styling

- Modern, clean design with blue primary color (#1976d2)
- Responsive grid layouts
- Card-based UI components
- Smooth animations and transitions
- Mobile-first approach
- Custom scrollbar styling

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 📱 Responsive Design

- **Desktop**: Full layout with sidebar
- **Tablet**: Optimized grid layouts
- **Mobile**: 
  - Collapsible sidebar
  - Single column layouts
  - Horizontal scroll for tables
  - Touch-friendly buttons

## 🚀 Next Steps & Enhancements

### Potential Future Features
1. **Backend Integration**
   - Replace mock API with real endpoints
   - Add authentication/authorization
   - Real-time data updates

2. **Advanced Features**
   - Drag-and-drop column reordering
   - Custom dashboard widgets
   - Advanced filter builder
   - Batch operations (bulk edit/delete)
   - Data export to Excel/PDF

3. **UI Enhancements**
   - Dark mode toggle
   - Custom themes
   - Keyboard shortcuts
   - Tour/onboarding flow

4. **Performance**
   - Virtual scrolling for large datasets
   - Lazy loading
   - Data caching strategies

## 💡 Tips

- Use browser DevTools to inspect Redux state
- All state changes are logged in Redux DevTools extension
- Mock API delays can be adjusted in `utils/mockApi.js`
- Customize colors in component CSS files
- Add more mock data in `data/mockData.js`

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

**Dependencies issues:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📄 License

This project is created for demonstration purposes.

## 👥 Support

For questions or issues, please refer to the PRD.md document for detailed specifications.

---

**Happy Coding! 🎉**
