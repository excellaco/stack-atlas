import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories, items, types } from './data/stackData'
import { signIn, signOut, getSession, parseIdToken } from './auth'
import * as api from './api'
import './App.css'

const itemsById = new Map(items.map((item) => [item.id, item]))
const categoryById = new Map(categories.map((category) => [category.id, category]))

const technologyTypes = new Set([
  'Capability',
  'Technique',
  'Pattern',
  'Practice',
  'Methodology',
  'Test Type',
  'Standard'
])

const toolTypes = new Set([
  'Tool',
  'Service',
  'Platform',
  'Framework',
  'Library',
  'Language',
  'Runtime',
  'DataStore'
])

const categoryCounts = items.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1
  return acc
}, {})

const tagCounts = items.reduce((acc, item) => {
  ;(item.tags || []).forEach((tag) => {
    acc[tag] = (acc[tag] || 0) + 1
  })
  return acc
}, {})

const tagList = Object.entries(tagCounts)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 10)
  .map(([tag]) => tag)

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

const buildSearchText = (item) => {
  const parts = [
    item.name,
    item.type,
    item.description,
    ...(item.synonyms || []),
    ...(item.tags || []),
    categoryById.get(item.category)?.name || ''
  ]
  return parts.join(' ').toLowerCase()
}

