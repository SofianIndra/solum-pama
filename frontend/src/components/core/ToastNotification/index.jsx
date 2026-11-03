"use client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BASE_OPTIONS = {
  position: "top-right",
  hideProgressBar: false,
  pauseOnHover: true,
};

export const ToastNotification = () => {
  return <ToastContainer />;
};

export const showSuccessToast = (message) => {
  toast.success(message, { ...BASE_OPTIONS, autoClose: 2500 });
};

// Errors stay longer because SOLUM error messages can be long and the user needs time to read them.
export const showErrorToast = (message) => {
  toast.error(message, { ...BASE_OPTIONS, autoClose: 6000 });
};

export const showWarningToast = (message) => {
  toast.warning(message, { ...BASE_OPTIONS, autoClose: 4000 });
};
