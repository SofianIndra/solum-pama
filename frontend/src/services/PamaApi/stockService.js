/* eslint-disable no-console -- the SOLUM calls made by the backend are logged on purpose, to check them in DevTools */
import { pamaApi } from "./api";

// Returns the ms_stock row of one item code, or null when it has no stock data yet.
// A missing row is a normal state (Used Stock tab, the Create tab's "already used" check), so 404 never toasts.
export const getStock = async (itemCode, signal) => {
  try {
    const response = await pamaApi.get(`/ms-stock/${encodeURIComponent(itemCode)}`, { signal, skipErrorToast: true });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

// Returns the ms_stock row linked to a SOLUM article (any status), or null when no row is linked to it yet.
// No toast: Used Stock shows the error in its info panel and Create shows it under the article dropdown.
export const getStockByArticle = async (articleId, signal) => {
  const response = await pamaApi.get("/ms-stock/filter", {
    params: { article_id: articleId, active: "ALL" },
    signal,
    skipErrorToast: true,
  });
  return response.data.data[0] ?? null;
};

// Returns { data, page, total_items, total_page }.
export const filterStocks = async ({ search, page }) => {
  const response = await pamaApi.get("/ms-stock/filter", { params: { search: search || undefined, page } });
  return response.data;
};

// Returns { message }. No toast: the Create tab shows a duplicate item code under its field.
export const createStock = async (payload) => {
  const response = await pamaApi.post("/ms-stock/create", payload, { skipErrorToast: true });
  return response.data;
};

// Returns { message }. Removes the row from the database only; the SOLUM label is not changed.
export const deleteStock = async (itemCode) => {
  const response = await pamaApi.delete(`/ms-stock/delete/${encodeURIComponent(itemCode)}`);
  return response.data;
};

// Returns { message, company, store, data, solum_article, solum_led }. The backend saves the row, sends the
// changed data to SOLUM and blinks the label LED; both SOLUM calls are logged so they can be checked here.
// No toast: a failure (e.g. a SOLUM API that could not be reached) is toasted and shown by the tab itself.
export const updateStock = async (itemCode, payload) => {
  const response = await pamaApi.put(`/ms-stock/update/${encodeURIComponent(itemCode)}`, payload, {
    skipErrorToast: true,
  });
  const result = response.data;
  for (const call of [result.solum_article, result.solum_led]) {
    if (!call.is_sent) console.info(`[SOLUM] ${call.message}`);
    else if (call.is_success) console.info(`[SOLUM] ${call.method} ${call.url} → HTTP ${call.status_code}`, call);
    else console.warn(`[SOLUM] ${call.method} ${call.url} gagal: ${call.message}`, call);
  }
  return result;
};