const buildTree = (categoryItems) => {
  const nodes = new Map(
    categoryItems.map((item) => [item.id, { item, children: [] }])
  )

  const roots = []

  nodes.forEach((node) => {
    const parentId = (node.item.parents || []).find((id) => nodes.has(id))
    if (parentId) {
      nodes.get(parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodeList) => {
    nodeList.sort((a, b) => a.item.name.localeCompare(b.item.name))
    nodeList.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)
  return roots
}

const flattenTree = (nodes, depth = 0) =>
  nodes.flatMap((node) => [
    { item: node.item, depth },
    ...flattenTree(node.children, depth + 1)
  ])

const buildExportData = (selectedIds) => {
  const selectedItems = selectedIds
    .map((id) => itemsById.get(id))
    .filter(Boolean)

  const categoriesPayload = categories
    .map((category) => {
      const categoryItems = selectedItems.filter(
        (item) => item.category === category.id
      )

      if (!categoryItems.length) return null

      const technologies = categoryItems
        .filter((item) => technologyTypes.has(item.type))
        .map((item) => ({ name: item.name, type: item.type }))
        .sort((a, b) => a.name.localeCompare(b.name))

      const tools = categoryItems
        .filter((item) => toolTypes.has(item.type))
        .map((item) => ({ name: item.name, type: item.type }))
        .sort((a, b) => a.name.localeCompare(b.name))

      return {
        name: category.name,
        technologies,
        tools
      }
    })
    .filter(Boolean)

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    categories: categoriesPayload
  }
}

const formatExport = (data, format) => {
  if (!data.categories.length) {
    return 'No items selected yet. Use the list to build a standardized stack.'
  }

  if (format === 'json') {
    return JSON.stringify(data, null, 2)
  }

  const lines = [`# Standardized Stack`, `Generated: ${data.generatedAt}`, '']
  data.categories.forEach((category) => {
    lines.push(`## ${category.name}`)
    if (category.technologies.length) {
      lines.push(
        `- Technologies: ${category.technologies
          .map((item) => item.name)
          .join('; ')}`
      )
    }
    if (category.tools.length) {
      lines.push(
        `- Tools: ${category.tools.map((item) => item.name).join('; ')}`
      )
    }
    lines.push('')
  })
  return lines.join('\n')
}

const getParentName = (item) => {
  const parentId = item.parents?.[0]
  if (!parentId) return null
  return itemsById.get(parentId)?.name
}

// --- Auth Bar ---

function AuthBar({ user, onSignIn, onSignOut, isAdmin, onAdminClick }) {
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

// --- Project Selector ---

function ProjectSelector({
  token, projects, activeProject, activeSubsystem, subsystems,
  onSelectProject, onSelectSubsystem, onLoadProject,
  canEdit, isAdmin, onCreateProject, onDeleteProject,
  onCreateSubsystem, onDeleteSubsystem, dirty,
  hasDraft, draftStatus, onCommit, onDiscard
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateSub, setShowCreateSub] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [newSubDesc, setNewSubDesc] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await onCreateProject(newName.trim(), newDesc.trim())
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  const handleCreateSub = async (e) => {
    e.preventDefault()
    if (!newSubName.trim()) return
    await onCreateSubsystem(newSubName.trim(), newSubDesc.trim())
    setNewSubName('')
    setNewSubDesc('')
    setShowCreateSub(false)
  }

  return (
    <div className="project-bar">
      <div className="project-selector">
        <label className="project-label">Project</label>
        <select
          value={activeProject?.id || ''}
          onChange={(e) => onSelectProject(e.target.value || null)}
        >
          <option value="">Local (no project)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {activeProject && (
          <>
            <button type="button" className="ghost" onClick={onLoadProject}>
              Load
            </button>
            {canEdit && (
              <>
                {draftStatus === 'saving' && (
                  <span className="draft-status saving">Saving...</span>
                )}
                {draftStatus === 'saved' && !dirty && (
                  <span className="draft-status saved">Draft saved</span>
                )}
                {!hasDraft && !dirty && draftStatus !== 'saving' && (
                  <span className="draft-status up-to-date">Up to date</span>
                )}
                {hasDraft && (
                  <>
                    <button type="button" className="primary" onClick={onCommit}>
                      Commit
                    </button>
                    <button type="button" className="ghost danger" onClick={onDiscard}>
                      Discard
                    </button>
                  </>
                )}
              </>
            )}
            {isAdmin && (
              <button type="button" className="ghost danger" onClick={() => onDeleteProject(activeProject.id)}>
                Delete
              </button>
            )}
          </>
        )}
        {isAdmin && (
          <button type="button" className="ghost" onClick={() => setShowCreate(!showCreate)}>
            + New
          </button>
        )}
      </div>

      {showCreate && (
        <form className="project-create-form" onSubmit={handleCreate}>
          <input placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <button type="submit" className="primary">Create</button>
          <button type="button" className="ghost" onClick={() => setShowCreate(false)}>Cancel</button>
        </form>
      )}

      {activeProject && (
        <div className="subsystem-selector">
          <label className="project-label">Subsystem</label>
          <select
            value={activeSubsystem?.id || ''}
            onChange={(e) => onSelectSubsystem(e.target.value || null)}
          >
            <option value="">Base project</option>
            {subsystems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {canEdit && (
            <button type="button" className="ghost" onClick={() => setShowCreateSub(!showCreateSub)}>
              + New
            </button>
          )}
          {activeSubsystem && canEdit && (
            <button type="button" className="ghost danger" onClick={() => onDeleteSubsystem(activeSubsystem.id)}>
              Delete
            </button>
          )}
        </div>
      )}

      {showCreateSub && (
        <form className="project-create-form" onSubmit={handleCreateSub}>
          <input placeholder="Subsystem name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
          <input placeholder="Description (optional)" value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} />
          <button type="submit" className="primary">Create</button>
          <button type="button" className="ghost" onClick={() => setShowCreateSub(false)}>Cancel</button>
        </form>
      )}
    </div>
  )
}

// --- User Picker ---

function UserPicker({ users, onSelect, exclude }) {
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

// --- Admin Panel ---

function AdminPanel({ token, projects, onClose, onCreateProject, onDeleteProject }) {
  const [tab, setTab] = useState('roles')
  const [roles, setRoles] = useState(null)
  const [users, setUsers] = useState(null)
  const [locks, setLocks] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [newEditorProject, setNewEditorProject] = useState('')
  const [expandedCommits, setExpandedCommits] = useState(new Set())

  // Project create state
  const [showCreate, setShowCreate] = useState(false)
  const [newProjName, setNewProjName] = useState('')
  const [newProjDesc, setNewProjDesc] = useState('')

  useEffect(() => {
    Promise.all([
      api.getRoles(token).catch(() => ({ admins: [], editors: {} })),
      api.listUsers(token).catch(() => ({}))
    ]).then(([r, u]) => { setRoles(r); setUsers(u) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (tab === 'locks') {
      api.listLocks(token).then(setLocks).catch(() => setLocks([]))
    }
    if (tab === 'activity') {
      api.getActivity(token).then(setActivity).catch(() => setActivity([]))
    }
  }, [tab, token])

  const save = async (updated) => {
    setSaving(true)
    setError('')
    try {
      const result = await api.putRoles(token, updated)
      setRoles(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const addAdmin = (user) => {
    if (!roles) return
    if (roles.admins.some((a) => a.sub === user.sub)) return
    save({ ...roles, admins: [...roles.admins, user] })
  }

  const removeAdmin = (sub) => {
    if (!roles) return
    save({ ...roles, admins: roles.admins.filter((a) => a.sub !== sub) })
  }

  const addEditor = (user) => {
    if (!newEditorProject || !roles) return
    const editors = { ...roles.editors }
    const list = editors[newEditorProject] || []
    if (list.some((e) => e.sub === user.sub)) return
    editors[newEditorProject] = [...list, user]
    save({ ...roles, editors })
  }

  const removeEditor = (projectId, sub) => {
    if (!roles) return
    const editors = { ...roles.editors }
    editors[projectId] = (editors[projectId] || []).filter((e) => e.sub !== sub)
    if (!editors[projectId].length) delete editors[projectId]
    save({ ...roles, editors })
  }

  const handleBreakLock = async (projectId, userSub) => {
    if (!confirm('Break this lock? The user\'s draft will be discarded.')) return
    await api.breakLock(token, projectId, userSub)
    setLocks((prev) => prev.filter((l) => !(l.projectId === projectId && l.userSub === userSub)))
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjName.trim()) return
    await onCreateProject(newProjName.trim(), newProjDesc.trim())
    setNewProjName('')
    setNewProjDesc('')
    setShowCreate(false)
  }

  const toggleCommitExpand = (id) => {
    setExpandedCommits((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <div className="admin-overlay"><div className="admin-panel"><p>Loading...</p></div></div>

  const tabs = [
    { id: 'roles', label: 'Roles' },
    { id: 'projects', label: 'Projects' },
    { id: 'locks', label: 'Locks' },
    { id: 'activity', label: 'Activity' }
  ]

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Admin</h3>
          <button type="button" className="ghost" onClick={onClose}>Close</button>
        </div>

        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'roles' && (
          <>
            <section className="admin-section">
              <h4>Admins</h4>
              <div className="admin-list">
                {roles?.admins.map((entry) => {
                  const email = typeof entry === 'string' ? entry : entry.email
                  const sub = typeof entry === 'string' ? entry : entry.sub
                  return (
                    <div key={sub} className="admin-list-item">
                      <span className="admin-email">{email}</span>
                      <button type="button" className="ghost danger" onClick={() => removeAdmin(sub)}>Remove</button>
                    </div>
                  )
                })}
              </div>
              <UserPicker users={users} exclude={roles?.admins} onSelect={addAdmin} />
            </section>

            <section className="admin-section">
              <h4>Project Editors</h4>
              {roles && Object.entries(roles.editors).map(([projectId, entries]) => (
                <div key={projectId} className="admin-project-group">
                  <div className="admin-project-name">{projectId}</div>
                  {entries.map((entry) => {
                    const email = typeof entry === 'string' ? entry : entry.email
                    const sub = typeof entry === 'string' ? entry : entry.sub
                    return (
                      <div key={sub} className="admin-list-item">
                        <span className="admin-email">{email}</span>
                        <button type="button" className="ghost danger" onClick={() => removeEditor(projectId, sub)}>Remove</button>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="admin-add-row">
                <select value={newEditorProject} onChange={(e) => setNewEditorProject(e.target.value)}>
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {newEditorProject && (
                  <UserPicker
                    users={users}
                    exclude={roles?.editors[newEditorProject]}
                    onSelect={addEditor}
                  />
                )}
              </div>
            </section>
          </>
        )}

        {tab === 'projects' && (
          <section className="admin-section">
            <div className="admin-table">
              {projects.map((p) => {
                const editorCount = (roles?.editors[p.id] || []).length
                return (
                  <div key={p.id} className="admin-table-row">
                    <div className="admin-table-main">
                      <strong>{p.name}</strong>
                      {p.description && <span className="admin-table-desc">{p.description}</span>}
                    </div>
                    <span className="admin-table-meta">{editorCount} editor{editorCount !== 1 ? 's' : ''}</span>
                    <button type="button" className="ghost danger" onClick={() => {
                      if (confirm(`Delete project "${p.name}" and all its data?`)) onDeleteProject(p.id)
                    }}>Delete</button>
                  </div>
                )
              })}
            </div>
            {showCreate ? (
              <form className="project-create-form" onSubmit={handleCreateProject}>
                <input placeholder="Project name" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} required />
                <input placeholder="Description" value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} />
                <button type="submit" className="primary">Create</button>
                <button type="button" className="ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </form>
            ) : (
              <button type="button" className="ghost" onClick={() => setShowCreate(true)} style={{ marginTop: '0.5rem' }}>+ New Project</button>
            )}
          </section>
        )}

        {tab === 'locks' && (
          <section className="admin-section">
            {locks.length === 0 ? (
              <div className="diff-empty">No active locks</div>
            ) : (
              <div className="admin-table">
                {locks.map((lock) => (
                  <div key={`${lock.projectId}-${lock.userSub}`} className="admin-table-row">
                    <div className="admin-table-main">
                      <strong>{lock.projectId}</strong>
                      <span className="admin-table-desc">{lock.email}</span>
                    </div>
                    <span className="admin-table-meta">{formatTimeAgo(lock.lockedAt)}</span>
                    <button type="button" className="ghost danger" onClick={() => handleBreakLock(lock.projectId, lock.userSub)}>Break</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'activity' && (
          <section className="admin-section">
            {activity.length === 0 ? (
              <div className="diff-empty">No recent activity</div>
            ) : (
              <div className="commit-log-list">
                {activity.map((commit, index) => {
                  const isExpanded = expandedCommits.has(commit.id)
                  const prevSnapshot = index < activity.length - 1 ? activity[index + 1]?.snapshot : null
                  const diff = isExpanded ? computeDiff(prevSnapshot, commit.snapshot) : null
                  const hasChanges = diff && (
                    diff.stackAdded.length || diff.stackRemoved.length ||
                    diff.subsystemsAdded.length || diff.subsystemsRemoved.length ||
                    diff.subsystemsChanged.length
                  )

                  return (
                    <div key={commit.id} className="commit-entry">
                      <div className="commit-entry-header" onClick={() => toggleCommitExpand(commit.id)}>
                        <span className="commit-entry-toggle">{isExpanded ? '▾' : '▸'}</span>
                        <div className="commit-entry-body">
                          <div className="commit-entry-message">
                            <span className="commit-project-tag">{commit.projectName}</span> {commit.message}
                          </div>
                          <div className="commit-entry-meta">
                            {commit.author} · {formatTimeAgo(commit.timestamp)}
                          </div>
                        </div>
                      </div>
                      {isExpanded && diff && (
                        <div className="commit-diff">
                          {!hasChanges && <div className="diff-empty">Initial commit</div>}
                          {(diff.stackAdded.length > 0 || diff.stackRemoved.length > 0) && (
                            <>
                              <div className="diff-section">Stack</div>
                              {diff.stackAdded.map((id) => (
                                <div key={`+${id}`} className="diff-added">{resolveItemName(id)}</div>
                              ))}
                              {diff.stackRemoved.map((id) => (
                                <div key={`-${id}`} className="diff-removed">{resolveItemName(id)}</div>
                              ))}
                            </>
                          )}
                          {diff.subsystemsAdded.map((sub) => (
                            <div key={`+sub-${sub.id}`}>
                              <div className="diff-section">Subsystem: {sub.name}</div>
                              <div className="diff-added">added</div>
                            </div>
                          ))}
                          {diff.subsystemsRemoved.map((sub) => (
                            <div key={`-sub-${sub.id}`}>
                              <div className="diff-section">Subsystem: {sub.name}</div>
                              <div className="diff-removed">removed</div>
                            </div>
                          ))}
                          {diff.subsystemsChanged.map((sub) => (
                            <div key={`~sub-${sub.id}`}>
                              <div className="diff-section">Subsystem: {sub.name}</div>
                              {sub.additionsAdded.map((id) => (
                                <div key={`+a-${id}`} className="diff-added">addition: {resolveItemName(id)}</div>
                              ))}
                              {sub.additionsRemoved.map((id) => (
                                <div key={`-a-${id}`} className="diff-removed">addition: {resolveItemName(id)}</div>
                              ))}
                              {sub.exclusionsAdded.map((id) => (
                                <div key={`+e-${id}`} className="diff-added">exclusion: {resolveItemName(id)}</div>
                              ))}
                              {sub.exclusionsRemoved.map((id) => (
                                <div key={`-e-${id}`} className="diff-removed">exclusion: {resolveItemName(id)}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {saving && <p className="admin-saving">Saving...</p>}
      </div>
    </div>
  )
}

// --- Commit Dialog ---

function CommitDialog({ onCommit, onClose }) {
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

// --- Diff Computation ---

const computeDiff = (prevSnapshot, currSnapshot) => {
  const prevStack = new Set(prevSnapshot?.stack || [])
  const currStack = new Set(currSnapshot?.stack || [])

  const stackAdded = [...currStack].filter((id) => !prevStack.has(id))
  const stackRemoved = [...prevStack].filter((id) => !currStack.has(id))

  const prevSubs = prevSnapshot?.subsystems || {}
  const currSubs = currSnapshot?.subsystems || {}

  const prevSubIds = new Set(Object.keys(prevSubs))
  const currSubIds = new Set(Object.keys(currSubs))

  const subsystemsAdded = [...currSubIds]
    .filter((id) => !prevSubIds.has(id))
    .map((id) => ({ id, name: currSubs[id]?.name || id }))

  const subsystemsRemoved = [...prevSubIds]
    .filter((id) => !currSubIds.has(id))
    .map((id) => ({ id, name: prevSubs[id]?.name || id }))

  const subsystemsChanged = [...currSubIds]
    .filter((id) => prevSubIds.has(id))
    .map((id) => {
      const prev = prevSubs[id] || {}
      const curr = currSubs[id] || {}
      const prevAdd = new Set(prev.additions || [])
      const currAdd = new Set(curr.additions || [])
      const prevExcl = new Set(prev.exclusions || [])
      const currExcl = new Set(curr.exclusions || [])

      const additionsAdded = [...currAdd].filter((x) => !prevAdd.has(x))
      const additionsRemoved = [...prevAdd].filter((x) => !currAdd.has(x))
      const exclusionsAdded = [...currExcl].filter((x) => !prevExcl.has(x))
      const exclusionsRemoved = [...prevExcl].filter((x) => !currExcl.has(x))

      if (!additionsAdded.length && !additionsRemoved.length && !exclusionsAdded.length && !exclusionsRemoved.length) {
        return null
      }
      return { id, name: curr.name || id, additionsAdded, additionsRemoved, exclusionsAdded, exclusionsRemoved }
    })
    .filter(Boolean)

  return { stackAdded, stackRemoved, subsystemsAdded, subsystemsRemoved, subsystemsChanged }
}

const resolveItemName = (id) => {
  const item = itemsById.get(id)
  return item ? `${item.name} (${item.type})` : id
}

const formatTimeAgo = (timestamp) => {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// --- Commit Log ---

function CommitLog({ token, projectId }) {
  const [commits, setCommits] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !projectId) {
      setCommits([])
      return
    }
    setLoading(true)
    api.getCommits(token, projectId)
      .then(setCommits)
      .catch(() => setCommits([]))
      .finally(() => setLoading(false))
  }, [token, projectId])

  const toggleExpand = (commitId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(commitId)) next.delete(commitId)
      else next.add(commitId)
      return next
    })
  }

  if (!commits.length && !loading) return null

  return (
    <div className="commit-log">
      <div className="commit-log-header" onClick={() => setIsOpen(!isOpen)}>
        <h4>History ({commits.length})</h4>
        <span className="commit-log-toggle">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div className="commit-log-list">
          {loading && <div className="diff-empty">Loading...</div>}
          {commits.map((commit, index) => {
            const isExpanded = expanded.has(commit.id)
            const prevSnapshot = index < commits.length - 1 ? commits[index + 1]?.snapshot : null
            const diff = isExpanded ? computeDiff(prevSnapshot, commit.snapshot) : null
            const hasChanges = diff && (
              diff.stackAdded.length || diff.stackRemoved.length ||
              diff.subsystemsAdded.length || diff.subsystemsRemoved.length ||
              diff.subsystemsChanged.length
            )

            return (
              <div key={commit.id} className="commit-entry">
                <div className="commit-entry-header" onClick={() => toggleExpand(commit.id)}>
                  <span className="commit-entry-toggle">{isExpanded ? '▾' : '▸'}</span>
                  <div className="commit-entry-body">
                    <div className="commit-entry-message">{commit.message}</div>
                    <div className="commit-entry-meta">
                      {commit.author} · {formatTimeAgo(commit.timestamp)}
                    </div>
                  </div>
                </div>
                {isExpanded && diff && (
                  <div className="commit-diff">
                    {!hasChanges && <div className="diff-empty">Initial commit</div>}

                    {(diff.stackAdded.length > 0 || diff.stackRemoved.length > 0) && (
                      <>
                        <div className="diff-section">Stack</div>
                        {diff.stackAdded.map((id) => (
                          <div key={`+${id}`} className="diff-added">{resolveItemName(id)}</div>
                        ))}
                        {diff.stackRemoved.map((id) => (
                          <div key={`-${id}`} className="diff-removed">{resolveItemName(id)}</div>
                        ))}
                      </>
                    )}

                    {diff.subsystemsAdded.map((sub) => (
                      <div key={`+sub-${sub.id}`}>
                        <div className="diff-section">Subsystem: {sub.name}</div>
                        <div className="diff-added">added</div>
                      </div>
                    ))}

                    {diff.subsystemsRemoved.map((sub) => (
                      <div key={`-sub-${sub.id}`}>
                        <div className="diff-section">Subsystem: {sub.name}</div>
                        <div className="diff-removed">removed</div>
                      </div>
                    ))}

                    {diff.subsystemsChanged.map((sub) => (
                      <div key={`~sub-${sub.id}`}>
                        <div className="diff-section">Subsystem: {sub.name}</div>
                        {sub.additionsAdded.map((id) => (
                          <div key={`+a-${id}`} className="diff-added">addition: {resolveItemName(id)}</div>
                        ))}
                        {sub.additionsRemoved.map((id) => (
                          <div key={`-a-${id}`} className="diff-removed">addition: {resolveItemName(id)}</div>
                        ))}
                        {sub.exclusionsAdded.map((id) => (
                          <div key={`+e-${id}`} className="diff-added">exclusion: {resolveItemName(id)}</div>
                        ))}
                        {sub.exclusionsRemoved.map((id) => (
                          <div key={`-e-${id}`} className="diff-removed">exclusion: {resolveItemName(id)}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Main App ---

function App() {
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [isTypesOpen, setIsTypesOpen] = useState(true)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [viewMode, setViewMode] = useState('hierarchy')
  const [density, setDensity] = useState('compact')
  const [collapsedCategories, setCollapsedCategories] = useState(new Set())
  const [exportFormat, setExportFormat] = useState('markdown')

  // Auth state
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Project state
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [subsystems, setSubsystems] = useState([])
  const [activeSubsystem, setActiveSubsystem] = useState(null)
  const [savedStack, setSavedStack] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  // Draft/commit state
  const [hasDraft, setHasDraft] = useState(false)
  const [draftStatus, setDraftStatus] = useState('idle') // idle | saving | saved
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [draftSubsystems, setDraftSubsystems] = useState({})
  const autoSaveTimer = useRef(null)
  const skipAutoSave = useRef(false)

  // Restore session on mount
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        const parsed = parseIdToken(session)
        setUser(parsed)
        setToken(session.getIdToken().getJwtToken())
      }
    }).catch(() => {}).finally(() => setAuthLoading(false))
  }, [])

  // Load projects when authenticated
  useEffect(() => {
    if (!token) {
      setProjects([])
      setActiveProject(null)
      setSubsystems([])
      setActiveSubsystem(null)
      return
    }
    api.listProjects(token).then(setProjects).catch(() => setProjects([]))
  }, [token])

  // Load subsystems when project changes
  useEffect(() => {
    if (!token || !activeProject) {
      setSubsystems([])
      setActiveSubsystem(null)
      return
    }
    api.listSubsystems(token, activeProject.id).then(setSubsystems).catch(() => setSubsystems([]))
  }, [token, activeProject?.id])

  const isAdmin = user?.groups?.includes('admins') || false

  const canEditProject = useCallback((projectId) => {
    if (isAdmin) return true
    // Editors are checked server-side; optimistically allow if user has a project loaded
    // The server will reject if unauthorized
    return !!token
  }, [isAdmin, token])

  const handleSignIn = async (email, password) => {
    const session = await signIn(email, password)
    const parsed = parseIdToken(session)
    setUser(parsed)
    setToken(session.getIdToken().getJwtToken())
  }

  const handleSignOut = () => {
    signOut()
    setUser(null)
    setToken(null)
    setProjects([])
    setActiveProject(null)
    setSubsystems([])
    setActiveSubsystem(null)
    setSavedStack(null)
    setHasDraft(false)
    setDraftStatus('idle')
    setDraftSubsystems({})
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
  }

  const handleSelectProject = (projectId) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (!projectId) {
      setActiveProject(null)
      setActiveSubsystem(null)
      setSavedStack(null)
      setHasDraft(false)
      setDraftStatus('idle')
      setDraftSubsystems({})
      return
    }
    const project = projects.find((p) => p.id === projectId)
    setActiveProject(project || null)
    setActiveSubsystem(null)
    setSavedStack(null)
    setHasDraft(false)
    setDraftStatus('idle')
    setDraftSubsystems({})
  }

  const handleLoadProject = async () => {
    if (!token || !activeProject) return
    skipAutoSave.current = true
    try {
      // Load committed state
      const stack = await api.getStack(token, activeProject.id)
      const committedItems = stack?.items || []
      setSavedStack(committedItems)

      // Load subsystems for draft tracking
      const subs = await api.listSubsystems(token, activeProject.id)
      setSubsystems(subs)
      const subState = {}
      for (const s of subs) {
        subState[s.id] = { name: s.name, additions: s.additions || [], exclusions: s.exclusions || [] }
      }

      // Check for existing draft
      try {
        const draft = await api.getDraft(token, activeProject.id)
        if (draft) {
          setSelectedItems(draft.stack?.items || committedItems)
          setDraftSubsystems(draft.subsystems || subState)
          setHasDraft(true)
          setDraftStatus('saved')
          skipAutoSave.current = false
          return
        }
      } catch (err) {
        if (err.message?.includes('423') || err.message?.includes('locked')) {
          console.warn('Project locked by another user')
        }
      }

      // No draft — load committed state
      setSelectedItems(committedItems)
      setDraftSubsystems(subState)
      setHasDraft(false)
      setDraftStatus('idle')
    } catch (err) {
      console.error('Failed to load stack:', err)
    } finally {
      skipAutoSave.current = false
    }
  }

  const performAutoSave = useCallback(async () => {
    if (!token || !activeProject || skipAutoSave.current) return
    setDraftStatus('saving')
    try {
      // Build current subsystem state
      const currentSubState = { ...draftSubsystems }
      if (activeSubsystem) {
        const parentItems = savedStack || []
        const parentSet = new Set(parentItems)
        const currentSet = new Set(selectedItems)
        currentSubState[activeSubsystem.id] = {
          name: activeSubsystem.name,
          additions: selectedItems.filter((id) => !parentSet.has(id)),
          exclusions: parentItems.filter((id) => !currentSet.has(id))
        }
      }
      await api.saveDraft(token, activeProject.id, {
        stack: { items: activeSubsystem ? (savedStack || []) : selectedItems },
        subsystems: currentSubState
      })
      setHasDraft(true)
      setDraftStatus('saved')
      setDraftSubsystems(currentSubState)
    } catch (err) {
      console.error('Auto-save failed:', err)
      setDraftStatus('idle')
    }
  }, [token, activeProject, activeSubsystem, selectedItems, savedStack, draftSubsystems])

  const handleCommit = async (message) => {
    if (!token || !activeProject) return
    // Trigger a final save before committing
    await performAutoSave()
    const commit = await api.commitChanges(token, activeProject.id, { message })
    // Reload committed state
    setHasDraft(false)
    setDraftStatus('idle')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    skipAutoSave.current = true
    try {
      const stack = await api.getStack(token, activeProject.id)
      setSavedStack(stack?.items || [])
      setSelectedItems(stack?.items || [])
      const subs = await api.listSubsystems(token, activeProject.id)
      setSubsystems(subs)
      const subState = {}
      for (const s of subs) {
        subState[s.id] = { name: s.name, additions: s.additions || [], exclusions: s.exclusions || [] }
      }
      setDraftSubsystems(subState)
      setActiveSubsystem(null)
    } finally {
      skipAutoSave.current = false
    }
    return commit
  }

  const handleDiscard = async () => {
    if (!token || !activeProject || !confirm('Discard all uncommitted changes?')) return
    await api.discardDraft(token, activeProject.id)
    setHasDraft(false)
    setDraftStatus('idle')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    // Reload committed state
    skipAutoSave.current = true
    try {
      const stack = await api.getStack(token, activeProject.id)
      setSavedStack(stack?.items || [])
      setSelectedItems(stack?.items || [])
      const subs = await api.listSubsystems(token, activeProject.id)
      setSubsystems(subs)
      const subState = {}
      for (const s of subs) {
        subState[s.id] = { name: s.name, additions: s.additions || [], exclusions: s.exclusions || [] }
      }
      setDraftSubsystems(subState)
      setActiveSubsystem(null)
    } finally {
      skipAutoSave.current = false
    }
  }

  // Debounced auto-save (2.5s after last change)
  useEffect(() => {
    if (!token || !activeProject || !savedStack || skipAutoSave.current) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave()
    }, 2500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [selectedItems, activeProject?.id, token, performAutoSave, savedStack])

  const handleSelectSubsystem = async (subId) => {
    if (!subId) {
      setActiveSubsystem(null)
      // When switching back to base, use draft stack if available
      if (hasDraft) {
        // Load from draft's base stack
        const draft = draftSubsystems
        // The base stack items are in selectedItems when no subsystem active
        // Reload from savedStack (committed) — the draft auto-save captures the full state
        if (savedStack) setSelectedItems([...savedStack])
      } else if (savedStack) {
        setSelectedItems([...savedStack])
      }
      return
    }
    const sub = subsystems.find((s) => s.id === subId)
    setActiveSubsystem(sub || null)
    // Load subsystem state from draft if available, otherwise from committed
    const subData = draftSubsystems[subId] || sub
    if (subData && savedStack) {
      const parentSet = new Set(savedStack)
      ;(subData.exclusions || []).forEach((id) => parentSet.delete(id))
      ;(subData.additions || []).forEach((id) => parentSet.add(id))
      setSelectedItems(Array.from(parentSet))
    }
  }

  const handleCreateProject = async (name, description) => {
    if (!token) return
    const project = await api.createProject(token, { name, description })
    setProjects((prev) => [...prev, project])
    setActiveProject(project)
  }

  const handleDeleteProject = async (projectId) => {
    if (!token || !confirm('Delete this project and all its subsystems?')) return
    await api.deleteProject(token, projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    if (activeProject?.id === projectId) {
      setActiveProject(null)
      setActiveSubsystem(null)
      setSavedStack(null)
      setHasDraft(false)
      setDraftStatus('idle')
      setDraftSubsystems({})
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }

  const handleCreateSubsystem = async (name, description) => {
    if (!token || !activeProject) return
    const sub = await api.createSubsystem(token, activeProject.id, { name, description })
    setSubsystems((prev) => [...prev, sub])
  }

  const handleDeleteSubsystem = async (subId) => {
    if (!token || !activeProject || !confirm('Delete this subsystem?')) return
    await api.deleteSubsystemApi(token, activeProject.id, subId)
    setSubsystems((prev) => prev.filter((s) => s.id !== subId))
    if (activeSubsystem?.id === subId) {
      setActiveSubsystem(null)
      if (savedStack) setSelectedItems([...savedStack])
    }
  }

  const dirty = useMemo(() => {
    if (!activeProject || !savedStack) return selectedItems.length > 0 && !!activeProject
    if (selectedItems.length !== savedStack.length) return true
    const saved = new Set(savedStack)
    return selectedItems.some((id) => !saved.has(id))
  }, [selectedItems, savedStack, activeProject])

  const toggleCategoryCollapse = (categoryId) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const selectedSet = useMemo(
    () => new Set(selectedItems),
    [selectedItems]
  )

  const inheritedSet = useMemo(() => {
    if (!activeSubsystem || !savedStack) return new Set()
    const parentSet = new Set(savedStack)
    const exclusionSet = new Set(activeSubsystem.exclusions || [])
    const inherited = new Set()
    for (const id of parentSet) {
      if (!exclusionSet.has(id)) inherited.add(id)
    }
    return inherited
  }, [activeSubsystem, savedStack])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()

    const baseMatches = items.filter((item) => {
      if (selectedCategories.length && !selectedCategories.includes(item.category)) {
        return false
      }
      if (selectedTypes.length && !selectedTypes.includes(item.type)) {
        return false
      }
      if (
        selectedTags.length &&
        !selectedTags.every((tag) => item.tags?.includes(tag))
      ) {
        return false
      }
      if (!q) return true
      return buildSearchText(item).includes(q)
    })

    const ids = new Set(baseMatches.map((item) => item.id))
    if (viewMode === 'hierarchy') {
      baseMatches.forEach((item) => {
        ;(item.parents || []).forEach((parentId) => {
          if (itemsById.has(parentId)) {
            ids.add(parentId)
          }
        })
      })
    }

    return items.filter((item) => ids.has(item.id))
  }, [query, selectedCategories, selectedTypes, selectedTags, viewMode])

  const sections = useMemo(() => {
    return categories
      .map((category) => {
        const categoryItems = filteredItems.filter(
          (item) => item.category === category.id
        )
        if (!categoryItems.length) return null

        const displayItems =
          viewMode === 'flat'
            ? [...categoryItems]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => ({ item, depth: 0 }))
            : flattenTree(buildTree(categoryItems))

        return {
          ...category,
          items: displayItems
        }
      })
      .filter(Boolean)
  }, [filteredItems, viewMode])

  const selectedByCategory = useMemo(() => {
    return categories
      .map((category) => {
        const categoryItems = selectedItems
          .map((id) => itemsById.get(id))
          .filter(Boolean)
          .filter((item) => item.category === category.id)
          .sort((a, b) => a.name.localeCompare(b.name))

        if (!categoryItems.length) return null

        return { category, items: categoryItems }
      })
      .filter(Boolean)
  }, [selectedItems])

  const exportData = useMemo(
    () => buildExportData(selectedItems),
    [selectedItems]
  )

  const exportText = useMemo(
    () => formatExport(exportData, exportFormat),
    [exportData, exportFormat]
  )

  const toggleItem = (id) => {
    setSelectedItems((prev) => toggleInList(prev, id))
  }

  const addItems = (ids) => {
    setSelectedItems((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const removeItem = (id) => {
    setSelectedItems((prev) => prev.filter((item) => item !== id))
  }

  const clearSelection = () => setSelectedItems([])

  const resetFilters = () => {
    setQuery('')
    setSelectedCategories([])
    setSelectedTypes([])
    setSelectedTags([])
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
    } catch (error) {
      console.error('Failed to copy output', error)
    }
  }

  return (
    <div className={`app ${density}`}>
      {!authLoading && (
        <AuthBar
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          isAdmin={isAdmin}
          onAdminClick={() => setShowAdmin(true)}
        />
      )}

      <header className="hero">
        <div>
          <p className="eyebrow">Stack Atlas</p>
          <h1>Unify how teams describe their technology stacks.</h1>
          <p className="hero-subtitle">
            Start with a canonical list derived from your current inventory. Filter,
            select, and export a standard format that everyone can compare across
            programs.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary" onClick={resetFilters}>
              Reset filters
            </button>
            <div className="hero-stat">
              <span>{items.length} items</span>
              <span>{selectedItems.length} selected</span>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <h2>Workflow</h2>
          <ol>
            <li>Filter by category, type, or search.</li>
            <li>Select the capabilities and tools you actually use.</li>
            <li>Export the standardized stack for side-by-side comparisons.</li>
          </ol>
          <div className="toggle-row">
            <div className="view-toggle">
              <span>View</span>
              <button
                type="button"
                className={viewMode === 'hierarchy' ? 'active' : ''}
                onClick={() => setViewMode('hierarchy')}
              >
                Hierarchy
              </button>
              <button
                type="button"
                className={viewMode === 'flat' ? 'active' : ''}
                onClick={() => setViewMode('flat')}
              >
                Flat
              </button>
            </div>
            <div className="view-toggle">
              <span>Density</span>
              <button
                type="button"
                className={density === 'compact' ? 'active' : ''}
                onClick={() => setDensity('compact')}
              >
                Compact
              </button>
              <button
                type="button"
                className={density === 'comfortable' ? 'active' : ''}
                onClick={() => setDensity('comfortable')}
              >
                Comfortable
              </button>
            </div>
          </div>
        </div>
      </header>

      {user && (
        <ProjectSelector
          token={token}
          projects={projects}
          activeProject={activeProject}
          activeSubsystem={activeSubsystem}
          subsystems={subsystems}
          onSelectProject={handleSelectProject}
          onSelectSubsystem={handleSelectSubsystem}
          onLoadProject={handleLoadProject}
          canEdit={activeProject ? canEditProject(activeProject.id) : false}
          isAdmin={isAdmin}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onCreateSubsystem={handleCreateSubsystem}
          onDeleteSubsystem={handleDeleteSubsystem}
          dirty={dirty}
          hasDraft={hasDraft}
          draftStatus={draftStatus}
          onCommit={() => setShowCommitDialog(true)}
          onDiscard={handleDiscard}
        />
      )}

      <main className="main-grid">
        <aside className="filters-panel">
          <div className="panel-header">
            <h3>Filters</h3>
            <button type="button" className="ghost" onClick={resetFilters}>
              Clear
            </button>
          </div>

          <label className="field">
            <span>Search</span>
            <input
              type="search"
              placeholder="Search by name, description, or tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="filter-block">
            <div className="filter-heading">
              <div className="filter-title">Categories</div>
              <button
                type="button"
                className="filter-toggle"
                aria-expanded={isCategoriesOpen}
                onClick={() => setIsCategoriesOpen((prev) => !prev)}
              >
                {isCategoriesOpen ? '−' : '+'}
              </button>
            </div>
            {isCategoriesOpen && (
              <div className="chip-grid">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={
                      selectedCategories.includes(category.id)
                        ? 'chip active'
                        : 'chip'
                    }
                    style={{ '--chip': category.color }}
                    onClick={() =>
                      setSelectedCategories((prev) =>
                        toggleInList(prev, category.id)
                      )
                    }
                  >
                    {category.name}
                    <span className="chip-count">{categoryCounts[category.id]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="filter-block">
            <div className="filter-heading">
              <div className="filter-title">Types</div>
              <button
                type="button"
                className="filter-toggle"
                aria-expanded={isTypesOpen}
                onClick={() => setIsTypesOpen((prev) => !prev)}
              >
                {isTypesOpen ? '−' : '+'}
              </button>
            </div>
            {isTypesOpen && (
              <div className="chip-grid">
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={selectedTypes.includes(type) ? 'chip active' : 'chip'}
                    onClick={() =>
                      setSelectedTypes((prev) => toggleInList(prev, type))
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="filter-block">
            <div className="filter-heading">
              <div className="filter-title">Tags (match all)</div>
              <button
                type="button"
                className="filter-toggle"
                aria-expanded={isTagsOpen}
                onClick={() => setIsTagsOpen((prev) => !prev)}
              >
                {isTagsOpen ? '−' : '+'}
              </button>
            </div>
            {isTagsOpen && (
              <div className="chip-grid">
                {tagList.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={selectedTags.includes(tag) ? 'chip active' : 'chip'}
                    onClick={() =>
                      setSelectedTags((prev) => toggleInList(prev, tag))
                    }
                  >
                    {tag}
                    <span className="chip-count">{tagCounts[tag]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="list-panel">
          {sections.map((section) => {
            const isCollapsed = collapsedCategories.has(section.id)
            return (
            <div key={section.id} className={`category-section ${isCollapsed ? 'collapsed' : ''}`}>
              <button
                type="button"
                className="section-header"
                onClick={() => toggleCategoryCollapse(section.id)}
              >
                <span className="section-toggle">{isCollapsed ? '+' : '−'}</span>
                <div className="section-title">
                  <h2>{section.name}</h2>
                  <p>{section.description}</p>
                </div>
                <span className="section-count">
                  {section.items.length} visible
                </span>
              </button>
              {!isCollapsed && (
              <div className="item-list">
                {section.items.map(({ item, depth }, index) => {
                  const isSelected = selectedSet.has(item.id)
                  const isInherited = inheritedSet.has(item.id)
                  const parentName = getParentName(item)
                  const commonItems = (item.commonWith || [])
                    .map((id) => itemsById.get(id))
                    .filter(Boolean)

                  const hasMetadata = !!(
                    item.description ||
                    parentName ||
                    item.synonyms?.length > 0 ||
                    item.tags?.length > 0 ||
                    commonItems.length > 0
                  )

                  return (
                    <article
                      key={item.id}
                      className={`item-card${isSelected ? ' is-selected' : ''}${isInherited && isSelected ? ' is-inherited' : ''}`}
                      style={{
                        '--accent': section.color,
                        '--depth': depth,
                        '--delay': `${Math.min(index, 10) * 45}ms`
                      }}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="item-main">
                        {hasMetadata && (
                          <button
                            type="button"
                            className="item-info-btn"
                            onClick={(e) => e.stopPropagation()}
                            title="More info"
                          >
                            ?
                          </button>
                        )}
                        <div className="item-title">
                          <h3>{item.name}</h3>
                          <span className="item-type">{item.type}</span>
                          {isInherited && isSelected && (
                            <span className="inherited-badge">inherited</span>
                          )}
                        </div>
                        <div className="item-checkbox" />
                      </div>

                      {hasMetadata && (
                        <div
                          className="item-meta-overlay"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.description && (
                            <div className="item-description">{item.description}</div>
                          )}
                          {parentName && (
                            <div className="item-parent">Parent: {parentName}</div>
                          )}
                          {item.synonyms?.length > 0 && (
                            <div className="item-synonyms">
                              Also known as: {item.synonyms.join(', ')}
                            </div>
                          )}
                          {item.tags?.length > 0 && (
                            <div className="item-tags">
                              {item.tags.map((tag) => (
                                <span key={tag} className="tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {commonItems.length > 0 && (
                            <div className="item-common">
                              <span>Common together:</span>
                              <div className="common-list">
                                {commonItems.map((common) => (
                                  <button
                                    key={common.id}
                                    type="button"
                                    className="chip"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      addItems([common.id])
                                    }}
                                  >
                                    + {common.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
              )}
            </div>
          )})}
        </section>

        <aside className="selected-panel">
          <div className="panel-header">
            <h3>Selected Stack</h3>
            <button type="button" className="ghost" onClick={clearSelection}>
              Clear all
            </button>
          </div>

          {activeProject && (
            <>
              <div className="project-context">
                <strong>{activeProject.name}</strong>
                {activeSubsystem && <span> / {activeSubsystem.name}</span>}
                {hasDraft && <span className="draft-badge">Draft</span>}
              </div>
              <CommitLog token={token} projectId={activeProject.id} />
            </>
          )}

          {selectedItems.length ? (
            <div className="selected-groups">
              {selectedByCategory.map((group) => (
                <div key={group.category.id} className="selected-group">
                  <div className="selected-group-title">
                    <span
                      className="dot"
                      style={{ '--dot': group.category.color }}
                    />
                    {group.category.name}
                  </div>
                  <div className="selected-chips">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`selected-chip${inheritedSet.has(item.id) ? ' inherited' : ''}`}
                        onClick={() => removeItem(item.id)}
                      >
                        {item.name}
                        {inheritedSet.has(item.id) && <span className="inherited-dot" />}
                        <span className="remove">x</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Select items to build a standardized stack output.
            </div>
          )}

          <div className="export-panel">
            <div className="export-header">
              <h4>Standard Output</h4>
              <div className="export-actions">
                <button
                  type="button"
                  className={exportFormat === 'markdown' ? 'chip active' : 'chip'}
                  onClick={() => setExportFormat('markdown')}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  className={exportFormat === 'json' ? 'chip active' : 'chip'}
                  onClick={() => setExportFormat('json')}
                >
                  JSON
                </button>
                <button type="button" className="ghost" onClick={handleCopy}>
                  Copy
                </button>
              </div>
            </div>
            <pre className="export-body">{exportText}</pre>
          </div>
        </aside>
      </main>

      {showAdmin && token && (
        <AdminPanel
          token={token}
          projects={projects}
          onClose={() => setShowAdmin(false)}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {showCommitDialog && token && activeProject && (
        <CommitDialog
          onCommit={handleCommit}
          onClose={() => setShowCommitDialog(false)}
        />
      )}

      <footer className="app-footer">
        <span>Copyright © {new Date().getFullYear()}</span>
        <a href="https://www.excella.com" target="_blank" rel="noreferrer">
          <img src="https://www.excella.com/wp-content/themes/excllcwpt/images/logo.svg" alt="Excella" height="14" />
        </a>
      </footer>
    </div>
  )
}

export default App
