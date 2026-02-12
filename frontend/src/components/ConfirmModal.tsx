import { useStore } from "../store";
import "./ConfirmModal.css";

type DialogWithCancel = NonNullable<ReturnType<typeof useStore.getState>["confirmDialog"]> & {
  cancelLabel?: string;
};

function resolveDialogProps(dialog: DialogWithCancel) {
  const { title = "Confirm", message, confirmLabel = "Confirm", variant = "default" } = dialog;
  const cancelLabel = dialog.cancelLabel ?? "Cancel";
  return { title, message, confirmLabel, variant, cancelLabel };
}

export default function ConfirmModal(): React.JSX.Element | null {
  const dialog = useStore((s) => s.confirmDialog);
  const resolveConfirm = useStore((s) => s.resolveConfirm);

  if (!dialog) return null;

  const { title, message, confirmLabel, variant, cancelLabel } = resolveDialogProps(
    dialog as DialogWithCancel
  );

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
