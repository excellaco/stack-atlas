import { useState } from 'react'
import './UserPicker.css'

export default function UserPicker({ users, onSelect, exclude }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const excludeSet = new Set((exclude || []).map((e) => typeof e === 'string' ? e : e.sub))
  const entries = Object.entries(users || {})
    .filter(([sub]) => !excludeSet.has(sub))
    .filter(([, u]) => !query || u.email?.toLowerCase().includes(query.toLowerCase()) || u.name?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10)

  return (
    <div className="user-picker">
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />
      {isOpen && entries.length > 0 && (
        <div className="user-picker-dropdown">
          {entries.map(([sub, u]) => (
            <button
              key={sub}
              type="button"
              className="user-picker-option"
              onMouseDown={() => { onSelect({ sub, email: u.email }); setQuery(''); setIsOpen(false) }}
            >
              <span className="user-picker-email">{u.email}</span>
              {u.name && <span className="user-picker-name">{u.name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
