import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import * as api from '../api'
import { enrichItems } from '../data/stackData'
import { buildExportData, formatExport } from '../utils/export'
import './ProjectView.css'

export default function ProjectView() {
  const { projectId, subsystemId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProjectView(projectId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  const subsystem = useMemo(() => {
    if (!data || !subsystemId) return null
    return data.subsystems.find((s) => s.id === subsystemId) || null
  }, [data, subsystemId])

  const effectiveStack = useMemo(() => {
    if (!data) return []
    if (!subsystem) return data.stack
    const stackSet = new Set(data.stack)
    ;(subsystem.exclusions || []).forEach((id) => stackSet.delete(id))
    ;(subsystem.additions || []).forEach((id) => stackSet.add(id))
    return Array.from(stackSet)
  }, [data, subsystem])

  const markdown = useMemo(() => {
    if (!data) return ''
    const items = enrichItems(data.items, data.descriptions)
    const itemsById = new Map(items.map((item) => [item.id, item]))
    const exportData = buildExportData(effectiveStack, itemsById, data.categories)
    return formatExport(exportData, 'markdown')
  }, [data, effectiveStack])

  if (loading) {
    return (
      <div className="project-view">
        <div className="project-view-loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-view">
        <div className="project-view-error">{error}</div>
        <Link to="/" className="project-view-back">Back to Atlas</Link>
      </div>
    )
  }

  if (subsystemId && !subsystem) {
    return (
      <div className="project-view">
        <div className="project-view-error">Subsystem not found</div>
        <Link to={`/view/${projectId}`} className="project-view-back">View base project</Link>
      </div>
    )
  }

  return (
    <div className="project-view">
      <header className="project-view-header">
        <Link to="/" className="project-view-back">Back to Atlas</Link>
        <h1>{data.project.name}{subsystem ? ` / ${subsystem.name}` : ''}</h1>
        {data.project.description && <p>{data.project.description}</p>}
        {subsystem?.description && <p>{subsystem.description}</p>}
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
