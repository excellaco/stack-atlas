import { useState } from 'react'
import './CommitDialog.css'

export default function CommitDialog({ onCommit, onClose }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')
    try {
      await onCommit(message.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'Commit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="commit-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Commit Changes</h3>
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Commit message</span>
            <input
              type="text"
              placeholder="Describe what changed..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              autoFocus
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <div className="commit-dialog-actions">
            <button type="submit" className="primary" disabled={loading || !message.trim()}>
              {loading ? 'Committing...' : 'Commit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
