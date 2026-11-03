// Stock statuses as the backend computes them, with the LED color SOLUM blinks for each one.
// Keep in sync with STOCK_STATUS_* and STOCK_STATUS_LED_COLORS in the backend's src/config.py.
export const STOCK_STATUS = {
  EMPTY: "KOSONG",
  UNDER_MIN: "UNDER MIN",
  SAFE: "AMAN",
  OVER_MAX: "OVER MAX",
};

export const STOCK_STATUS_STYLES = {
  [STOCK_STATUS.EMPTY]: { led: "WHITE", badge: "border-border-strong bg-surface text-body", dot: "bg-led-white" },
  [STOCK_STATUS.UNDER_MIN]: { led: "YELLOW", badge: "border-warning/20 bg-warning-soft text-warning", dot: "bg-led-yellow" },
  [STOCK_STATUS.SAFE]: { led: "GREEN", badge: "border-success/20 bg-success-soft text-success", dot: "bg-led-green" },
  [STOCK_STATUS.OVER_MAX]: { led: "RED", badge: "border-danger/20 bg-danger-soft text-danger", dot: "bg-led-red" },
};

export const ACTIVE_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
];
