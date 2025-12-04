import { useDispatch, useSelector } from 'react-redux';
import { setSearchCriteria, clearSearchCriteria, executeSearch, saveSearch } from '../../store/slices/searchSlice';
import { mockCategories, mockStatuses, mockLocations } from '../../data/mockData';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import './SearchForm.css';

const SearchForm = () => {
  const dispatch = useDispatch();
  const criteria = useSelector((state) => state.search.criteria);
  const loading = useSelector((state) => state.search.results.loading);

  const handleChange = (field, value) => {
    dispatch(setSearchCriteria({ [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(executeSearch());
  };

  const handleClear = () => {
    dispatch(clearSearchCriteria());
  };

  const handleSaveSearch = () => {
    const name = prompt('Enter a name for this search:');
    if (name) {
      dispatch(saveSearch({ name }));
      alert('Search saved successfully!');
    }
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-form-header">
        <h2>Search Criteria</h2>
      </div>

      <div className="search-fields">
        <Input
          label="Name"
          value={criteria.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Search by name..."
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
        />

        <Input
          label="Date To"
          type="date"
          value={criteria.dateTo}
          onChange={(e) => handleChange('dateTo', e.target.value)}
        />

        <Input
          label="Amount Min"
          type="number"
          value={criteria.amountMin}
          onChange={(e) => handleChange('amountMin', e.target.value)}
          placeholder="Min amount"
        />

        <Input
          label="Amount Max"
          type="number"
          value={criteria.amountMax}
          onChange={(e) => handleChange('amountMax', e.target.value)}
          placeholder="Max amount"
        />
      </div>

      <div className="search-actions">
        <Button type="button" variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button type="button" variant="secondary" onClick={handleSaveSearch}>
          💾 Save Search
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Searching...' : '🔍 Search'}
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
