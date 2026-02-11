import { useCallback, useEffect, useMemo, useState } from 'react'
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
  onSelectProject, onSelectSubsystem, onSave, onLoadProject,
  canEdit, isAdmin, onCreateProject, onDeleteProject,
  onCreateSubsystem, onDeleteSubsystem, dirty
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
              <button type="button" className="primary" onClick={onSave} disabled={!dirty}>
                {dirty ? 'Save' : 'Saved'}
              </button>
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

// --- Admin Panel ---

function AdminPanel({ token, onClose }) {
  const [roles, setRoles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [newAdmin, setNewAdmin] = useState('')
  const [newEditorProject, setNewEditorProject] = useState('')
  const [newEditorSub, setNewEditorSub] = useState('')

  useEffect(() => {
    api.getRoles(token).then(setRoles).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [token])

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

  const addAdmin = () => {
    if (!newAdmin.trim() || !roles) return
    const updated = { ...roles, admins: [...new Set([...roles.admins, newAdmin.trim()])] }
    save(updated)
    setNewAdmin('')
  }

  const removeAdmin = (sub) => {
    if (!roles) return
    save({ ...roles, admins: roles.admins.filter((a) => a !== sub) })
  }

  const addEditor = () => {
    if (!newEditorProject.trim() || !newEditorSub.trim() || !roles) return
    const editors = { ...roles.editors }
    const list = editors[newEditorProject.trim()] || []
    editors[newEditorProject.trim()] = [...new Set([...list, newEditorSub.trim()])]
    save({ ...roles, editors })
    setNewEditorSub('')
  }

  const removeEditor = (projectId, sub) => {
    if (!roles) return
    const editors = { ...roles.editors }
    editors[projectId] = (editors[projectId] || []).filter((e) => e !== sub)
    if (!editors[projectId].length) delete editors[projectId]
    save({ ...roles, editors })
  }

  if (loading) return <div className="admin-overlay"><div className="admin-panel"><p>Loading...</p></div></div>

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Admin: Roles</h3>
          <button type="button" className="ghost" onClick={onClose}>Close</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <section className="admin-section">
          <h4>Admins (Cognito sub IDs)</h4>
          <div className="admin-list">
            {roles?.admins.map((sub) => (
              <div key={sub} className="admin-list-item">
                <span className="admin-sub">{sub}</span>
                <button type="button" className="ghost danger" onClick={() => removeAdmin(sub)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="admin-add-row">
            <input placeholder="Cognito sub" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
            <button type="button" className="ghost" onClick={addAdmin}>Add</button>
          </div>
        </section>

        <section className="admin-section">
          <h4>Project Editors</h4>
          {roles && Object.entries(roles.editors).map(([projectId, subs]) => (
            <div key={projectId} className="admin-project-group">
              <div className="admin-project-name">{projectId}</div>
              {subs.map((sub) => (
                <div key={sub} className="admin-list-item">
                  <span className="admin-sub">{sub}</span>
                  <button type="button" className="ghost danger" onClick={() => removeEditor(projectId, sub)}>Remove</button>
                </div>
              ))}
            </div>
          ))}
          <div className="admin-add-row">
            <input placeholder="Project ID" value={newEditorProject} onChange={(e) => setNewEditorProject(e.target.value)} />
            <input placeholder="Cognito sub" value={newEditorSub} onChange={(e) => setNewEditorSub(e.target.value)} />
            <button type="button" className="ghost" onClick={addEditor}>Add</button>
          </div>
        </section>

        {saving && <p className="admin-saving">Saving...</p>}
      </div>
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
  }

  const handleSelectProject = (projectId) => {
    if (!projectId) {
      setActiveProject(null)
      setActiveSubsystem(null)
      setSavedStack(null)
      return
    }
    const project = projects.find((p) => p.id === projectId)
    setActiveProject(project || null)
    setActiveSubsystem(null)
    setSavedStack(null)
  }

  const handleLoadProject = async () => {
    if (!token || !activeProject) return
    try {
      const stack = await api.getStack(token, activeProject.id)
      if (stack?.items) {
        setSelectedItems(stack.items)
        setSavedStack(stack.items)
      }
    } catch (err) {
      console.error('Failed to load stack:', err)
    }
  }

  const handleSave = async () => {
    if (!token || !activeProject) return
    if (activeSubsystem) {
      // Save subsystem additions/exclusions relative to parent
      const parentItems = savedStack || []
      const parentSet = new Set(parentItems)
      const currentSet = new Set(selectedItems)
      const additions = selectedItems.filter((id) => !parentSet.has(id))
      const exclusions = parentItems.filter((id) => !currentSet.has(id))
      await api.updateSubsystem(token, activeProject.id, activeSubsystem.id, {
        additions,
        exclusions
      })
      // Refresh subsystems
      const subs = await api.listSubsystems(token, activeProject.id)
      setSubsystems(subs)
      const updated = subs.find((s) => s.id === activeSubsystem.id)
      if (updated) setActiveSubsystem(updated)
    } else {
      await api.saveStack(token, activeProject.id, selectedItems)
      setSavedStack([...selectedItems])
    }
  }

  const handleSelectSubsystem = async (subId) => {
    if (!subId) {
      setActiveSubsystem(null)
      // Reload base project stack
      if (savedStack) setSelectedItems([...savedStack])
      return
    }
    const sub = subsystems.find((s) => s.id === subId)
    setActiveSubsystem(sub || null)
    if (sub && savedStack) {
      // Compute effective stack: (parent - exclusions) + additions
      const parentSet = new Set(savedStack)
      ;(sub.exclusions || []).forEach((id) => parentSet.delete(id))
      ;(sub.additions || []).forEach((id) => parentSet.add(id))
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
          onSave={handleSave}
          onLoadProject={handleLoadProject}
          canEdit={activeProject ? canEditProject(activeProject.id) : false}
          isAdmin={isAdmin}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onCreateSubsystem={handleCreateSubsystem}
          onDeleteSubsystem={handleDeleteSubsystem}
          dirty={dirty}
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
            <div className="project-context">
              <strong>{activeProject.name}</strong>
              {activeSubsystem && <span> / {activeSubsystem.name}</span>}
            </div>
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
        <AdminPanel token={token} onClose={() => setShowAdmin(false)} />
      )}

      <footer className="app-footer">
        <span>Copyright © {new Date().getFullYear()}</span>
        <a href="https://ahara.io" target="_blank" rel="noreferrer">
          <img src="/tsonu-combined.png" alt="tsonu" height="14" />
        </a>
      </footer>
    </div>
  )
}

export default App
