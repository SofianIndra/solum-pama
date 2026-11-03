import { FiCheckCircle, FiCloud, FiServer } from "react-icons/fi";
import { SERVER_TYPE_LABELS, SERVER_TYPE_ON_PREMISE, SERVER_TYPE_SAAS } from "@/constants/config";

const OPTIONS = [
  {
    value: SERVER_TYPE_ON_PREMISE,
    icon: FiServer,
    description: "AIMS dipasang di server sendiri. Isi IP address dan port server.",
  },
  {
    value: SERVER_TYPE_SAAS,
    icon: FiCloud,
    description: "AIMS cloud dari SOLUM. Isi API URL yang diberikan SOLUM.",
  },
];

// Two radio cards; a native radio group, so arrow keys move between the options.
const ServerTypeSelector = ({ value, onChange }) => {
  return (
    <fieldset>
      <legend className="sr-only">Tipe server SOLUM</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map(({ value: optionValue, icon: Icon, description }) => {
          const isSelected = value === optionValue;
          return (
            <label
              key={optionValue}
              className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 transition focus-within:ring-4 focus-within:ring-primary/15 ${
                isSelected ? "border-primary bg-primary-soft" : "border-border-strong bg-white hover:bg-surface"
              }`}
            >
              <input
                type="radio"
                name="server_type"
                value={optionValue}
                checked={isSelected}
                onChange={() => onChange(optionValue)}
                className="sr-only"
              />
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? "bg-primary text-white" : "bg-surface text-muted"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-heading">{SERVER_TYPE_LABELS[optionValue]}</span>
                <span className="mt-0.5 block text-xs text-muted">{description}</span>
              </span>
              {isSelected && <FiCheckCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default ServerTypeSelector;
