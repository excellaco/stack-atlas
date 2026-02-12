import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { selectCatalogItems, selectItemsById } from "../store/selectors";
import * as api from "../api";
import useAdminRoles from "./useAdminRoles";
import useAdminCatalog from "./useAdminCatalog";

function useEditorActions(roleState, newEditorProject) {
  const addEditor = (user) => {
    if (!newEditorProject || !roleState.roles) return;
    const editors = { ...roleState.roles.editors };
    const list = editors[newEditorProject] || [];
    if (list.some((e) => e.sub === user.sub)) return;
    editors[newEditorProject] = [...list, user];
    roleState.save({ ...roleState.roles, editors });
  };

  const removeEditor = (projectId, sub) => {
    if (!roleState.roles) return;
    const editors = { ...roleState.roles.editors };
    editors[projectId] = (editors[projectId] || []).filter((e) => e.sub !== sub);
    if (!editors[projectId].length) delete editors[projectId];
    roleState.save({ ...roleState.roles, editors });
  };

  return { addEditor, removeEditor };
}

function useTabData(tab, token) {
  const [locks, setLocks] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (tab === "locks") {
      api
        .listLocks(token)
        .then(setLocks)
        .catch(() => setLocks([]));
    }
    if (tab === "activity") {
      api
        .getActivity(token)
        .then(setActivity)
        .catch(() => setActivity([]));
    }
  }, [tab, token]);

  return { locks, setLocks, activity };
}

function useProjectActions(storeCreateProject, storeCreateSubsystem) {
  const [showCreate, setShowCreate] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    await storeCreateProject(newProjName.trim(), newProjDesc.trim());
    setNewProjName("");
    setNewProjDesc("");
    setShowCreate(false);
  };

  const handleCreateSub = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    await storeCreateSubsystem(newSubName.trim(), newSubDesc.trim());
    setNewSubName("");
    setNewSubDesc("");
    setShowCreateSub(false);
  };

  return {
    showCreate,
    setShowCreate,
    newProjName,
    setNewProjName,
    newProjDesc,
    setNewProjDesc,
    showCreateSub,
    setShowCreateSub,
    newSubName,
    setNewSubName,
    newSubDesc,
    setNewSubDesc,
    handleCreateProject,
    handleCreateSub,
  };
}

function useLockActions(token, setLocks) {
  return async (projectId, userSub) => {
    const ok = await useStore.getState().requestConfirm({
      title: "Break Lock",
      message: "Break this lock? The user's draft will be discarded.",
      confirmLabel: "Break Lock",
      variant: "warning",
    });
    if (!ok) return;
    await api.breakLock(token, projectId, userSub);
    setLocks((prev) => prev.filter((l) => !(l.projectId === projectId && l.userSub === userSub)));
  };
}

function downloadCatalog(catalog) {
  const data = {
    categories: catalog.editCategories,
    types: catalog.editTypes,
    descriptions: catalog.editDescriptions,
    items: catalog.editItems,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stack-catalog.json";
  a.click();
  URL.revokeObjectURL(url);
}

function useAdminStore() {
  return {
    token: useStore((s) => s.token),
    projects: useStore((s) => s.projects),
    activeProject: useStore((s) => s.activeProject),
    subsystems: useStore((s) => s.subsystems),
    catalogRawItems: useStore((s) => s.catalogRawItems),
    catalogDescriptions: useStore((s) => s.catalogDescriptions),
    setShowAdmin: useStore((s) => s.setShowAdmin),
    storeDeleteProject: useStore((s) => s.deleteProject),
    storeDeleteSubsystem: useStore((s) => s.deleteSubsystem),
    storeCreateProject: useStore((s) => s.createProject),
    storeCreateSubsystem: useStore((s) => s.createSubsystem),
  };
}

function useToggleSet() {
  const [set, setSet] = useState(new Set());
  const toggle = (id) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return [set, toggle];
}

export default function useAdminPanel() {
  const store = useAdminStore();
  const { token } = store;

  const catalogItems = useMemo(
    () =>
      selectCatalogItems({
        catalogRawItems: store.catalogRawItems,
        catalogDescriptions: store.catalogDescriptions,
      }),
    [store.catalogRawItems, store.catalogDescriptions]
  );
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems]);

  const [tab, setTab] = useState("roles");
  const [expandedCommits, toggleCommitExpand] = useToggleSet();
  const [newEditorProject, setNewEditorProject] = useState("");

  const roleState = useAdminRoles(token);
  const catalog = useAdminCatalog();
  const { addEditor, removeEditor } = useEditorActions(roleState, newEditorProject);
  const { locks, setLocks, activity } = useTabData(tab, token);
  const projectActions = useProjectActions(store.storeCreateProject, store.storeCreateSubsystem);
  const handleBreakLock = useLockActions(token, setLocks);

  return {
    tab,
    setTab,
    onClose: () => store.setShowAdmin(false),
    roleState,
    catalog,
    itemsById,
    projects: store.projects,
    activeProject: store.activeProject,
    subsystems: store.subsystems,
    locks,
    activity,
    expandedCommits,
    toggleCommitExpand,
    newEditorProject,
    setNewEditorProject,
    addEditor,
    removeEditor,
    ...projectActions,
    handleBreakLock,
    handleDownloadCatalog: () => downloadCatalog(catalog),
    storeDeleteProject: store.storeDeleteProject,
    storeDeleteSubsystem: store.storeDeleteSubsystem,
  };
}
