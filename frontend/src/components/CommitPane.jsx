import { useState } from 'react'
import './CommitPane.css'

export default function CommitPane({ dirty, hasDraft, draftStatus, onCommit, onDiscard }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const statusLabel =
    draftStatus === 'saving' ? 'Saving...' :
    draftStatus === 'saved' && !dirty ? 'Draft saved' :
    dirty ? 'Unsaved changes' :
    'Up to date'

  const statusClass =
    draftStatus === 'saving' ? 'saving' :
    dirty ? 'unsaved' :
    draftStatus === 'saved' ? 'saved' :
    'idle'

  const handleCommit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')
    try {
      await onCommit(message.trim())
      setMessage('')
      setIsOpen(false)
    } catch (err) {
      setError(err.message || 'Commit failed')
    } finally {
      setLoading(false)
    }
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
        <form className="commit-pane-body" onSubmit={handleCommit}>
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
              disabled={loading || !message.trim() || !hasDraft}
            >
              {loading ? 'Committing...' : 'Commit'}
            </button>
            <button
              type="button"
              className="ghost danger"
              disabled={!hasDraft}
              onClick={onDiscard}
            >
              Discard
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
