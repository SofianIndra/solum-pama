// The solum-panama FastAPI backend does every SOLUM call, so the browser talks to it directly.
// No auth header is attached: every backend endpoint is public.
import axios from "axios";
import { showErrorToast } from "@/components/core/ToastNotification";

export const panamaApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// FastAPI errors are { detail: "message" }, or { detail: [{ loc, msg }] } when the body fails validation.
export const getErrorMessage = (error, fallback = "Terjadi kesalahan, silakan coba lagi.") => {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => `${item.loc?.at(-1) ?? "body"}: ${item.msg}`).join(", ");
  if (typeof detail === "string" && detail) return detail;
  if (!error.response) return "Backend tidak dapat dihubungi. Cek NEXT_PUBLIC_API_URL dan pastikan backend berjalan.";
  return fallback;
};

panamaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Requests cancelled on purpose (AbortController) are not errors for the user.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Requests that show their error next to a field ask for no toast with { skipErrorToast: true }.
    if (error.config?.skipErrorToast) {
      return Promise.reject(error);
    }

    // The single place where API errors reach the user — callers must not toast them again.
    showErrorToast(getErrorMessage(error));

    return Promise.reject(error);
  },
);

export default panamaApi;
