import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { selectDirty, selectPendingChanges, selectCatalogItems, selectItemsById } from '../store/selectors'
import './CommitPane.css'

export default function CommitPane() {
  const dirty = useStore((s) => selectDirty(s))
  const hasDraft = useStore((s) => s.hasDraft)
  const draftStatus = useStore((s) => s.draftStatus)
  const commit = useStore((s) => s.commit)
  const discard = useStore((s) => s.discard)

  const catalogRawItems = useStore((s) => s.catalogRawItems)
  const catalogDescriptions = useStore((s) => s.catalogDescriptions)
  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
    [catalogRawItems, catalogDescriptions]
  )
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems])

  const activeProject = useStore((s) => s.activeProject)
  const savedStack = useStore((s) => s.savedStack)
  const activeSubsystem = useStore((s) => s.activeSubsystem)
  const subsystems = useStore((s) => s.subsystems)
  const selectedItems = useStore((s) => s.selectedItems)
  const savedProviders = useStore((s) => s.savedProviders)
  const selectedProviders = useStore((s) => s.selectedProviders)
  const pendingChanges = useMemo(
    () => selectPendingChanges({ activeProject, savedStack, activeSubsystem, subsystems, selectedItems, savedProviders, selectedProviders }),
    [activeProject, savedStack, activeSubsystem, subsystems, selectedItems, savedProviders, selectedProviders]
  )

  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasChanges = pendingChanges && (
    pendingChanges.itemsAdded.length > 0 ||
    pendingChanges.itemsRemoved.length > 0 ||
    pendingChanges.providersAdded.length > 0 ||
    pendingChanges.providersRemoved.length > 0
  )

  const resolveItemName = (id) => {
    const item = itemsById?.get(id)
    return item ? `${item.name} (${item.type})` : id
  }

  const statusLabel =
    draftStatus === 'saving' ? 'Saving...' :
    dirty ? 'Unsaved changes' :
    hasChanges ? 'Draft saved' :
    'Up to date'

  const statusClass =
    draftStatus === 'saving' ? 'saving' :
    dirty ? 'unsaved' :
    hasChanges ? 'saved' :
    'idle'

  const handleCommit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')
    try {
      await commit(message.trim())
      setMessage('')
      setIsOpen(false)
    } catch (err) {
      setError(err.message || 'Commit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscard = async () => {
    const ok = await useStore.getState().requestConfirm({
      title: 'Discard Draft',
      message: 'Discard all uncommitted changes? This cannot be undone.',
      confirmLabel: 'Discard',
      variant: 'danger'
    })
    if (!ok) return
    await discard()
  }

  return (
    <div className="commit-pane">
      <div className="commit-pane-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="commit-pane-title">
          <h4>Changes</h4>
          <span className={`commit-pane-status ${statusClass}`}>{statusLabel}</span>
        </div>
        <span className="commit-pane-toggle">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div className="commit-pane-diff">
          {hasChanges && (
            <div className="commit-pane-changes">
              {pendingChanges.itemsAdded.map((id) => (
                <div key={`+${id}`} className="diff-added">{resolveItemName(id)}</div>
              ))}
              {pendingChanges.itemsRemoved.map((id) => (
                <div key={`-${id}`} className="diff-removed">{resolveItemName(id)}</div>
              ))}
              {pendingChanges.providersAdded.map((p) => (
                <div key={`+p-${p}`} className="diff-added">Provider: {p.toUpperCase()}</div>
              ))}
              {pendingChanges.providersRemoved.map((p) => (
                <div key={`-p-${p}`} className="diff-removed">Provider: {p.toUpperCase()}</div>
              ))}
            </div>
          )}
          {!hasChanges && dirty && (
            <div className="commit-pane-no-changes">Saving changes...</div>
          )}
          {!hasChanges && !dirty && (
            <div className="commit-pane-no-changes">No changes to commit</div>
          )}
        </div>
      )}
      <form onSubmit={handleCommit}>
        <input
          type="text"
          className="commit-pane-input"
          placeholder="Describe what changed..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <div className="auth-error">{error}</div>}
        <div className="commit-pane-actions">
          <button
            type="submit"
            className="primary"
            disabled={loading || !message.trim() || (!hasDraft && !hasChanges)}
          >
            {loading ? 'Committing...' : 'Commit'}
          </button>
          <button
            type="button"
            className="ghost danger"
            disabled={!hasDraft && !hasChanges}
            onClick={handleDiscard}
          >
            Discard
          </button>
        </div>
      </form>
    </div>
  )
}
