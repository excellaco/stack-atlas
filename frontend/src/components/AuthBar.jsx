import { useState } from 'react'
import { useStore } from '../store'
import { selectIsAdmin } from '../store/selectors'
import './AuthBar.css'

export default function AuthBar() {
  const user = useStore((s) => s.user)
  const signIn = useStore((s) => s.signIn)
  const signOut = useStore((s) => s.signOut)
  const isAdmin = useStore((s) => selectIsAdmin(s))
  const setShowAdmin = useStore((s) => s.setShowAdmin)

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
      await signIn(email, password)
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
          <button type="button" className="ghost" onClick={() => setShowAdmin(true)}>
            Admin
          </button>
        )}
        <button type="button" className="ghost" onClick={signOut}>
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
