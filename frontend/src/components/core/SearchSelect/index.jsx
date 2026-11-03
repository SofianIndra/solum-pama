"use client";
import { useId, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import LoadingSpinner from "@/components/core/LoadingSpinner";

// Dropdown whose options come from a server search. Typing changes query and the parent fetches with it;
// while closed, the field shows selectedLabel. options are [{ value, label, description }].
// onChange gets the picked option, or null when the clear button is pressed.
const SearchSelect = ({
  id,
  label,
  value,
  selectedLabel,
  onChange,
  query,
  onQueryChange,
  options,
  isLoading = false,
  placeholder,
  searchPlaceholder = "Ketik untuk mencari...",
  emptyMessage = "Data tidak ditemukan",
  hint,
  error,
  isRequired = false,
  isDisabled = false,
  className = "",
}) => {
  const listId = useId();
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const open = () => {
    if (isDisabled) return;
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const select = (option) => {
    onChange(option);
    onQueryChange("");
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      if (!options.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((prev) => (prev + step + options.length) % options.length);
    } else if (event.key === "Enter" && isOpen) {
      // Picking an option, or pressing Enter in the search text, must not submit the form.
      event.preventDefault();
      if (options[activeIndex]) select(options[activeIndex]);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  let statusMessage = null;
  if (isLoading) statusMessage = "Memuat...";
  else if (!options.length) statusMessage = emptyMessage;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-heading">
          {label} {isRequired && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          disabled={isDisabled}
          // Open: the search text. Closed: the chosen option.
          value={isOpen ? query : (selectedLabel ?? "")}
          onFocus={open}
          onClick={open}
          // Tabbing away or clicking outside closes the list; the buttons and options below keep focus here.
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            open();
          }}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? searchPlaceholder : placeholder}
          className={`w-full rounded-lg border bg-white py-2 pl-3 text-sm text-heading shadow-sm transition placeholder:text-muted/70 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted ${
            value && !isDisabled ? "pr-16" : "pr-10"
          } ${
            error
              ? "border-danger focus:ring-danger/15"
              : "border-border-strong focus:border-primary focus:ring-primary/15"
          }`}
        />
        {value && !isDisabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Kosongkan pilihan"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-8 flex w-8 cursor-pointer items-center justify-center text-muted hover:text-heading"
          >
            <FiX className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          disabled={isDisabled}
          aria-label={isOpen ? "Tutup pilihan" : "Tampilkan pilihan"}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              return;
            }
            inputRef.current?.focus();
            open();
          }}
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-muted hover:text-heading disabled:cursor-not-allowed"
        >
          {isLoading && isOpen ? (
            <LoadingSpinner size="sm" />
          ) : (
            <FiChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          )}
        </button>

        {isOpen && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg"
          >
            {statusMessage ? (
              <li className="px-3 py-2 text-sm text-muted">{statusMessage}</li>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    // Keep focus in the input so its blur does not close the list before the click lands.
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => select(option)}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                      index === activeIndex ? "bg-primary-soft text-primary" : "text-heading hover:bg-surface"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-muted">{option.description}</span>
                      )}
                    </span>
                    {isSelected && <FiCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
};

export default SearchSelect;
