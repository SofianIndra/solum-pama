const Input = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
  error,
  isRequired = false,
  list,
  min,
  ariaLabel,
  className = "",
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
          {label} {isRequired && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={list}
        min={min}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-heading shadow-sm transition placeholder:text-muted/70 focus:outline-none focus:ring-4 ${
          error
            ? "border-danger focus:ring-danger/15"
            : "border-border-strong focus:border-primary focus:ring-primary/15"
        }`}
      />
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
};

export default Input;
