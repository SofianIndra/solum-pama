"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/constants/search";
import { getErrorMessage } from "@/services/PanamaApi/api";
import { getStock } from "@/services/PanamaApi/stockService";

// Checks whether an item code already has ms_stock data, once the user stops typing for SEARCH_DEBOUNCE_MS.
// status: "idle" (empty), "checking", "available", "taken", or "error" (message says why). Like
// useSearchOptions, the result remembers its item code, so no state is reset inside the effect.
// takenCodes are codes known to be used without asking again (e.g. the backend rejected them as duplicates).
export const useItemCodeCheck = (itemCode, takenCodes = []) => {
  const code = itemCode.trim();
  const isKnownTaken = takenCodes.includes(code);
  const [result, setResult] = useState({ code: "", status: "idle", message: "" });

  useEffect(() => {
    if (!code || isKnownTaken) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getStock(code, controller.signal)
        .then((row) => setResult({ code, status: row ? "taken" : "available", message: "" }))
        .catch((error) => {
          if (axios.isCancel(error)) return;
          setResult({ code, status: "error", message: getErrorMessage(error, "Item code gagal dicek.") });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [code, isKnownTaken]);

  if (!code) return { status: "idle", message: "" };
  if (isKnownTaken) return { status: "taken", message: "" };
  if (result.code !== code) return { status: "checking", message: "" };
  return { status: result.status, message: result.message };
};
