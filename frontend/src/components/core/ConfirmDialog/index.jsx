import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import Button from "@/components/core/Button";
import Modal from "@/components/core/Modal";

const ConfirmDialog = ({
  title = "Konfirmasi",
  message,
  onConfirm,
  onClose,
  isLoading = false,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  isDanger = false,
}) => {
  // While submitting, ignore close requests so the dialog cannot vanish mid-request.
  const handleClose = () => {
    if (!isLoading) onClose();
  };

  return (
    <Modal onClose={handleClose} className="text-center">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isDanger ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
          }`}
        >
          {isDanger ? <FiTrash2 className="h-6 w-6" aria-hidden="true" /> : <FiAlertTriangle className="h-6 w-6" aria-hidden="true" />}
        </span>
        <h2 className="mt-4 text-lg font-semibold text-heading">{title}</h2>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <div className="mt-6 grid w-full grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleClose} isDisabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={isDanger ? "dangerSolid" : "primary"} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
