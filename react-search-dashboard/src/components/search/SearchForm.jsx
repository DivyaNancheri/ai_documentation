import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchCriteria, clearSearchCriteria, executeSearch, saveSearch } from '../../store/slices/searchSlice';
import { mockCategories, mockStatuses, mockLocations } from '../../data/mockData';
import { validateSearchCriteria, validateField } from '../../utils/validation';
import { useSearchShortcuts } from '../../hooks/useKeyboardShortcuts';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import SavedSearchDropdown from './SavedSearchDropdown';
import KeyboardShortcutsHelp from '../common/KeyboardShortcutsHelp';
import './SearchForm.css';

const SearchForm = () => {
  const dispatch = useDispatch();
  const criteria = useSelector((state) => state.search.criteria);
  const loading = useSelector((state) => state.search.results.loading);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const firstInputRef = useRef(null);

  const handleChange = (field, value) => {
    dispatch(setSearchCriteria({ [field]: value }));
    
    // Real-time validation for touched fields
    if (touched[field]) {
      const fieldError = validateField(field, value, { ...criteria, [field]: value });
      setErrors(prev => ({
        ...prev,
        [field]: fieldError
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, criteria[field], criteria);
    setErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const validation = validateSearchCriteria(criteria);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      // Mark all fields as touched
      const allTouched = Object.keys(criteria).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      return;
    }
    
    // Clear errors and execute search
    setErrors({});
    dispatch(executeSearch());
  };

  const handleClear = () => {
    dispatch(clearSearchCriteria());
    setErrors({});
    setTouched({});
  };

  const handleSaveSearch = () => {
    // Validate before saving
    const validation = validateSearchCriteria(criteria);
    
    if (!validation.isValid) {
      alert('Please fix validation errors before saving the search.');
      setErrors(validation.errors);
      return;
    }
    
    const name = prompt('Enter a name for this search:');
    if (name && name.trim()) {
      dispatch(saveSearch({ name: name.trim() }));
      alert('Search saved successfully! Access it from the "Saved Searches" dropdown.');
    }
  };

  const handleFocusSearch = () => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  };

  // Keyboard shortcuts
  useSearchShortcuts({
    onSearch: () => !loading && handleSubmit({ preventDefault: () => {} }),
    onClear: handleClear,
    onSave: handleSaveSearch,
    onFocusSearch: handleFocusSearch,
  });

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search" aria-label="Search form">
      <div className="search-form-header">
        <h2 id="search-form-title">Search Criteria</h2>
        <SavedSearchDropdown />
      </div>

      {errors.general && (
        <div className="form-error-banner" role="alert" aria-live="polite">
          ⚠️ {errors.general}
        </div>
      )}

      <div className="search-fields">
        <Input
          ref={firstInputRef}
          label="Name"
          value={criteria.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Search by name..."
          error={touched.name ? errors.name : ''}
          aria-describedby={touched.name && errors.name ? "name-error" : undefined}
        />

        <Select
          label="Category"
          value={criteria.category}
          onChange={(e) => handleChange('category', e.target.value)}
          options={mockCategories}
          placeholder="Select category"
        />

        <Select
          label="Status"
          value={criteria.status}
          onChange={(e) => {
            const options = e.target.selectedOptions;
            const values = Array.from(options).map(opt => opt.value);
            handleChange('status', values);
          }}
          options={mockStatuses}
          multiple
        />

        <Select
          label="Location"
          value={criteria.location}
          onChange={(e) => handleChange('location', e.target.value)}
          options={mockLocations}
          placeholder="Select location"
        />

        <Input
          label="Date From"
          type="date"
          value={criteria.dateFrom}
          onChange={(e) => handleChange('dateFrom', e.target.value)}
          onBlur={() => handleBlur('dateFrom')}
          error={touched.dateFrom ? errors.dateFrom || errors.dateRange : ''}
        />

        <Input
          label="Date To"
          type="date"
          value={criteria.dateTo}
          onChange={(e) => handleChange('dateTo', e.target.value)}
          onBlur={() => handleBlur('dateTo')}
          error={touched.dateTo ? errors.dateTo || errors.dateRange : ''}
        />

        <Input
          label="Amount Min"
          type="number"
          value={criteria.amountMin}
          onChange={(e) => handleChange('amountMin', e.target.value)}
          onBlur={() => handleBlur('amountMin')}
          placeholder="Min amount"
          error={touched.amountMin ? errors.amountMin || errors.amountRange : ''}
        />

        <Input
          label="Amount Max"
          type="number"
          value={criteria.amountMax}
          onChange={(e) => handleChange('amountMax', e.target.value)}
          onBlur={() => handleBlur('amountMax')}
          placeholder="Max amount"
          error={touched.amountMax ? errors.amountMax || errors.amountRange : ''}
        />
      </div>

      <div className="search-actions">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClear}
          aria-label="Clear all search fields (Ctrl+R)"
        >
          🔄 Clear
        </Button>
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleSaveSearch}
          aria-label="Save current search (Ctrl+S)"
        >
          💾 Save Search
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
          aria-label={loading ? 'Searching' : 'Execute search (Ctrl+Enter)'}
        >
          {loading ? 'Searching...' : '🔍 Search'}
        </Button>
      </div>
      
      <KeyboardShortcutsHelp />
    </form>
  );
};

export default SearchForm;
