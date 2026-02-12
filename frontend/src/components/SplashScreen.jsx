import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import './SplashScreen.css'

export default function SplashScreen() {
  const signIn = useStore((s) => s.signIn)
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
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="splash">
      <div className="splash-card">
        <div className="splash-brand">
          <img src="/stack-atlas.png" alt="Stack Atlas" className="splash-logo" />
          <h1>Stack Atlas</h1>
        </div>
        <p className="splash-tagline">
          Unify how teams describe their technology stacks. Filter, select, and
          export a standard format that everyone can compare across programs.
        </p>

        <form className="splash-form" onSubmit={handleSubmit}>
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
          {error && <span className="splash-error">{error}</span>}
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="splash-divider">
          <span>or</span>
        </div>

        <Link to="/sandbox" className="splash-sandbox">
          Try the sandbox
        </Link>
        <p className="splash-sandbox-hint">
          Explore the catalog and build stacks without an account.
          Changes won't be saved.
        </p>
      </div>
    </div>
  )
}
