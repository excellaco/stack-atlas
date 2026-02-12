import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { useStore } from '../store'
import * as api from '../api'
import {
  categories as staticCategories,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions,
  enrichItems
} from '../data/stackData'
import { buildExportData, formatExport } from '../utils/export'
import './ProjectView.css'

export default function ProjectView() {
  const { projectId, subsystemId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = useStore((s) => s.user)
  const token = useStore((s) => s.token)
  const authLoading = useStore((s) => s.authLoading)

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    api.getProjectView(token, projectId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId, token, authLoading])

  const subsystem = useMemo(() => {
    if (!data || !subsystemId) return null
    return data.subsystems.find((s) => s.id === subsystemId) || null
  }, [data, subsystemId])

  const effectiveStack = useMemo(() => {
    if (!data) return []
    if (!subsystem) return data.stack
    const stackSet = new Set(data.stack)
    ;(subsystem.additions || []).forEach((id) => stackSet.add(id))
    return Array.from(stackSet)
  }, [data, subsystem])

  const markdown = useMemo(() => {
    if (!data) return ''
    const catalogItems = data.items.length ? data.items : staticRawItems
    const catalogDescs = Object.keys(data.descriptions).length ? data.descriptions : staticDescriptions
    const catalogCats = data.categories.length ? data.categories : staticCategories
    const items = enrichItems(catalogItems, catalogDescs)
    const itemsById = new Map(items.map((item) => [item.id, item]))
    const exportData = buildExportData(effectiveStack, itemsById, catalogCats)
    return formatExport(exportData, 'markdown')
  }, [data, effectiveStack])

  const canEdit = data?.project?.canEdit || false

  const handleEdit = () => {
    const subPath = subsystemId ? `/${subsystemId}` : ''
    navigate(`/edit/${projectId}${subPath}`)
  }

  if (loading || authLoading) {
    return <div className="project-view-loading">Loading...</div>
  }

  if (error) {
    return (
      <div className="project-view">
        <div className="project-view-error">{error}</div>
        <Link to="/" className="project-view-back">Back to Projects</Link>
      </div>
    )
  }

  if (subsystemId && !subsystem) {
    return (
      <div className="project-view">
        <div className="project-view-error">Subsystem not found</div>
        <Link to={`/view/${projectId}`} className="project-view-back">View base system</Link>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="project-view">
      <header className="project-view-header">
        <div className="project-view-header-top">
          <div>
            <h1>{data.project.name}{subsystem ? ` / ${subsystem.name}` : ''}</h1>
            {data.project.description && <p>{data.project.description}</p>}
            {subsystem?.description && <p>{subsystem.description}</p>}
          </div>
          {canEdit && (
            <button type="button" className="edit-mode-btn" onClick={handleEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </header>
      <article className="project-view-content">
        <Markdown>{markdown}</Markdown>
      </article>
      {!subsystemId && data.subsystems.length > 0 && (
        <section className="project-view-subsystems">
          <h2>Subsystems</h2>
          {data.subsystems.map((sub) => (
            <Link key={sub.id} to={`/view/${projectId}/${sub.id}`} className="project-view-subsystem">
              <h3>{sub.name}</h3>
              {sub.description && <p>{sub.description}</p>}
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
