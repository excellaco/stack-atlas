import { useState } from 'react'
import './AuthBar.css'

export default function AuthBar({ user, onSignIn, onSignOut, isAdmin, onAdminClick }) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSignIn(email, password)
      setShowForm(false)
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="auth-bar">
        <span className="auth-user">{user.email}</span>
        {isAdmin && (
          <button type="button" className="ghost" onClick={onAdminClick}>
            Admin
          </button>
        )}
        <button type="button" className="ghost" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-bar">
      {showForm ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary" disabled={loading}>
            {loading ? '...' : 'Sign in'}
          </button>
          <button type="button" className="ghost" onClick={() => setShowForm(false)}>
            Cancel
          </button>
          {error && <span className="auth-error">{error}</span>}
        </form>
      ) : (
        <button type="button" className="ghost" onClick={() => setShowForm(true)}>
          Sign in
        </button>
      )}
    </div>
  )
}
