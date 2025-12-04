import SearchForm from '../components/search/SearchForm';
import DataTable from '../components/search/DataTable';
import './SearchPage.css';

const SearchPage = () => {
  return (
    <div className="search-page">
      <h1>Search Records</h1>
      <SearchForm />
      <DataTable />
    </div>
  );
};

export default SearchPage;
