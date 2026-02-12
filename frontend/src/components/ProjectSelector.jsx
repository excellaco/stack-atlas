import { useStore } from '../store'
import './ProjectSelector.css'

export default function ProjectSelector() {
  const projects = useStore((s) => s.projects)
  const activeProject = useStore((s) => s.activeProject)
  const activeSubsystem = useStore((s) => s.activeSubsystem)
  const subsystems = useStore((s) => s.subsystems)
  const selectProject = useStore((s) => s.selectProject)
  const selectSubsystem = useStore((s) => s.selectSubsystem)

  return (
    <div className="project-selector-block">
      <label className="project-label">Project</label>
      <select
        value={activeProject?.id || ''}
        onChange={(e) => selectProject(e.target.value || null)}
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
            onChange={(e) => selectSubsystem(e.target.value || null)}
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
