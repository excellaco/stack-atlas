import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  categories as staticCategories,
  items as staticItems,
  types as staticTypes,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions,
  enrichItems
} from './data/stackData'
import { signIn, signOut, getSession, parseIdToken } from './auth'
import * as api from './api'
import { buildTree, flattenTree } from './utils/tree'
import { buildExportData, formatExport } from './utils/export'
import { toggleInList, buildSearchText } from './utils/search'
import { getParentName } from './utils/diff'
import AuthBar from './components/AuthBar'
import CommitDialog from './components/CommitDialog'
import ProjectSelector from './components/ProjectSelector'
import AdminPanel from './components/AdminPanel'
import CommitLog from './components/CommitLog'
import CategoryStyles from './components/CategoryStyles'
import './App.css'

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

  // Catalog state — initialized from static data, overridden by API
  const [catalogCategories, setCatalogCategories] = useState(staticCategories)
  const [catalogTypes, setCatalogTypes] = useState(staticTypes)
  const [catalogRawItems, setCatalogRawItems] = useState(staticRawItems)
  const [catalogDescriptions, setCatalogDescriptions] = useState(staticDescriptions)
  const [catalogSource, setCatalogSource] = useState('static')

  const catalogItems = useMemo(
    () => enrichItems(catalogRawItems, catalogDescriptions),
    [catalogRawItems, catalogDescriptions]
  )
  const itemsById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems]
  )
  const categoryById = useMemo(
    () => new Map(catalogCategories.map((c) => [c.id, c])),
    [catalogCategories]
  )
  const categoryCounts = useMemo(
    () => catalogItems.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc }, {}),
    [catalogItems]
  )
  const tagCounts = useMemo(
    () => catalogItems.reduce((acc, item) => { (item.tags || []).forEach((tag) => { acc[tag] = (acc[tag] || 0) + 1 }); return acc }, {}),
    [catalogItems]
  )
  const tagList = useMemo(
    () => Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([tag]) => tag),
    [tagCounts]
  )

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

  // Load catalog from API when authenticated
  useEffect(() => {
    if (!token) return
    api.getCatalog(token)
      .then((catalog) => {
        setCatalogCategories(catalog.categories)
        setCatalogTypes(catalog.types)
        setCatalogRawItems(catalog.items)
        setCatalogDescriptions(catalog.descriptions)
        setCatalogSource('api')
      })
      .catch(() => setCatalogSource('static'))
  }, [token])

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

    const baseMatches = catalogItems.filter((item) => {
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
      return buildSearchText(item, categoryById).includes(q)
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

    return catalogItems.filter((item) => ids.has(item.id))
  }, [query, selectedCategories, selectedTypes, selectedTags, viewMode, catalogItems, categoryById, itemsById])

  const sections = useMemo(() => {
    return catalogCategories
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
    return catalogCategories
      .map((category) => {
        const catItems = selectedItems
          .map((id) => itemsById.get(id))
          .filter(Boolean)
          .filter((item) => item.category === category.id)
          .sort((a, b) => a.name.localeCompare(b.name))

        if (!catItems.length) return null

        return { category, items: catItems }
      })
      .filter(Boolean)
  }, [selectedItems, catalogCategories, itemsById])

  const exportData = useMemo(
    () => buildExportData(selectedItems, itemsById, catalogCategories),
    [selectedItems, itemsById, catalogCategories]
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
    <div className="app" data-density={density}>
      <CategoryStyles categories={catalogCategories} />
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
              <span>{catalogItems.length} items</span>
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
                data-active={viewMode === 'hierarchy' || undefined}
                onClick={() => setViewMode('hierarchy')}
              >
                Hierarchy
              </button>
              <button
                type="button"
                data-active={viewMode === 'flat' || undefined}
                onClick={() => setViewMode('flat')}
              >
                Flat
              </button>
            </div>
            <div className="view-toggle">
              <span>Density</span>
              <button
                type="button"
                data-active={density === 'compact' || undefined}
                onClick={() => setDensity('compact')}
              >
                Compact
              </button>
              <button
                type="button"
                data-active={density === 'comfortable' || undefined}
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
                {catalogCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="chip"
                    data-active={selectedCategories.includes(category.id) || undefined}
                    data-category={category.id}
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
                {catalogTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="chip"
                    data-active={selectedTypes.includes(type) || undefined}
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
                    className="chip"
                    data-active={selectedTags.includes(tag) || undefined}
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
            <div key={section.id} className="category-section" data-collapsed={isCollapsed || undefined} data-category={section.id}>
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
                  const parentName = getParentName(item, itemsById)
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
                      className="item-card"
                      data-selected={isSelected || undefined}
                      data-inherited={isInherited && isSelected || undefined}
                      data-depth={depth || undefined}
                      data-delay={Math.min(index, 10) || undefined}
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
              <CommitLog token={token} projectId={activeProject.id} itemsById={itemsById} />
            </>
          )}

          {selectedItems.length ? (
            <div className="selected-groups">
              {selectedByCategory.map((group) => (
                <div key={group.category.id} className="selected-group">
                  <div className="selected-group-title">
                    <span
                      className="dot"
                      data-category={group.category.id}
                    />
                    {group.category.name}
                  </div>
                  <div className="selected-chips">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="selected-chip"
                        data-inherited={inheritedSet.has(item.id) || undefined}
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
                  className="chip"
                  data-active={exportFormat === 'markdown' || undefined}
                  onClick={() => setExportFormat('markdown')}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  className="chip"
                  data-active={exportFormat === 'json' || undefined}
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
          itemsById={itemsById}
          catalogCategories={catalogCategories}
          catalogTypes={catalogTypes}
          catalogRawItems={catalogRawItems}
          catalogDescriptions={catalogDescriptions}
          catalogSource={catalogSource}
          onCatalogPublished={(catalog) => {
            setCatalogCategories(catalog.categories)
            setCatalogTypes(catalog.types)
            setCatalogRawItems(catalog.items)
            setCatalogDescriptions(catalog.descriptions)
            setCatalogSource('api')
          }}
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
