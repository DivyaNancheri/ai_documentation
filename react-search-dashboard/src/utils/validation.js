// Validation utility functions for search form

export const validateSearchCriteria = (criteria) => {
  const errors = {};

  // Validate date range
  if (criteria.dateFrom && criteria.dateTo) {
    const fromDate = new Date(criteria.dateFrom);
    const toDate = new Date(criteria.dateTo);
    
    if (fromDate > toDate) {
      errors.dateRange = 'Date From must be before Date To';
    }
  }

  // Validate amount range
  if (criteria.amountMin !== '' && criteria.amountMax !== '') {
    const min = parseFloat(criteria.amountMin);
    const max = parseFloat(criteria.amountMax);
    
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.amountRange = 'Minimum amount must be less than maximum amount';
    }
  }

  // Validate amount values are positive
  if (criteria.amountMin !== '') {
    const min = parseFloat(criteria.amountMin);
    if (isNaN(min) || min < 0) {
      errors.amountMin = 'Amount must be a positive number';
    }
  }

  if (criteria.amountMax !== '') {
    const max = parseFloat(criteria.amountMax);
    if (isNaN(max) || max < 0) {
      errors.amountMax = 'Amount must be a positive number';
    }
  }

  // Validate dates are not in future (optional business rule)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (criteria.dateFrom) {
    const fromDate = new Date(criteria.dateFrom);
    if (fromDate > today) {
      errors.dateFrom = 'Date cannot be in the future';
    }
  }

  if (criteria.dateTo) {
    const toDate = new Date(criteria.dateTo);
    if (toDate > today) {
      errors.dateTo = 'Date cannot be in the future';
    }
  }

  // Check if at least one search criterion is provided
  const hasAnyCriteria = Object.values(criteria).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== null && value !== undefined;
  });

  if (!hasAnyCriteria) {
    errors.general = 'Please enter at least one search criterion';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Individual field validators
export const validators = {
  name: (value) => {
    if (value && value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  },

  amount: (value) => {
    if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) {
      return 'Amount must be a positive number';
    }
    return null;
  },

  date: (value) => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format';
      }
    }
    return null;
  },

  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return null;
  },

  phone: (value) => {
    if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
      return 'Invalid phone format';
    }
    return null;
  }
};

// Real-time validation for individual fields
export const validateField = (fieldName, value, allCriteria = {}) => {
  switch (fieldName) {
    case 'name':
      return validators.name(value);
    
    case 'amountMin':
    case 'amountMax':
      const amountError = validators.amount(value);
      if (amountError) return amountError;
      
      // Additional range check
      if (fieldName === 'amountMin' && allCriteria.amountMax !== '') {
        const min = parseFloat(value);
        const max = parseFloat(allCriteria.amountMax);
        if (!isNaN(min) && !isNaN(max) && min > max) {
          return 'Minimum must be less than maximum';
        }
      }
      if (fieldName === 'amountMax' && allCriteria.amountMin !== '') {
        const min = parseFloat(allCriteria.amountMin);
        const max = parseFloat(value);
        if (!isNaN(min) && !isNaN(max) && max < min) {
          return 'Maximum must be greater than minimum';
        }
      }
      return null;
    
    case 'dateFrom':
    case 'dateTo':
      const dateError = validators.date(value);
      if (dateError) return dateError;
      
      // Additional range check
      if (fieldName === 'dateFrom' && allCriteria.dateTo) {
        const from = new Date(value);
        const to = new Date(allCriteria.dateTo);
        if (from > to) {
          return 'From date must be before To date';
        }
      }
      if (fieldName === 'dateTo' && allCriteria.dateFrom) {
        const from = new Date(allCriteria.dateFrom);
        const to = new Date(value);
        if (to < from) {
          return 'To date must be after From date';
        }
      }
      return null;
    
    default:
      return null;
  }
};
