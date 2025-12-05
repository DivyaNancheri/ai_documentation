import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadSavedSearch, deleteSavedSearch } from '../../store/slices/searchSlice';
import './SavedSearchDropdown.css';

const SavedSearchDropdown = () => {
  const dispatch = useDispatch();
  const savedSearches = useSelector((state) => state.search.savedSearches);
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLoad = (searchId) => {
    dispatch(loadSavedSearch(searchId));
    setIsOpen(false);
  };

  const handleDelete = (e, searchId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved search?')) {
      dispatch(deleteSavedSearch(searchId));
    }
  };

  return (
    <div className="saved-search-dropdown">
      <button
        className="saved-search-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={savedSearches.length === 0}
        title={savedSearches.length === 0 ? 'No saved searches' : 'Load saved search'}
      >
        📋 Saved Searches {savedSearches.length > 0 && `(${savedSearches.length})`}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && savedSearches.length > 0 && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="saved-search-menu">
            <div className="saved-search-header">
              <span>Your Saved Searches</span>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <div className="saved-search-list">
              {savedSearches.map((search) => (
                <div key={search.id} className="saved-search-item">
                  <div className="search-info" onClick={() => handleLoad(search.id)}>
                    <div className="search-name">{search.name}</div>
                    <div className="search-meta">
                      <span className="search-date">💾 {formatDate(search.timestamp)}</span>
                      <span className="search-criteria-count">
                        {Object.values(search.criteria).filter(v => v && v.length > 0).length} criteria
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, search.id)}
                    title="Delete this search"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SavedSearchDropdown;
