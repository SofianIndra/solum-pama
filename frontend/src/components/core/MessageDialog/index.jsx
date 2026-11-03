import { FiXCircle } from "react-icons/fi";
import Button from "@/components/core/Button";
import Modal from "@/components/core/Modal";

// A dialog that only reports something (e.g. why a save was refused) and closes with one button.
// messages is a list so several problems found at once can each get their own line.
const MessageDialog = ({ title, messages, onClose, closeLabel = "Mengerti" }) => {
  return (
    <Modal onClose={onClose} className="text-center">
      <div className="flex flex-col items-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <FiXCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-heading">{title}</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
        <Button onClick={onClose} className="mt-6 w-full">
          {closeLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default MessageDialog;
