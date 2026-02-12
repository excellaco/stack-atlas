import UserPicker from "./UserPicker";

function RoleEntry({ entry, onRemove }) {
  const email = typeof entry === "string" ? entry : entry.email;
  const sub = typeof entry === "string" ? entry : entry.sub;
  return (
    <div className="admin-list-item">
      <span className="admin-email">{email}</span>
      <button type="button" className="ghost danger" onClick={() => onRemove(sub)}>
        Remove
      </button>
    </div>
  );
}

function AdminsSection({ roles, users, onAddAdmin, onRemoveAdmin }) {
  return (
    <section className="admin-section">
      <h4>Admins</h4>
      <div className="admin-list">
        {roles?.admins.map((entry) => (
          <RoleEntry
            key={typeof entry === "string" ? entry : entry.sub}
            entry={entry}
            onRemove={onRemoveAdmin}
          />
        ))}
      </div>
      <UserPicker users={users} exclude={roles?.admins} onSelect={onAddAdmin} />
    </section>
  );
}

function EditorsSection({
  roles,
  users,
  projects,
  newEditorProject,
  onSetNewEditorProject,
  onAddEditor,
  onRemoveEditor,
}) {
  return (
    <section className="admin-section">
      <h4>Project Editors</h4>
      {roles &&
        Object.entries(roles.editors).map(([projectId, entries]) => (
          <div key={projectId} className="admin-project-group">
            <div className="admin-project-name">{projectId}</div>
            {entries.map((entry) => (
              <RoleEntry
                key={typeof entry === "string" ? entry : entry.sub}
                entry={entry}
                onRemove={(sub) => onRemoveEditor(projectId, sub)}
              />
            ))}
          </div>
        ))}
      <div className="admin-add-row">
        <select value={newEditorProject} onChange={(e) => onSetNewEditorProject(e.target.value)}>
          <option value="">Select project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {newEditorProject && (
          <UserPicker
            users={users}
            exclude={roles?.editors[newEditorProject]}
            onSelect={onAddEditor}
          />
        )}
      </div>
    </section>
  );
}

export default function AdminRolesTab({
  roles,
  users,
  projects,
  newEditorProject,
  onSetNewEditorProject,
  onAddAdmin,
  onRemoveAdmin,
  onAddEditor,
  onRemoveEditor,
}) {
  return (
    <>
      <AdminsSection
        roles={roles}
        users={users}
        onAddAdmin={onAddAdmin}
        onRemoveAdmin={onRemoveAdmin}
      />
      <EditorsSection
        roles={roles}
        users={users}
        projects={projects}
        newEditorProject={newEditorProject}
        onSetNewEditorProject={onSetNewEditorProject}
        onAddEditor={onAddEditor}
        onRemoveEditor={onRemoveEditor}
      />
    </>
  );
}
