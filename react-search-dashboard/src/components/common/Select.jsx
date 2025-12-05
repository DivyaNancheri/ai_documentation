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
  const selectId = props.id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${selectId}-error`;

  return (
    <div className={`select-group ${className}`}>
      {label && (
        <label className="select-label" htmlFor={selectId}>
          {label}
          {required && <span className="required" aria-label="required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        multiple={multiple}
        required={required}
        className={`select-field ${error ? 'error' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {!multiple && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
