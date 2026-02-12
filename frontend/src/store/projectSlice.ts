// ProjectSlice handles project CRUD, subsystem management, and stack loading.
//
// Project loading workflow (loadProject):
//   1. Fetch committed stack + subsystems from API (fetchProjectData)
//   2. Try loading the user's draft (tryLoadDraft — 423 means another user holds the lock)
//   3. Merge: if a draft exists, its items/providers override the committed values
//   4. Restore active subsystem from localStorage if it still exists
//   5. If in a subsystem, compute effective items via applySubsystemOverlay
//
// The _skipAutoSave flag is set during loadProject and selectSubsystem because
// these operations change selectedItems programmatically — without the flag,
// the auto-save subscription would immediately save stale intermediate state.
//
// localStorage persistence:
//   sa_activeProject / sa_activeSubsystem are saved on selection so that
//   refreshing the page restores the user's context. loadProjects() reads
//   sa_activeProject on boot and triggers loadProject if the project still exists.
import * as api from "../api";
import type { Draft, DraftStatus, Project, Subsystem, SubsystemDraftData } from "../types";
import type { ProjectSlice, StoreSet, StoreGet, StoreState } from "./types";

// --- Extracted standalone functions ---

interface CleanProjectState {
  activeProject: null;
  activeSubsystem: null;
  savedStack: null;
  savedProviders: string[];
  selectedProviders: string[];
  selectedItems: string[];
  lastSavedItems: null;
  lastSavedProviders: string[];
  hasDraft: false;
  draftStatus: DraftStatus;
  draftSubsystems: Record<string, SubsystemDraftData>;
  _autoSaveTimerId: null;
}

function buildCleanProjectState(): CleanProjectState {
  return {
    activeProject: null,
    activeSubsystem: null,
    savedStack: null,
    savedProviders: [],
    selectedProviders: [],
    selectedItems: [],
    lastSavedItems: null,
    lastSavedProviders: [],
    hasDraft: false,
    draftStatus: "idle",
    draftSubsystems: {},
    _autoSaveTimerId: null,
  };
}

function buildSubsystemState(subs: Subsystem[]): Record<string, SubsystemDraftData> {
  const subState: Record<string, SubsystemDraftData> = {};
  for (const s of subs) {
    subState[s.id] = {
      name: s.name,
      additions: s.additions || [],
      exclusions: s.exclusions || [],
    };
  }
  return subState;
}

function applySubsystemOverlay(
  committedItems: string[],
  subData: { additions?: string[]; exclusions?: string[] }
): string[] {
  const parentSet = new Set(committedItems);
  (subData.exclusions || []).forEach((id) => parentSet.delete(id));
  (subData.additions || []).forEach((id) => parentSet.add(id));
  return Array.from(parentSet);
}

async function doLoadProjects(set: StoreSet, get: StoreGet): Promise<void> {
  const { token } = get();
  if (!token) {
    set({ projects: [], activeProject: null, subsystems: [], activeSubsystem: null });
    return;
  }
  try {
    const list: Project[] = await api.listProjects(token);
    set({ projects: list });
    const savedProjectId = localStorage.getItem("sa_activeProject");
    if (savedProjectId) {
      const project = list.find((p) => p.id === savedProjectId);
      if (project) {
        set({ activeProject: project });
        void get().loadProject(savedProjectId);
      }
    }
  } catch {
    set({ projects: [] });
  }
}

function resolveRestoredSubsystem(
  subs: Subsystem[],
  effectiveSubState: Record<string, SubsystemDraftData>,
  committedItems: string[]
): { activeSubsystem: Subsystem | null; effectiveItems: string[] | null } {
  const savedSubId = localStorage.getItem("sa_activeSubsystem");
  const restoredSub = savedSubId ? subs.find((s) => s.id === savedSubId) : null;
  if (!restoredSub) return { activeSubsystem: null, effectiveItems: null };
  const subData = effectiveSubState[restoredSub.id] || restoredSub;
  return {
    activeSubsystem: restoredSub,
    effectiveItems: applySubsystemOverlay(committedItems, subData),
  };
}

async function tryLoadDraft(token: string, pid: string): Promise<Draft | null> {
  try {
    return await api.getDraft(token, pid);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("423") || message.includes("locked")) {
      console.warn("Project locked by another user");
    }
    return null;
  }
}

function resolveDraftOverrides(
  draftData: Draft | null,
  committedItems: string[],
  committedProviders: string[]
): { items: string[]; providers: string[] } {
  if (!draftData) return { items: committedItems, providers: committedProviders };
  const items = Array.isArray(draftData.stack?.items) ? draftData.stack.items : committedItems;
  const providers = Array.isArray(draftData.stack?.providers)
    ? draftData.stack.providers
    : committedProviders;
  return { items, providers };
}

interface FetchedProjectData {
  committedItems: string[];
  committedProviders: string[];
  subs: Subsystem[];
  subState: Record<string, SubsystemDraftData>;
}

async function fetchProjectData(token: string, pid: string): Promise<FetchedProjectData> {
  const stack = await api.getStack(token, pid);
  const committedItems: string[] = stack?.items || [];
  const committedProviders: string[] = stack?.providers || [];
  const subs: Subsystem[] = await api.listSubsystems(token, pid);
  const subState = buildSubsystemState(subs);
  return { committedItems, committedProviders, subs, subState };
}

