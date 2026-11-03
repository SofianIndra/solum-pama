// The ms_stock form shared by the Edit Data and Create Data tabs: empty form, checks, and request body.
// Number fields are kept as text while typing and only become numbers in the request body.
import { STOCK_STATUS } from "@/constants/stock";

export const STOCK_NUMBER_FIELDS = [
  { key: "own_stock", label: "Own Stock", isRequired: true },
  { key: "min_stock", label: "Min Stock", isRequired: true },
  { key: "max_stock", label: "Max Stock", isRequired: true },
  { key: "stock_on_hand", label: "Stock On Hand", isRequired: false },
  { key: "stock_on_hand_rfid", label: "Stock On Hand RFID", isRequired: false },
];

export const createStockForm = (row = {}) => ({
  item_name: row.item_name ?? "",
  mnemonic: row.mnemonic ?? "",
  storage_bin: row.storage_bin ?? "",
  ...Object.fromEntries(STOCK_NUMBER_FIELDS.map(({ key }) => [key, row[key] == null ? "" : String(row[key])])),
});

const isWholeNumber = (text) => /^\d+$/.test(text.trim());

// Same order as the backend: 0 -> KOSONG, below min -> UNDER MIN, above max -> OVER MAX, otherwise AMAN.
export const getStockStatus = (ownStock, minStock, maxStock) => {
  if (ownStock === 0) return STOCK_STATUS.EMPTY;
  if (ownStock < minStock) return STOCK_STATUS.UNDER_MIN;
  if (ownStock > maxStock) return STOCK_STATUS.OVER_MAX;
  return STOCK_STATUS.SAFE;
};

// Amount the Used Stock buttons take out or put back. An empty input means 1, so one click needs no typing.
// Returns { amount, error }; amount is 0 while the input is not a whole number of 1 or more.
export const DEFAULT_ADJUST_AMOUNT = 1;
export const parseAdjustAmount = (text) => {
  const value = text.trim();
  if (!value) return { amount: DEFAULT_ADJUST_AMOUNT, error: "" };
  if (!isWholeNumber(value) || Number(value) < 1) return { amount: 0, error: "Jumlah harus bilangan bulat 1 atau lebih." };
  return { amount: Number(value), error: "" };
};

// The status the form would be saved with, or null while own/min/max are not valid numbers yet.
export const previewStockStatus = (form) => {
  if (![form.own_stock, form.min_stock, form.max_stock].every(isWholeNumber)) return null;
  return getStockStatus(Number(form.own_stock), Number(form.min_stock), Number(form.max_stock));
};

// Returns every problem as { id, label, message }; id is the field's DOM id ("stock-<key>").
export const validateStockForm = (form) => {
  const issues = [];
  const addIssue = (key, label, message) => issues.push({ id: `stock-${key}`, label, message });

  if (!form.item_name.trim()) addIssue("item_name", "Item Name", "Wajib diisi.");
  for (const { key, label, isRequired } of STOCK_NUMBER_FIELDS) {
    const value = form[key].trim();
    if (!value) {
      if (isRequired) addIssue(key, label, "Wajib diisi.");
    } else if (!isWholeNumber(value)) {
      addIssue(key, label, "Harus bilangan bulat 0 atau lebih.");
    }
  }
  if (isWholeNumber(form.min_stock) && isWholeNumber(form.max_stock) && Number(form.min_stock) > Number(form.max_stock)) {
    addIssue("min_stock", "Min Stock", "Tidak boleh lebih besar dari Max Stock.");
  }

  return issues;
};

// Body for POST /ms-stock/create and PUT /ms-stock/update/{item_code}; empty optional numbers become null.
export const buildStockPayload = (form) => ({
  item_name: form.item_name.trim(),
  mnemonic: form.mnemonic.trim(),
  storage_bin: form.storage_bin.trim(),
  ...Object.fromEntries(
    STOCK_NUMBER_FIELDS.map(({ key }) => [key, form[key].trim() ? Number(form[key]) : null]),
  ),
});
