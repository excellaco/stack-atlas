import { useStore } from "../store";

function ProjectRow({ project, editorCount, onDelete }) {
  const handleDelete = async () => {
    const ok = await useStore.getState().requestConfirm({
      title: "Delete Project",
      message: `Delete project "${project.name}" and all its data?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) onDelete(project.id);
  };

  return (
    <div className="admin-table-row">
      <div className="admin-table-main">
        <strong>{project.name}</strong>
        {project.description && <span className="admin-table-desc">{project.description}</span>}
      </div>
      <span className="admin-table-meta">
        {editorCount} editor{editorCount !== 1 ? "s" : ""}
      </span>
      <button type="button" className="ghost danger" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}

function CreateForm({ name, desc, onNameChange, onDescChange, onSubmit, onCancel }) {
  return (
    <form className="project-create-form" onSubmit={onSubmit}>
      <input placeholder="Project name" value={name} onChange={onNameChange} required />
      <input placeholder="Description" value={desc} onChange={onDescChange} />
      <button type="submit" className="primary">
        Create
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

function SubsystemRow({ subsystem, onDelete }) {
  const handleDelete = async () => {
    const ok = await useStore.getState().requestConfirm({
      title: "Delete Subsystem",
      message: `Delete subsystem "${subsystem.name}"?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) onDelete(subsystem.id);
  };

  return (
    <div className="admin-table-row">
      <div className="admin-table-main">
        <strong>{subsystem.name}</strong>
        {subsystem.description && <span className="admin-table-desc">{subsystem.description}</span>}
      </div>
      <button type="button" className="ghost danger" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}

function ProjectList({ projects, roles, onDeleteProject }) {
  return (
    <div className="admin-table">
      {projects.map((p) => (
        <ProjectRow
          key={p.id}
          project={p}
          editorCount={(roles?.editors[p.id] || []).length}
          onDelete={onDeleteProject}
        />
      ))}
    </div>
  );
}

function SubsystemsSection({ sub }) {
  return (
    <div className="admin-section">
      <h4>Subsystems — {sub.activeProject.name}</h4>
      {sub.subsystems.length > 0 ? (
        <div className="admin-table">
          {sub.subsystems.map((s) => (
            <SubsystemRow key={s.id} subsystem={s} onDelete={sub.onDeleteSubsystem} />
          ))}
        </div>
      ) : (
        <div className="diff-empty">No subsystems</div>
      )}
      {sub.showCreateSub ? (
        <CreateForm
          name={sub.newSubName}
          desc={sub.newSubDesc}
          onNameChange={(e) => sub.setNewSubName(e.target.value)}
          onDescChange={(e) => sub.setNewSubDesc(e.target.value)}
          onSubmit={sub.onCreateSub}
          onCancel={() => sub.setShowCreateSub(false)}
        />
      ) : (
        <button
          type="button"
          className="ghost admin-new-project-btn"
          onClick={() => sub.setShowCreateSub(true)}
        >
          + New Subsystem
        </button>
      )}
    </div>
  );
}

export default function AdminProjectsTab({ proj, sub }) {
  return (
    <section className="admin-section">
      <ProjectList
        projects={proj.projects}
        roles={proj.roles}
        onDeleteProject={proj.onDeleteProject}
      />
      {proj.showCreate ? (
        <CreateForm
          name={proj.newProjName}
          desc={proj.newProjDesc}
          onNameChange={(e) => proj.setNewProjName(e.target.value)}
          onDescChange={(e) => proj.setNewProjDesc(e.target.value)}
          onSubmit={proj.onCreateProject}
          onCancel={() => proj.setShowCreate(false)}
        />
      ) : (
        <button
          type="button"
          className="ghost admin-new-project-btn"
          onClick={() => proj.setShowCreate(true)}
        >
          + New Project
        </button>
      )}
      {sub.activeProject && <SubsystemsSection sub={sub} />}
    </section>
  );
}
