import { useStore } from '../store'
import './ConfirmModal.css'

export default function ConfirmModal() {
  const dialog = useStore((s) => s.confirmDialog)
  const resolveConfirm = useStore((s) => s.resolveConfirm)

  if (!dialog) return null

  const {
    title = 'Confirm',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default'
  } = dialog

  return (
    <div className="confirm-overlay" onClick={() => resolveConfirm(false)}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
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
  )
}
