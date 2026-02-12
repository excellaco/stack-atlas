import './ProjectSelector.css'

export default function ProjectSelector({
  projects, activeProject, activeSubsystem, subsystems,
  onSelectProject, onSelectSubsystem
}) {
  return (
    <div className="project-selector-block">
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
        </>
      )}
    </div>
  )
}
