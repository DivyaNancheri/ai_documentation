// Mock API functions that simulate backend calls
import { mockRecords, mockDashboardData } from '../data/mockData';

// Simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Search data with filters, pagination, and sorting
export const searchData = async (criteria = {}, pagination = {}, sorting = {}, filters = {}) => {
  await delay(400);
  
  let results = [...mockRecords];
  
  // Apply search criteria
  if (criteria.name) {
    results = results.filter(record => 
      record.name.toLowerCase().includes(criteria.name.toLowerCase())
    );
  }
  
  if (criteria.category) {
    results = results.filter(record => record.category === criteria.category);
  }
  
  if (criteria.status && criteria.status.length > 0) {
    results = results.filter(record => criteria.status.includes(record.status));
  }
  
  if (criteria.location) {
    results = results.filter(record => 
      record.location.toLowerCase().includes(criteria.location.toLowerCase())
    );
  }
  
  if (criteria.dateFrom) {
    results = results.filter(record => new Date(record.date) >= new Date(criteria.dateFrom));
  }
  
  if (criteria.dateTo) {
    results = results.filter(record => new Date(record.date) <= new Date(criteria.dateTo));
  }
  
  if (criteria.amountMin !== undefined && criteria.amountMin !== '') {
    results = results.filter(record => record.amount >= parseFloat(criteria.amountMin));
  }
  
  if (criteria.amountMax !== undefined && criteria.amountMax !== '') {
    results = results.filter(record => record.amount <= parseFloat(criteria.amountMax));
  }
  
  // Apply column filters
  Object.keys(filters).forEach(column => {
    const filterValue = filters[column];
    if (filterValue && filterValue !== '') {
      results = results.filter(record => {
        const value = record[column];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(filterValue.toLowerCase());
        } else if (typeof value === 'number') {
          return value.toString().includes(filterValue.toString());
        }
        return true;
      });
    }
  });
  
  // Apply sorting
  if (sorting.field) {
    results.sort((a, b) => {
      const aVal = a[sorting.field];
      const bVal = b[sorting.field];
      
      if (typeof aVal === 'string') {
        return sorting.order === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else if (typeof aVal === 'number') {
        return sorting.order === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (aVal instanceof Date || typeof aVal === 'string') {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        return sorting.order === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }
  
  // Calculate pagination
  const page = pagination.currentPage || 1;
  const pageSize = pagination.pageSize || 25;
  const totalRecords = results.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedResults = results.slice(startIndex, endIndex);
  
  return {
    data: paginatedResults,
    pagination: {
      currentPage: page,
      pageSize,
      totalRecords,
      totalPages
    }
  };
};

// Get dashboard metrics
export const getDashboardMetrics = async () => {
  await delay(300);
  return mockDashboardData;
};

// Get single record by ID
export const getRecordById = async (id) => {
  await delay(200);
  const record = mockRecords.find(r => r.id === parseInt(id));
  if (!record) {
    throw new Error('Record not found');
  }
  return record;
};

// Update record
export const updateRecord = async (id, data) => {
  await delay(300);
  const index = mockRecords.findIndex(r => r.id === parseInt(id));
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  mockRecords[index] = {
    ...mockRecords[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return mockRecords[index];
};

// Delete record
export const deleteRecord = async (id) => {
  await delay(300);
  const index = mockRecords.findIndex(r => r.id === parseInt(id));
  if (index === -1) {
    throw new Error('Record not found');
  }
  
  mockRecords.splice(index, 1);
  return { success: true, id };
};

// Export data
export const exportData = async (data, format = 'csv') => {
  await delay(500);
  
  if (format === 'csv') {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    return {
      content: csvContent,
      filename: `export_${Date.now()}.csv`,
      mimeType: 'text/csv'
    };
  }
  
  return {
    content: JSON.stringify(data, null, 2),
    filename: `export_${Date.now()}.json`,
    mimeType: 'application/json'
  };
};
