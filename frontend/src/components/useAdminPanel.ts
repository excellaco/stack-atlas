import { FormEvent, useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { selectCatalogItems, selectItemsById } from "../store/selectors";
import * as api from "../api";
import useAdminRoles from "./useAdminRoles";
import type { AdminRolesState } from "./useAdminRoles";
import useAdminCatalog from "./useAdminCatalog";
import type { AdminCatalogReturn } from "./useAdminCatalog";
import type { Commit, EnrichedItem, Project, Subsystem, RoleEntry } from "../types";

interface LockRecord {
  projectId: string;
  userSub: string;
  lockedAt: string;
}

function useEditorActions(
  roleState: AdminRolesState,
  newEditorProject: string
): {
  addEditor: (user: RoleEntry) => void;
  removeEditor: (projectId: string, sub: string) => void;
} {
  const addEditor = (user: RoleEntry): void => {
    if (!newEditorProject || !roleState.roles) return;
    const editors = { ...roleState.roles.editors };
    const list = editors[newEditorProject] || [];
    if (list.some((e) => e.sub === user.sub)) return;
    editors[newEditorProject] = [...list, user];
    void roleState.save({ ...roleState.roles, editors });
  };

  const removeEditor = (projectId: string, sub: string): void => {
    if (!roleState.roles) return;
    const editors = { ...roleState.roles.editors };
    editors[projectId] = (editors[projectId] || []).filter((e) => e.sub !== sub);
    if (!editors[projectId]?.length) delete editors[projectId];
    void roleState.save({ ...roleState.roles, editors });
  };

  return { addEditor, removeEditor };
}

function useTabData(
  tab: string,
  token: string | null
): {
  locks: LockRecord[];
  setLocks: React.Dispatch<React.SetStateAction<LockRecord[]>>;
  activity: Commit[];
} {
  const [locks, setLocks] = useState<LockRecord[]>([]);
  const [activity, setActivity] = useState<Commit[]>([]);

  useEffect(() => {
    if (!token) return;
    if (tab === "locks") {
      api
        .listLocks(token)
        .then((data) => setLocks(data as unknown as LockRecord[]))
        .catch(() => setLocks([]));
    }
    if (tab === "activity") {
      api
        .getActivity(token)
        .then((data) => setActivity(data as unknown as Commit[]))
        .catch(() => setActivity([]));
    }
  }, [tab, token]);

  return { locks, setLocks, activity };
}

interface ProjectActionsReturn {
  showCreate: boolean;
  setShowCreate: React.Dispatch<React.SetStateAction<boolean>>;
  newProjName: string;
  setNewProjName: React.Dispatch<React.SetStateAction<string>>;
  newProjDesc: string;
  setNewProjDesc: React.Dispatch<React.SetStateAction<string>>;
  showCreateSub: boolean;
  setShowCreateSub: React.Dispatch<React.SetStateAction<boolean>>;
  newSubName: string;
  setNewSubName: React.Dispatch<React.SetStateAction<string>>;
  newSubDesc: string;
  setNewSubDesc: React.Dispatch<React.SetStateAction<string>>;
  handleCreateProject: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handleCreateSub: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}

function useProjectActions(
  storeCreateProject: (name: string, description: string) => Promise<void>,
  storeCreateSubsystem: (name: string, description: string) => Promise<void>
): ProjectActionsReturn {
  const [showCreate, setShowCreate] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");

  const handleCreateProject = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    await storeCreateProject(newProjName.trim(), newProjDesc.trim());
    setNewProjName("");
    setNewProjDesc("");
    setShowCreate(false);
  };

  const handleCreateSub = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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

function useLockActions(
  token: string | null,
  setLocks: React.Dispatch<React.SetStateAction<LockRecord[]>>
): (projectId: string, userSub: string) => Promise<void> {
  return async (projectId: string, userSub: string): Promise<void> => {
    const ok = await useStore.getState().requestConfirm({
      title: "Break Lock",
      message: "Break this lock? The user's draft will be discarded.",
      confirmLabel: "Break Lock",
      variant: "warning",
    });
    if (!ok) return;
    await api.breakLock(token!, projectId, userSub);
    setLocks((prev) => prev.filter((l) => !(l.projectId === projectId && l.userSub === userSub)));
  };
}

function downloadCatalog(catalog: AdminCatalogReturn): void {
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

function useToggleSet(): [Set<string>, (id: string) => void] {
  const [set, setSet] = useState<Set<string>>(new Set());
  const toggle = (id: string): void => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return [set, toggle];
}

export interface AdminPanelReturn extends ProjectActionsReturn {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  roleState: AdminRolesState;
  catalog: AdminCatalogReturn;
  itemsById: Map<string, EnrichedItem>;
  projects: Project[];
  activeProject: Project | null;
  subsystems: Subsystem[];
  locks: LockRecord[];
  activity: Commit[];
  expandedCommits: Set<string>;
  toggleCommitExpand: (id: string) => void;
  newEditorProject: string;
  setNewEditorProject: React.Dispatch<React.SetStateAction<string>>;
  addEditor: (user: RoleEntry) => void;
  removeEditor: (projectId: string, sub: string) => void;
  handleBreakLock: (projectId: string, userSub: string) => Promise<void>;
  handleDownloadCatalog: () => void;
  storeDeleteProject: (projectId: string) => Promise<void>;
  storeDeleteSubsystem: (subId: string) => Promise<void>;
}

export default function useAdminPanel(): AdminPanelReturn {
  const store = useAdminStore();
  const { token } = store;

  const catalogItems = useMemo(
    () =>
      selectCatalogItems({
        catalogRawItems: store.catalogRawItems,
        catalogDescriptions: store.catalogDescriptions,
      } as Parameters<typeof selectCatalogItems>[0]),
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
