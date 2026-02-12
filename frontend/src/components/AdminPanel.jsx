import { useEffect, useMemo, useRef, useState } from 'react'
import {
  categories as staticCategories,
  types as staticTypes,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions
} from '../data/stackData'
import { useStore } from '../store'
import { selectCatalogItems, selectItemsById } from '../store/selectors'
import * as api from '../api'
import { computeDiff, resolveItemName, formatTimeAgo } from '../utils/diff'
import UserPicker from './UserPicker'
import CatalogItemForm from './CatalogItemForm'
import CategoryStyles from './CategoryStyles'
import './AdminPanel.css'

export default function AdminPanel() {
  const token = useStore((s) => s.token)
  const projects = useStore((s) => s.projects)
  const activeProject = useStore((s) => s.activeProject)
  const subsystems = useStore((s) => s.subsystems)
  const catalogCategories = useStore((s) => s.catalogCategories)
  const catalogTypes = useStore((s) => s.catalogTypes)
  const catalogRawItems = useStore((s) => s.catalogRawItems)
  const catalogDescriptions = useStore((s) => s.catalogDescriptions)
  const catalogSource = useStore((s) => s.catalogSource)
  const setCatalogFromPublish = useStore((s) => s.setCatalogFromPublish)
  const setShowAdmin = useStore((s) => s.setShowAdmin)
  const storeCreateProject = useStore((s) => s.createProject)
  const storeDeleteProject = useStore((s) => s.deleteProject)
  const storeCreateSubsystem = useStore((s) => s.createSubsystem)
  const storeDeleteSubsystem = useStore((s) => s.deleteSubsystem)
  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
    [catalogRawItems, catalogDescriptions]
  )
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems])
  const onClose = () => setShowAdmin(false)
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

  // Subsystem create state
  const [showCreateSub, setShowCreateSub] = useState(false)
  const [newSubName, setNewSubName] = useState('')
  const [newSubDesc, setNewSubDesc] = useState('')

  // Catalog tab state (moved above early return to avoid hooks violation)
  const [editCategories, setEditCategories] = useState(catalogCategories)
  const [editItems, setEditItems] = useState(catalogRawItems)
  const [editTypes, setEditTypes] = useState(catalogTypes)
  const [editDescriptions, setEditDescriptions] = useState(catalogDescriptions)
  const [catalogDirty, setCatalogDirty] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [itemSearch, setItemSearch] = useState('')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('')
  const fileInputRef = useRef(null)

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

  useEffect(() => {
    setEditCategories(catalogCategories)
    setEditItems(catalogRawItems)
    setEditTypes(catalogTypes)
    setEditDescriptions(catalogDescriptions)
    setCatalogDirty(false)
  }, [catalogCategories, catalogRawItems, catalogTypes, catalogDescriptions])

  const filteredEditItems = useMemo(() => {
    let result = editItems
    if (itemCategoryFilter) result = result.filter((i) => i.category === itemCategoryFilter)
    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [editItems, itemCategoryFilter, itemSearch])

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
    const ok = await useStore.getState().requestConfirm({
      title: 'Break Lock',
      message: 'Break this lock? The user\'s draft will be discarded.',
      confirmLabel: 'Break Lock',
      variant: 'warning'
    })
    if (!ok) return
    await api.breakLock(token, projectId, userSub)
    setLocks((prev) => prev.filter((l) => !(l.projectId === projectId && l.userSub === userSub)))
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjName.trim()) return
    await storeCreateProject(newProjName.trim(), newProjDesc.trim())
    setNewProjName('')
    setNewProjDesc('')
    setShowCreate(false)
  }

  const handleCreateSub = async (e) => {
    e.preventDefault()
    if (!newSubName.trim()) return
    await storeCreateSubsystem(newSubName.trim(), newSubDesc.trim())
    setNewSubName('')
    setNewSubDesc('')
    setShowCreateSub(false)
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

  const handleDownloadCatalog = () => {
    const catalog = { categories: catalogCategories, types: catalogTypes, descriptions: catalogDescriptions, items: catalogRawItems }
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stack-catalog.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePublishCatalog = async () => {
    const ok = await useStore.getState().requestConfirm({
      title: 'Publish Catalog',
      message: 'Publish catalog changes? This will update the catalog for all users.',
      confirmLabel: 'Publish',
      variant: 'warning'
    })
    if (!ok) return
    setSaving(true)
    try {
      const catalog = { categories: editCategories, types: editTypes, descriptions: editDescriptions, items: editItems }
      await api.putCatalog(token, catalog)
      setCatalogFromPublish(catalog)
      setCatalogDirty(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCatalog = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data.categories) || !Array.isArray(data.types) || !Array.isArray(data.items) || typeof data.descriptions !== 'object') {
          setError('Invalid catalog format')
          return
        }
        setEditCategories(data.categories)
        setEditTypes(data.types)
        setEditItems(data.items)
        setEditDescriptions(data.descriptions)
        setCatalogDirty(true)
        setError('')
      } catch { setError('Invalid JSON file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSeedFromStatic = () => {
    setEditCategories(staticCategories)
    setEditTypes(staticTypes)
    setEditItems(staticRawItems)
    setEditDescriptions(staticDescriptions)
    setCatalogDirty(true)
  }

  const handleSaveCatalogItem = (itemData, description) => {
    if (editingItem?.id && editingItem.id !== itemData.id) {
      setEditItems((prev) => [...prev.filter((i) => i.id !== editingItem.id), itemData])
      setEditDescriptions((prev) => {
        const next = { ...prev }
        delete next[editingItem.id]
        if (description) next[itemData.id] = description
        return next
      })
    } else {
      setEditItems((prev) => {
        const idx = prev.findIndex((i) => i.id === itemData.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = itemData; return next }
        return [...prev, itemData]
      })
      if (description) setEditDescriptions((prev) => ({ ...prev, [itemData.id]: description }))
    }
    setCatalogDirty(true)
    setEditingItem(null)
  }

  const handleDeleteCatalogItem = async (itemId) => {
    const ok = await useStore.getState().requestConfirm({
      title: 'Delete Item',
      message: `Delete item "${itemId}"? It may be referenced by existing projects.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    setEditItems((prev) => prev.filter((i) => i.id !== itemId))
    setEditDescriptions((prev) => { const next = { ...prev }; delete next[itemId]; return next })
    setCatalogDirty(true)
  }

  const handleSaveCatalogCategory = (catData) => {
    setEditCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === catData.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = catData; return next }
      return [...prev, catData]
    })
    setCatalogDirty(true)
    setEditingCategory(null)
  }

  const handleDeleteCatalogCategory = async (catId) => {
    const count = editItems.filter((i) => i.category === catId).length
    if (count > 0) {
      const ok = await useStore.getState().requestConfirm({
        title: 'Delete Category',
        message: `Category has ${count} items. Delete anyway?`,
        confirmLabel: 'Delete',
        variant: 'danger'
      })
      if (!ok) return
    }
    setEditCategories((prev) => prev.filter((c) => c.id !== catId))
    setCatalogDirty(true)
  }

  const tabs = [
    { id: 'roles', label: 'Roles' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'projects', label: 'Projects' },
    { id: 'locks', label: 'Locks' },
    { id: 'activity', label: 'Activity' }
  ]

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <CategoryStyles categories={editCategories} />
        <div className="panel-header">
          <h3>Admin</h3>
          <div className="admin-header-actions">
            <button type="button" className="ghost" onClick={handleDownloadCatalog}>Download Catalog</button>
            <button type="button" className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="admin-tab"
              data-active={tab === t.id || undefined}
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

        {tab === 'catalog' && (
          <>
            <section className="admin-section">
              <div className="catalog-actions">
                <button type="button" className="publish-catalog-btn" data-dirty={catalogDirty || undefined} onClick={handlePublishCatalog} disabled={!catalogDirty || saving}>
                  {saving ? 'Publishing...' : 'Publish to S3'}
                </button>
                <button type="button" className="ghost" onClick={() => fileInputRef.current?.click()}>Upload JSON</button>
                <button type="button" className="ghost" onClick={handleSeedFromStatic}>Seed from Static</button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden-input" onChange={handleUploadCatalog} />
                <span className="catalog-source-badge">{catalogSource === 'api' ? 'S3' : 'Static'}{catalogDirty ? ' *' : ''}</span>
              </div>
            </section>

            <section className="admin-section">
              <h4>Categories ({editCategories.length})</h4>
              {editingCategory !== null && (
                <div className="catalog-form">
                  <input placeholder="ID (e.g. ai-ml)" value={editingCategory.id || ''} onChange={(e) => setEditingCategory({ ...editingCategory, id: e.target.value })} />
                  <input placeholder="Name" value={editingCategory.name || ''} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                  <input placeholder="Description" value={editingCategory.description || ''} onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })} />
                  <input type="color" value={editingCategory.color || '#6b7280'} onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })} />
                  <div className="catalog-form-actions">
                    <button type="button" className="primary" onClick={() => handleSaveCatalogCategory(editingCategory)} disabled={!editingCategory.id?.trim() || !editingCategory.name?.trim()}>Save</button>
                    <button type="button" className="ghost" onClick={() => setEditingCategory(null)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="admin-table">
                {editCategories.map((cat) => (
                  <div key={cat.id} className="admin-table-row">
                    <div className="admin-table-main">
                      <span className="catalog-color-dot" data-category={cat.id} />
                      <strong>{cat.name}</strong>
                      {cat.description && <span className="admin-table-desc">{cat.description}</span>}
                    </div>
                    <span className="admin-table-meta">{editItems.filter((i) => i.category === cat.id).length} items</span>
                    <button type="button" className="ghost" onClick={() => setEditingCategory({ ...cat })}>Edit</button>
                    <button type="button" className="ghost danger" onClick={() => handleDeleteCatalogCategory(cat.id)}>Delete</button>
                  </div>
                ))}
              </div>
              <button type="button" className="ghost" onClick={() => setEditingCategory({ id: '', name: '', description: '', color: '#6b7280' })}>+ Add Category</button>
            </section>

            <section className="admin-section">
              <h4>Items ({editItems.length})</h4>
              <div className="catalog-search">
                <input placeholder="Search items..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
                <select value={itemCategoryFilter} onChange={(e) => setItemCategoryFilter(e.target.value)}>
                  <option value="">All categories</option>
                  {editCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {editingItem !== null && (
                <CatalogItemForm
                  item={editingItem.id ? editingItem : null}
                  description={editingItem.id ? editDescriptions[editingItem.id] || '' : ''}
                  categories={editCategories}
                  types={editTypes}
                  onSave={handleSaveCatalogItem}
                  onCancel={() => setEditingItem(null)}
                />
              )}
              <div className="admin-table">
                {filteredEditItems.map((item) => (
                  <div key={item.id} className="admin-table-row">
                    <div className="admin-table-main">
                      <strong>{item.name}</strong>
                      <span className="admin-table-desc">{item.type} · {editCategories.find((c) => c.id === item.category)?.name || item.category}</span>
                    </div>
                    <span className="admin-table-meta">{item.id}</span>
                    <button type="button" className="ghost" onClick={() => setEditingItem({ ...item })}>Edit</button>
                    <button type="button" className="ghost danger" onClick={() => handleDeleteCatalogItem(item.id)}>Delete</button>
                  </div>
                ))}
              </div>
              <button type="button" className="ghost" onClick={() => setEditingItem({ id: '', name: '', category: editCategories[0]?.id || '', type: editTypes[0] || '' })}>+ Add Item</button>
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
                    <button type="button" className="ghost danger" onClick={async () => {
                      const ok = await useStore.getState().requestConfirm({
                        title: 'Delete Project',
                        message: `Delete project "${p.name}" and all its data?`,
                        confirmLabel: 'Delete',
                        variant: 'danger'
                      })
                      if (ok) storeDeleteProject(p.id)
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
              <button type="button" className="ghost admin-new-project-btn" onClick={() => setShowCreate(true)}>+ New Project</button>
            )}

            {activeProject && (
              <div className="admin-section">
                <h4>Subsystems — {activeProject.name}</h4>
                {subsystems.length > 0 ? (
                  <div className="admin-table">
                    {subsystems.map((s) => (
                      <div key={s.id} className="admin-table-row">
                        <div className="admin-table-main">
                          <strong>{s.name}</strong>
                          {s.description && <span className="admin-table-desc">{s.description}</span>}
                        </div>
                        <button type="button" className="ghost danger" onClick={async () => {
                          const ok = await useStore.getState().requestConfirm({
                            title: 'Delete Subsystem',
                            message: `Delete subsystem "${s.name}"?`,
                            confirmLabel: 'Delete',
                            variant: 'danger'
                          })
                          if (ok) storeDeleteSubsystem(s.id)
                        }}>Delete</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="diff-empty">No subsystems</div>
                )}
                {showCreateSub ? (
                  <form className="project-create-form" onSubmit={handleCreateSub}>
                    <input placeholder="Subsystem name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
                    <input placeholder="Description" value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} />
                    <button type="submit" className="primary">Create</button>
                    <button type="button" className="ghost" onClick={() => setShowCreateSub(false)}>Cancel</button>
                  </form>
                ) : (
                  <button type="button" className="ghost admin-new-project-btn" onClick={() => setShowCreateSub(true)}>+ New Subsystem</button>
                )}
              </div>
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
                                <div key={`+${id}`} className="diff-added">{resolveItemName(id, itemsById)}</div>
                              ))}
                              {diff.stackRemoved.map((id) => (
                                <div key={`-${id}`} className="diff-removed">{resolveItemName(id, itemsById)}</div>
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
                                <div key={`+a-${id}`} className="diff-added">addition: {resolveItemName(id, itemsById)}</div>
                              ))}
                              {sub.additionsRemoved.map((id) => (
                                <div key={`-a-${id}`} className="diff-removed">addition: {resolveItemName(id, itemsById)}</div>
                              ))}
                              {sub.exclusionsAdded.map((id) => (
                                <div key={`+e-${id}`} className="diff-added">exclusion: {resolveItemName(id, itemsById)}</div>
                              ))}
                              {sub.exclusionsRemoved.map((id) => (
                                <div key={`-e-${id}`} className="diff-removed">exclusion: {resolveItemName(id, itemsById)}</div>
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
