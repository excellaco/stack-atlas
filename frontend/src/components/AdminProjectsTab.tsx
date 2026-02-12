import type { FormEvent } from "react";
import { useStore } from "../store";
import type { Project, Subsystem, Roles } from "../types";

interface ProjectRowProps {
  project: Project;
  editorCount: number;
  onDelete: (projectId: string) => void;
}

function ProjectRow({
  project,
  editorCount,
  onDelete,
}: Readonly<ProjectRowProps>): React.JSX.Element {
  const handleDelete = async (): Promise<void> => {
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
      <button
        type="button"
        className="ghost danger"
        onClick={() => {
          void handleDelete();
        }}
      >
        Delete
      </button>
    </div>
  );
}

interface CreateFormProps {
  name: string;
  desc: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

function CreateForm({
  name,
  desc,
  onNameChange,
  onDescChange,
  onSubmit,
  onCancel,
}: Readonly<CreateFormProps>): React.JSX.Element {
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

interface SubsystemRowProps {
  subsystem: Subsystem;
  onDelete: (subId: string) => void;
}

function SubsystemRow({ subsystem, onDelete }: Readonly<SubsystemRowProps>): React.JSX.Element {
  const handleDelete = async (): Promise<void> => {
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
      <button
        type="button"
        className="ghost danger"
        onClick={() => {
          void handleDelete();
        }}
      >
        Delete
      </button>
    </div>
  );
}

interface ProjectListProps {
  projects: Project[];
  roles: Roles | null;
  onDeleteProject: (projectId: string) => void;
}

function ProjectList({
  projects,
  roles,
  onDeleteProject,
}: Readonly<ProjectListProps>): React.JSX.Element {
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

interface SubsystemsSectionSub {
  activeProject: Project;
  subsystems: Subsystem[];
  showCreateSub: boolean;
  setShowCreateSub: React.Dispatch<React.SetStateAction<boolean>>;
  newSubName: string;
  setNewSubName: React.Dispatch<React.SetStateAction<string>>;
  newSubDesc: string;
  setNewSubDesc: React.Dispatch<React.SetStateAction<string>>;
  onCreateSub: (e: FormEvent<HTMLFormElement>) => void;
  onDeleteSubsystem: (subId: string) => void;
}

function SubsystemsSection({ sub }: Readonly<{ sub: SubsystemsSectionSub }>): React.JSX.Element {
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
          onNameChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            sub.setNewSubName(e.target.value)
          }
          onDescChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            sub.setNewSubDesc(e.target.value)
          }
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

interface ProjProps {
  projects: Project[];
  roles: Roles | null;
  showCreate: boolean;
  setShowCreate: React.Dispatch<React.SetStateAction<boolean>>;
  newProjName: string;
  setNewProjName: React.Dispatch<React.SetStateAction<string>>;
  newProjDesc: string;
  setNewProjDesc: React.Dispatch<React.SetStateAction<string>>;
  onCreateProject: (e: FormEvent<HTMLFormElement>) => void;
  onDeleteProject: (projectId: string) => void;
}

interface SubProps {
  activeProject: Project | null;
  subsystems: Subsystem[];
  showCreateSub: boolean;
  setShowCreateSub: React.Dispatch<React.SetStateAction<boolean>>;
  newSubName: string;
  setNewSubName: React.Dispatch<React.SetStateAction<string>>;
  newSubDesc: string;
  setNewSubDesc: React.Dispatch<React.SetStateAction<string>>;
  onCreateSub: (e: FormEvent<HTMLFormElement>) => void;
  onDeleteSubsystem: (subId: string) => void;
}

interface Props {
  proj: ProjProps;
  sub: SubProps;
}

export default function AdminProjectsTab({ proj, sub }: Readonly<Props>): React.JSX.Element {
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
          onNameChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            proj.setNewProjName(e.target.value)
          }
          onDescChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            proj.setNewProjDesc(e.target.value)
          }
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
      {sub.activeProject && <SubsystemsSection sub={sub as SubsystemsSectionSub} />}
    </section>
  );
}
