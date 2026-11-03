import { FiAlertTriangle, FiCheckCircle, FiMinusCircle } from "react-icons/fi";
import JsonBlock from "@/components/core/JsonBlock";

// One SOLUM call made by PUT /ms-stock/update: { is_sent, is_success, message, method, url, status_code,
// payload, response }. A call that was not needed (no SOLUM field changed) is shown as skipped.
const SolumCallResult = ({ title, call }) => {
  let tone = "border-success/20 bg-success-soft text-success";
  let Icon = FiCheckCircle;
  if (!call.is_sent) {
    tone = "border-border bg-surface text-muted";
    Icon = FiMinusCircle;
  } else if (!call.is_success) {
    tone = "border-danger/20 bg-danger-soft text-danger";
    Icon = FiAlertTriangle;
  }

  return (
    <div className="space-y-2">
      <p className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tone}`}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">
          <span className="font-semibold">{title}</span> {call.message}
          {call.status_code && <span className="opacity-80"> (HTTP {call.status_code})</span>}
        </span>
      </p>
      {call.is_sent && (
        <JsonBlock
          title={`${call.method} ${call.url}`}
          value={{ request: call.payload, response: call.response }}
          isOpen={false}
        />
      )}
    </div>
  );
};

// An update the backend refused, e.g. a SOLUM API that failed; message names that API, its URL and the reason.
export const SolumUpdateFailure = ({ message }) => (
  <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="min-w-0 break-words">
      <span className="font-semibold">Data tidak disimpan.</span> {message}
    </span>
  </p>
);

// Both SOLUM calls of an update result: article data first, then the LED blink.
export const SolumUpdateResult = ({ result }) => (
  <div className="space-y-4">
    <SolumCallResult title="Data artikel:" call={result.solum_article} />
    <SolumCallResult title="LED:" call={result.solum_led} />
  </div>
);

export default SolumCallResult;
