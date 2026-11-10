"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/constants/search";
import { getErrorMessage } from "@/services/PamaApi/api";

// Loads a search dropdown's options with load(params, signal) once params stop changing for
// SEARCH_DEBOUNCE_MS. load must be a module-level function so it keeps its identity between renders.
// The result remembers which params it belongs to, so while new params are loading the old list is
// not shown and no state is reset inside the effect. isEnabled false means "nothing to ask yet".
export const useSearchOptions = (load, params, isEnabled = true) => {
  const requestKey = isEnabled ? JSON.stringify(params) : "";
  const [result, setResult] = useState({ requestKey: "", items: [], error: null });

  useEffect(() => {
    if (!requestKey) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      load(JSON.parse(requestKey), controller.signal)
        .then((items) => setResult({ requestKey, items, error: null }))
        .catch((error) => {
          if (axios.isCancel(error)) return;
          setResult({ requestKey, items: [], error: getErrorMessage(error, "Data gagal dimuat. Coba lagi.") });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, requestKey]);

  const isCurrent = Boolean(requestKey) && result.requestKey === requestKey;
  return {
    items: isCurrent ? result.items : [],
    error: isCurrent ? result.error : null,
    isLoading: Boolean(requestKey) && !isCurrent,
  };
};