function buildLoadedProjectState(
  data: FetchedProjectData,
  draftData: Draft | null,
  restored: { activeSubsystem: Subsystem | null; effectiveItems: string[] | null },
  effectiveItems: string[],
  baseProviders: string[]
): Partial<StoreState> {
  return {
    subsystems: data.subs,
    activeSubsystem: restored.activeSubsystem,
    savedStack: data.committedItems,
    savedProviders: data.committedProviders,
    selectedItems: effectiveItems,
    selectedProviders: baseProviders,
    lastSavedItems: [...effectiveItems],
    lastSavedProviders: [...baseProviders],
    draftSubsystems: draftData?.subsystems || data.subState,
    hasDraft: !!draftData,
    draftStatus: draftData ? "saved" : "idle",
  };
}

async function doLoadProject(
  set: StoreSet,
  get: StoreGet,
  projectIdOverride?: string
): Promise<void> {
  const { token, activeProject } = get();
  const pid = projectIdOverride || activeProject?.id;
  if (!token || !pid) return;
  set({ _skipAutoSave: true });
  try {
    const data = await fetchProjectData(token, pid);
    const draftData = await tryLoadDraft(token, pid);
    const effectiveSubState = draftData?.subsystems || data.subState;
    const base = resolveDraftOverrides(draftData, data.committedItems, data.committedProviders);
    const restored = resolveRestoredSubsystem(data.subs, effectiveSubState, data.committedItems);
    const effectiveItems = restored.effectiveItems || base.items;
    set(buildLoadedProjectState(data, draftData, restored, effectiveItems, base.providers));
  } catch (err: unknown) {
    console.error("Failed to load stack:", err);
  } finally {
    set({ _skipAutoSave: false });
  }
}

function doSelectProject(set: StoreSet, get: StoreGet, projectId: string | null): void {
  const { projects, _autoSaveTimerId } = get();
  if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId);
  if (!projectId) {
    set(buildCleanProjectState());
    localStorage.removeItem("sa_activeProject");
    localStorage.removeItem("sa_activeSubsystem");
    return;
  }
  const project = projects.find((p) => p.id === projectId);
  set({
    activeProject: project || null,
    activeSubsystem: null,
    savedStack: null,
    savedProviders: [],
    selectedItems: [],
    selectedProviders: [],
    lastSavedItems: null,
    lastSavedProviders: [],
    subsystems: [],
    hasDraft: false,
    draftStatus: "idle",
    draftSubsystems: {},
  });
  localStorage.setItem("sa_activeProject", projectId);
  localStorage.removeItem("sa_activeSubsystem");
  if (project) void get().loadProject(projectId);
}

function doSelectSubsystem(set: StoreSet, get: StoreGet, subId: string | null): void {
  const { subsystems, draftSubsystems, savedStack } = get();
  set({ _skipAutoSave: true });
  try {
    if (!subId) {
      set({ activeSubsystem: null });
      localStorage.removeItem("sa_activeSubsystem");
      if (savedStack) {
        set({ selectedItems: [...savedStack], lastSavedItems: [...savedStack] });
      }
      return;
    }
    const sub = subsystems.find((s) => s.id === subId);
    set({ activeSubsystem: sub || null });
    localStorage.setItem("sa_activeSubsystem", subId);
    const subData = draftSubsystems[subId] || sub;
    if (subData && savedStack) {
      const items = applySubsystemOverlay(savedStack, subData);
      set({ selectedItems: items, lastSavedItems: [...items] });
    }
  } finally {
    set({ _skipAutoSave: false });
  }
}

async function doDeleteProject(set: StoreSet, get: StoreGet, projectId: string): Promise<void> {
  const { token, activeProject, _autoSaveTimerId } = get();
  if (!token) return;
  await api.deleteProject(token, projectId);
  set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
  if (activeProject?.id === projectId) {
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId);
    set(buildCleanProjectState());
  }
}

// --- Slice creator (thin action wrappers) ---

export const createProjectSlice = (set: StoreSet, get: StoreGet): ProjectSlice => ({
  projects: [],
  activeProject: null,
  subsystems: [],
  activeSubsystem: null,

  loadProjects: (): Promise<void> => doLoadProjects(set, get),
  selectProject: (projectId: string | null): void => doSelectProject(set, get, projectId),
  loadProject: (id?: string): Promise<void> => doLoadProject(set, get, id),
  selectSubsystem: (subId: string | null): void => doSelectSubsystem(set, get, subId),

  createProject: async (name: string, description: string): Promise<void> => {
    const { token } = get();
    if (!token) return;
    const project: Project = await api.createProject(token, { name, description });
    set((s) => ({ projects: [...s.projects, project], activeProject: project }));
    void get().loadProject(project.id);
  },

  deleteProject: (projectId: string): Promise<void> => doDeleteProject(set, get, projectId),

  createSubsystem: async (name: string, description: string): Promise<void> => {
    const { token, activeProject } = get();
    if (!token || !activeProject) return;
    const sub: Subsystem = await api.createSubsystem(token, activeProject.id, {
      name,
      description,
    });
    set((s) => ({ subsystems: [...s.subsystems, sub], activeSubsystem: sub }));
  },

  deleteSubsystem: async (subId: string): Promise<void> => {
    const { token, activeProject, activeSubsystem, savedStack } = get();
    if (!token || !activeProject) return;
    await api.deleteSubsystemApi(token, activeProject.id, subId);
    set((s) => ({ subsystems: s.subsystems.filter((s2) => s2.id !== subId) }));
    if (activeSubsystem?.id === subId) {
      set({ activeSubsystem: null });
      if (savedStack) set({ selectedItems: [...savedStack] });
    }
  },
});
