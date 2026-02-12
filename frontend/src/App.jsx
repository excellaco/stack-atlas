import { useEffect, useMemo } from 'react'
import { buildTree, flattenTree } from './utils/tree'
import { buildExportData, formatExport } from './utils/export'
import { buildSearchText } from './utils/search'
import { toggleInList } from './utils/search'
import { getParentName } from './utils/diff'
import { useStore } from './store'
import {
  selectCatalogItems, selectItemsById, selectCategoryById,
  selectCategoryCounts, selectTagCounts, selectTagList
} from './store/selectors'
import AuthBar from './components/AuthBar'
import CommitPane from './components/CommitPane'
import ProjectSelector from './components/ProjectSelector'
import AdminPanel from './components/AdminPanel'
import CommitLog from './components/CommitLog'
import CategoryStyles from './components/CategoryStyles'
import './App.css'

const PROVIDERS = [
  { id: 'aws', label: 'AWS' },
  { id: 'azure', label: 'Azure' },
  { id: 'gcp', label: 'GCP' }
]
const PROVIDER_IDS = PROVIDERS.map((p) => p.id)

function App() {
  // UI state
  const query = useStore((s) => s.query)
  const setQuery = useStore((s) => s.setQuery)
  const selectedCategories = useStore((s) => s.selectedCategories)
  const toggleCategory = useStore((s) => s.toggleCategory)
  const selectedTypes = useStore((s) => s.selectedTypes)
  const toggleType = useStore((s) => s.toggleType)
  const selectedTags = useStore((s) => s.selectedTags)
  const toggleTag = useStore((s) => s.toggleTag)
  const isCategoriesOpen = useStore((s) => s.isCategoriesOpen)
  const setIsCategoriesOpen = useStore((s) => s.setIsCategoriesOpen)
  const isProvidersOpen = useStore((s) => s.isProvidersOpen)
  const setIsProvidersOpen = useStore((s) => s.setIsProvidersOpen)
  const isTypesOpen = useStore((s) => s.isTypesOpen)
  const setIsTypesOpen = useStore((s) => s.setIsTypesOpen)
  const isTagsOpen = useStore((s) => s.isTagsOpen)
  const setIsTagsOpen = useStore((s) => s.setIsTagsOpen)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const density = useStore((s) => s.density)
  const setDensity = useStore((s) => s.setDensity)
  const collapsedCategories = useStore((s) => s.collapsedCategories)
  const toggleCategoryCollapse = useStore((s) => s.toggleCategoryCollapse)
  const showAdmin = useStore((s) => s.showAdmin)
  const sessionExpired = useStore((s) => s.sessionExpired)
  const setSessionExpired = useStore((s) => s.setSessionExpired)
  const resetFilters = useStore((s) => s.resetFilters)

  // Auth
  const user = useStore((s) => s.user)
  const token = useStore((s) => s.token)
  const authLoading = useStore((s) => s.authLoading)
  const storeSignOut = useStore((s) => s.signOut)
  const startTokenRefresh = useStore((s) => s.startTokenRefresh)

  // Project/draft (only what App.jsx layout needs)
  const activeProject = useStore((s) => s.activeProject)
  const activeSubsystem = useStore((s) => s.activeSubsystem)
  const selectedItems = useStore((s) => s.selectedItems)
  const selectedProviders = useStore((s) => s.selectedProviders)
  const setSelectedProviders = useStore((s) => s.setSelectedProviders)
  const savedStack = useStore((s) => s.savedStack)
  const hasDraft = useStore((s) => s.hasDraft)
  const toggleItem = useStore((s) => s.toggleItem)
  const addItems = useStore((s) => s.addItems)
  const removeItem = useStore((s) => s.removeItem)
  const clearSelection = useStore((s) => s.clearSelection)

  // Catalog
  const catalogCategories = useStore((s) => s.catalogCategories)
  const catalogTypes = useStore((s) => s.catalogTypes)
  const catalogRawItems = useStore((s) => s.catalogRawItems)
  const catalogDescriptions = useStore((s) => s.catalogDescriptions)

  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
    [catalogRawItems, catalogDescriptions]
  )
  const itemsById = useMemo(
    () => selectItemsById(catalogItems),
    [catalogItems]
  )
  const categoryById = useMemo(
    () => selectCategoryById({ catalogCategories }),
    [catalogCategories]
  )
  const categoryCounts = useMemo(
    () => selectCategoryCounts(catalogItems),
    [catalogItems]
  )
  const tagCounts = useMemo(
    () => selectTagCounts(catalogItems),
    [catalogItems]
  )
  const tagList = useMemo(
    () => selectTagList(tagCounts),
    [tagCounts]
  )

  // Token refresh
  useEffect(() => {
    if (!token) return
    return startTokenRefresh()
  }, [token])

  // Derived display state
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
      if (selectedProviders.length) {
        const itemProviders = PROVIDER_IDS.filter((p) => item.tags?.includes(p))
        if (itemProviders.length && !itemProviders.some((p) => selectedProviders.includes(p))) {
          return false
        }
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
  }, [query, selectedCategories, selectedProviders, selectedTypes, selectedTags, viewMode, catalogItems, categoryById, itemsById])

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

  const handleCopyAs = async (format) => {
    try {
      const text = formatExport(exportData, format)
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy output', error)
    }
  }

  return (
    <div className="app" data-density={density}>
      <CategoryStyles categories={catalogCategories} />
      <div className="top-bar">
        <div className="brand">
          <img src="/stack-atlas.png" alt="Stack Atlas" className="brand-logo" />
          <span className="brand-name">Stack Atlas</span>
        </div>
        {!authLoading && <AuthBar />}
      </div>

      <header className="hero">
        <div>
          <h1>Unify how teams describe their technology stacks.</h1>
          <p className="hero-subtitle">
            Start with a canonical list derived from your current inventory. Filter,
            select, and export a standard format that everyone can compare across
            programs.
          </p>
          <div className="hero-stat">
            <span>{catalogItems.length} items</span>
            <span>{selectedItems.length} selected</span>
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

      <main className="main-grid">
        <aside className="filters-panel">
          {user && <ProjectSelector />}
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
                    onClick={() => toggleCategory(category.id)}
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
              <div className="filter-title">Cloud Provider</div>
              <button
                type="button"
                className="filter-toggle"
                aria-expanded={isProvidersOpen}
                onClick={() => setIsProvidersOpen((prev) => !prev)}
              >
                {isProvidersOpen ? '−' : '+'}
              </button>
            </div>
            {isProvidersOpen && (
              <div className="chip-grid">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className="chip"
                    data-active={selectedProviders.includes(provider.id) || undefined}
                    onClick={() =>
                      setSelectedProviders((prev) =>
                        toggleInList(prev, provider.id)
                      )
                    }
                  >
                    {provider.label}
                    <span className="chip-count">{tagCounts[provider.id] || 0}</span>
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
                    onClick={() => toggleType(type)}
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
                    onClick={() => toggleTag(tag)}
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
          {activeProject && (
            <div className="project-context">
              <strong>{activeProject.name}</strong>
              {activeSubsystem && <span> / {activeSubsystem.name}</span>}
              {hasDraft && <span className="draft-badge">Draft</span>}
              <a
                className="ghost project-view-link"
                href={`/view/${activeProject.id}${activeSubsystem ? `/${activeSubsystem.id}` : ''}`}
                target="_blank"
                rel="noreferrer"
              >
                View
              </a>
            </div>
          )}

          {activeProject && token && <CommitPane />}

          {activeProject && <CommitLog />}

          <div className="panel-header">
            <h3>Selected Stack{selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}</h3>
            <div className="copy-actions">
              <button type="button" className="ghost" onClick={() => handleCopyAs('markdown')}>
                Copy Markdown
              </button>
              <button type="button" className="ghost" onClick={() => handleCopyAs('json')}>
                Copy JSON
              </button>
            </div>
          </div>

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
        </aside>
      </main>

      {showAdmin && token && <AdminPanel />}

      {sessionExpired && (
        <div className="session-expired-overlay" onClick={() => { setSessionExpired(false); storeSignOut() }}>
          <div className="session-expired-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Session Expired</h3>
            <p>Your session has expired. Please sign in again to continue.</p>
            <button type="button" className="primary" onClick={() => { setSessionExpired(false); storeSignOut() }}>
              Sign in again
            </button>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <span>Copyright &copy; {new Date().getFullYear()}</span>
        <a href="https://www.excella.com" target="_blank" rel="noreferrer">
          <img src="https://www.excella.com/wp-content/themes/excllcwpt/images/logo.svg" alt="Excella" height="14" />
        </a>
      </footer>
    </div>
  )
}

export default App
