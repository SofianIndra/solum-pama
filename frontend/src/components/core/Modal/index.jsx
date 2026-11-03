"use client";
import { useEffect, useId, useRef } from "react";

const Modal = ({ title, onClose, children, className = "" }) => {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    // Move focus into the dialog so keyboard and screen-reader users land inside it.
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nav/60 px-4"
      onMouseDown={(event) => {
        // Close only when the press starts on the backdrop, not when a text selection ends there.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none ${className}`}
      >
        {title && (
          <h2 id={titleId} className="mb-2 text-lg font-semibold text-heading">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
