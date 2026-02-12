import UserPicker from "./UserPicker";
import type { Roles, RoleEntry, Project } from "../types";

interface UserRecord {
  email: string;
  name?: string;
}

interface RoleEntryRowProps {
  entry: RoleEntry;
  onRemove: (sub: string) => void;
}

function RoleEntryRow({ entry, onRemove }: Readonly<RoleEntryRowProps>): React.JSX.Element {
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

interface AdminsSectionProps {
  roles: Roles | null;
  users: Record<string, UserRecord> | null;
  onAddAdmin: (user: RoleEntry) => void;
  onRemoveAdmin: (sub: string) => void;
}

function AdminsSection({
  roles,
  users,
  onAddAdmin,
  onRemoveAdmin,
}: Readonly<AdminsSectionProps>): React.JSX.Element {
  return (
    <section className="admin-section">
      <h4>Admins</h4>
      <div className="admin-list">
        {roles?.admins.map((entry) => (
          <RoleEntryRow
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

interface EditorsSectionProps {
  roles: Roles | null;
  users: Record<string, UserRecord> | null;
  projects: Project[];
  newEditorProject: string;
  onSetNewEditorProject: (value: string) => void;
  onAddEditor: (user: RoleEntry) => void;
  onRemoveEditor: (projectId: string, sub: string) => void;
}

function EditorsSection({
  roles,
  users,
  projects,
  newEditorProject,
  onSetNewEditorProject,
  onAddEditor,
  onRemoveEditor,
}: Readonly<EditorsSectionProps>): React.JSX.Element {
  return (
    <section className="admin-section">
      <h4>Project Editors</h4>
      {roles &&
        Object.entries(roles.editors).map(([projectId, entries]) => (
          <div key={projectId} className="admin-project-group">
            <div className="admin-project-name">{projectId}</div>
            {entries.map((entry) => (
              <RoleEntryRow
                key={typeof entry === "string" ? entry : entry.sub}
                entry={entry}
                onRemove={(sub: string) => onRemoveEditor(projectId, sub)}
              />
            ))}
          </div>
        ))}
      <div className="admin-add-row">
        <select
          value={newEditorProject}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onSetNewEditorProject(e.target.value)
          }
        >
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

interface Props {
  roles: Roles | null;
  users: Record<string, UserRecord> | null;
  projects: Project[];
  newEditorProject: string;
  onSetNewEditorProject: (value: string) => void;
  onAddAdmin: (user: RoleEntry) => void;
  onRemoveAdmin: (sub: string) => void;
  onAddEditor: (user: RoleEntry) => void;
  onRemoveEditor: (projectId: string, sub: string) => void;
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
}: Readonly<Props>): React.JSX.Element {
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
