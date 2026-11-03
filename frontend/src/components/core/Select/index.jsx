import { FiChevronDown } from "react-icons/fi";

// Native dropdown styled like Input. options are [{ value, label }]; the placeholder is an empty first option.
const Select = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  error,
  isRequired = false,
  isDisabled = false,
  className = "",
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
          {label} {isRequired && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isDisabled}
          aria-invalid={Boolean(error)}
          className={`w-full appearance-none rounded-lg border bg-white py-2 pl-3 pr-10 text-sm shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted ${
            value ? "text-heading" : "text-muted"
          } ${
            error
              ? "border-danger focus:ring-danger/15"
              : "border-border-strong focus:border-primary focus:ring-primary/15"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-heading">
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
};

export default Select;
