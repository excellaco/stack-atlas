import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { signIn, signOut, getSession, parseIdToken } from '../auth'
import * as api from '../api'
import { enrichItems } from '../data/stackData'
import { buildExportData, formatExport } from '../utils/export'
import AuthBar from './AuthBar'
import './ProjectView.css'

export default function ProjectView() {
  const { projectId, subsystemId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auth state
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        const parsed = parseIdToken(session)
        setUser(parsed)
        setToken(session.getIdToken().getJwtToken())
      }
    }).catch(() => {}).finally(() => setAuthLoading(false))
  }, [])

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
  }

  const isAdmin = user?.groups?.includes('admins') || false

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
    const items = enrichItems(data.items, data.descriptions)
    const itemsById = new Map(items.map((item) => [item.id, item]))
    const exportData = buildExportData(effectiveStack, itemsById, data.categories)
    return formatExport(exportData, 'markdown')
  }, [data, effectiveStack])

  const renderContent = () => {
    if (authLoading) {
      return <div className="project-view-loading">Loading...</div>
    }

    if (!user) {
      return (
        <div className="project-view-access-denied">
          <h2>Sign in required</h2>
          <p>You must be signed in to view this project.</p>
        </div>
      )
    }

    if (loading) {
      return <div className="project-view-loading">Loading...</div>
    }

    if (error) {
      return (
        <>
          <div className="project-view-error">{error}</div>
          <Link to="/" className="project-view-back">Back to Atlas</Link>
        </>
      )
    }

    if (subsystemId && !subsystem) {
      return (
        <>
          <div className="project-view-error">Subsystem not found</div>
          <Link to={`/view/${projectId}`} className="project-view-back">View base system</Link>
        </>
      )
    }

    if (!data) return null

    return (
      <>
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
      </>
    )
  }

  return (
    <div className="project-view-page">
      {!authLoading && (
        <AuthBar
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          isAdmin={isAdmin}
          onAdminClick={() => {}}
        />
      )}

      <div className="project-view">
        {renderContent()}
      </div>

      <footer className="app-footer">
        <span>Copyright &copy; {new Date().getFullYear()}</span>
        <a href="https://www.excella.com" target="_blank" rel="noreferrer">
          <img src="https://www.excella.com/wp-content/themes/excllcwpt/images/logo.svg" alt="Excella" height="14" />
        </a>
      </footer>
    </div>
  )
}
