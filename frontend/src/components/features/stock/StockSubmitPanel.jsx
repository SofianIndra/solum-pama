import Button from "@/components/core/Button";
import IssueList from "@/components/core/IssueList";
import StockStatusBadge from "@/components/features/stock/StockStatusBadge";

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted">{label}</dt>
    <dd className="truncate text-right font-medium text-heading">{value || "-"}</dd>
  </div>
);

// rows: [{ label, value }]. status is the stock status the form would be saved with (null while incomplete).
const StockSubmitPanel = ({ rows, status, note, issues, isSubmitting, isDisabled = false, submitLabel }) => {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-heading">Ringkasan</h2>
      </div>

      <dl className="space-y-3 px-5 py-4 text-sm">
        {rows.map((row) => (
          <SummaryRow key={row.label} label={row.label} value={row.value} />
        ))}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Stock status</dt>
          <dd>
            <StockStatusBadge status={status} isLedShown />
          </dd>
        </div>
      </dl>

      <div className="space-y-3 border-t border-border px-5 py-4">
        {note && <p className="rounded-lg border border-warning/20 bg-warning-soft px-3 py-2 text-xs text-warning">{note}</p>}
        {issues.length > 0 && <IssueList issues={issues} />}
        <Button type="submit" isLoading={isSubmitting} isDisabled={isDisabled} className="w-full">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default StockSubmitPanel;
