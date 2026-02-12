import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import * as api from '../api'
import { enrichItems } from '../data/stackData'
import { buildExportData, formatExport } from '../utils/export'
import './ProjectView.css'

export default function ProjectView() {
  const { projectId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProjectView(projectId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  const markdown = useMemo(() => {
    if (!data) return ''
    const items = enrichItems(data.items, data.descriptions)
    const itemsById = new Map(items.map((item) => [item.id, item]))
    const exportData = buildExportData(data.stack, itemsById, data.categories)
    return formatExport(exportData, 'markdown')
  }, [data])

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

  return (
    <div className="project-view">
      <header className="project-view-header">
        <Link to="/" className="project-view-back">Back to Atlas</Link>
        <h1>{data.project.name}</h1>
        {data.project.description && <p>{data.project.description}</p>}
      </header>
      <article className="project-view-content">
        <Markdown>{markdown}</Markdown>
      </article>
      {data.subsystems.length > 0 && (
        <section className="project-view-subsystems">
          <h2>Subsystems</h2>
          {data.subsystems.map((sub) => (
            <div key={sub.id} className="project-view-subsystem">
              <h3>{sub.name}</h3>
              {sub.description && <p>{sub.description}</p>}
              {(sub.additions?.length > 0 || sub.exclusions?.length > 0) && (
                <ul>
                  {sub.additions?.map((id) => <li key={id}>+ {id}</li>)}
                  {sub.exclusions?.map((id) => <li key={id}>- {id}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
