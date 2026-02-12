import useAdminPanel from "./useAdminPanel";
import AdminRolesTab from "./AdminRolesTab";
import AdminCatalogTab from "./AdminCatalogTab";
import AdminProjectsTab from "./AdminProjectsTab";
import AdminLocksTab from "./AdminLocksTab";
import AdminActivityTab from "./AdminActivityTab";
import CategoryStyles from "./CategoryStyles";
import "./AdminPanel.css";

const TABS = [
  { id: "roles", label: "Roles" },
  { id: "catalog", label: "Catalog" },
  { id: "projects", label: "Projects" },
  { id: "locks", label: "Locks" },
  { id: "activity", label: "Activity" },
];

function AdminHeader({ onDownload, onClose }) {
  return (
    <div className="panel-header">
      <h3>Admin</h3>
      <div className="admin-header-actions">
        <button type="button" className="ghost" onClick={onDownload}>
          Download Catalog
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function AdminTabBar({ tab, setTab }) {
  return (
    <div className="admin-tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="admin-tab"
          data-active={tab === t.id || undefined}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function AdminTabContent({ state }) {
  const { tab } = state;
  if (tab === "roles") return <RolesTabWrapper state={state} />;
  if (tab === "catalog") return <CatalogTabWrapper state={state} />;
  if (tab === "projects") return <ProjectsTabWrapper state={state} />;
  if (tab === "locks")
    return <AdminLocksTab locks={state.locks} onBreakLock={state.handleBreakLock} />;
  if (tab === "activity") {
    return (
      <AdminActivityTab
        activity={state.activity}
        expandedCommits={state.expandedCommits}
        onToggleCommit={state.toggleCommitExpand}
        itemsById={state.itemsById}
      />
    );
  }
  return null;
}

function RolesTabWrapper({ state }) {
  return (
    <AdminRolesTab
      roles={state.roleState.roles}
      users={state.roleState.users}
      projects={state.projects}
      newEditorProject={state.newEditorProject}
      onSetNewEditorProject={state.setNewEditorProject}
      onAddAdmin={state.roleState.addAdmin}
      onRemoveAdmin={state.roleState.removeAdmin}
      onAddEditor={state.addEditor}
      onRemoveEditor={state.removeEditor}
    />
  );
}

function CatalogTabWrapper({ state }) {
  const { catalog, roleState } = state;
  return (
    <AdminCatalogTab
      catalog={catalog}
      saving={roleState.saving}
      onPublish={() => catalog.handlePublishCatalog(roleState.setSaving, roleState.setError)}
      onUpload={(e) => catalog.handleUploadCatalog(e, roleState.setError)}
      onSeedFromStatic={catalog.handleSeedFromStatic}
    />
  );
}

function ProjectsTabWrapper({ state }) {
  const proj = {
    projects: state.projects,
    roles: state.roleState.roles,
    showCreate: state.showCreate,
    setShowCreate: state.setShowCreate,
    newProjName: state.newProjName,
    setNewProjName: state.setNewProjName,
    newProjDesc: state.newProjDesc,
    setNewProjDesc: state.setNewProjDesc,
    onCreateProject: state.handleCreateProject,
    onDeleteProject: state.storeDeleteProject,
  };
  const sub = {
    activeProject: state.activeProject,
    subsystems: state.subsystems,
    showCreateSub: state.showCreateSub,
    setShowCreateSub: state.setShowCreateSub,
    newSubName: state.newSubName,
    setNewSubName: state.setNewSubName,
    newSubDesc: state.newSubDesc,
    setNewSubDesc: state.setNewSubDesc,
    onCreateSub: state.handleCreateSub,
    onDeleteSubsystem: state.storeDeleteSubsystem,
  };
  return <AdminProjectsTab proj={proj} sub={sub} />;
}

export default function AdminPanel() {
  const state = useAdminPanel();

  if (state.roleState.loading) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay" onClick={state.onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <CategoryStyles categories={state.catalog.editCategories} />
        <AdminHeader onDownload={state.handleDownloadCatalog} onClose={state.onClose} />
        <AdminTabBar tab={state.tab} setTab={state.setTab} />
        {state.roleState.error && <div className="auth-error">{state.roleState.error}</div>}
        <AdminTabContent state={state} />
        {state.roleState.saving && <p className="admin-saving">Saving...</p>}
      </div>
    </div>
  );
}
