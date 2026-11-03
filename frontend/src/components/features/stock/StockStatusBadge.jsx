import { STOCK_STATUS_STYLES } from "@/constants/stock";

// Stock status pill with a dot in the LED color SOLUM blinks for that status.
const StockStatusBadge = ({ status, isLedShown = false, className = "" }) => {
  const style = STOCK_STATUS_STYLES[status];
  if (!style) return <span className="text-sm text-muted">-</span>;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.badge} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ring-1 ring-black/15 ${style.dot}`} aria-hidden="true" />
      {status}
      {isLedShown && <span className="font-normal opacity-80">· LED {style.led}</span>}
    </span>
  );
};

export default StockStatusBadge;
