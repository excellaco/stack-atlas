import { useStore } from "../store";
import "./ConfirmModal.css";

export default function ConfirmModal(): React.JSX.Element | null {
  const dialog = useStore((s) => s.confirmDialog);
  const resolveConfirm = useStore((s) => s.resolveConfirm);

  if (!dialog) return null;

  const {
    title = "Confirm",
    message,
    confirmLabel = "Confirm",
    variant = "default",
  } = dialog as typeof dialog & { cancelLabel?: string };

  const cancelLabel = (dialog as typeof dialog & { cancelLabel?: string }).cancelLabel ?? "Cancel";

  return (
    <div
      className="confirm-overlay"
      role="button"
      tabIndex={0}
      onClick={() => resolveConfirm(false)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          resolveConfirm(false);
        }
      }}
    >
      <div
        className="confirm-modal"
        role="presentation"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className={`confirm-btn ${variant}`}
            onClick={() => resolveConfirm(true)}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={() => resolveConfirm(false)}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
