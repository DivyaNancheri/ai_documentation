import './Select.css';

const Select = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  placeholder = 'Select...',
  error = '',
  required = false,
  disabled = false,
  multiple = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`select-group ${className}`}>
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        multiple={multiple}
        className={`select-field ${error ? 'error' : ''}`}
        {...props}
      >
        {!multiple && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Select;
