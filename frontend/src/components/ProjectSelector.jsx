import { useState } from 'react'
import '../App.css'

export default function ProjectSelector({
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
