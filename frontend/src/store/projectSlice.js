import * as api from "../api";

// --- Extracted standalone functions ---

function buildCleanProjectState() {
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

function buildSubsystemState(subs) {
  const subState = {};
  for (const s of subs) {
    subState[s.id] = {
      name: s.name,
      additions: s.additions || [],
      exclusions: s.exclusions || [],
    };
  }
  return subState;
}

function applySubsystemOverlay(committedItems, subData) {
  const parentSet = new Set(committedItems);
  (subData.exclusions || []).forEach((id) => parentSet.delete(id));
  (subData.additions || []).forEach((id) => parentSet.add(id));
  return Array.from(parentSet);
}

async function doLoadProjects(set, get) {
  const { token } = get();
  if (!token) {
    set({ projects: [], activeProject: null, subsystems: [], activeSubsystem: null });
    return;
  }
  try {
    const list = await api.listProjects(token);
    set({ projects: list });
    const savedProjectId = localStorage.getItem("sa_activeProject");
    if (savedProjectId) {
      const project = list.find((p) => p.id === savedProjectId);
      if (project) {
        set({ activeProject: project });
        get().loadProject(savedProjectId);
      }
    }
  } catch {
    set({ projects: [] });
  }
}

function resolveRestoredSubsystem(subs, effectiveSubState, committedItems) {
  const savedSubId = localStorage.getItem("sa_activeSubsystem");
  const restoredSub = savedSubId ? subs.find((s) => s.id === savedSubId) : null;
  if (!restoredSub) return { activeSubsystem: null, effectiveItems: null };
  const subData = effectiveSubState[restoredSub.id] || restoredSub;
  return {
    activeSubsystem: restoredSub,
    effectiveItems: applySubsystemOverlay(committedItems, subData),
  };
}

async function tryLoadDraft(token, pid) {
  try {
    return await api.getDraft(token, pid);
  } catch (err) {
    if (err.message?.includes("423") || err.message?.includes("locked")) {
      console.warn("Project locked by another user");
    }
    return null;
  }
}

function resolveDraftOverrides(draftData, committedItems, committedProviders) {
  if (!draftData) return { items: committedItems, providers: committedProviders };
  const items = draftData.stack?.items || committedItems;
  const providers = draftData.stack?.providers || committedProviders;
  return { items, providers };
}

async function fetchProjectData(token, pid) {
  const stack = await api.getStack(token, pid);
  const committedItems = stack?.items || [];
  const committedProviders = stack?.providers || [];
  const subs = await api.listSubsystems(token, pid);
  const subState = buildSubsystemState(subs);
  return { committedItems, committedProviders, subs, subState };
}

function buildLoadedProjectState(data, draftData, restored, effectiveItems, baseProviders) {
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

async function doLoadProject(set, get, projectIdOverride) {
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
  } catch (err) {
    console.error("Failed to load stack:", err);
  } finally {
    set({ _skipAutoSave: false });
  }
}

function doSelectProject(set, get, projectId) {
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
    hasDraft: false,
    draftStatus: "idle",
    draftSubsystems: {},
  });
  localStorage.setItem("sa_activeProject", projectId);
  localStorage.removeItem("sa_activeSubsystem");
  if (project) get().loadProject(projectId);
}

function doSelectSubsystem(set, get, subId) {
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

async function doDeleteProject(set, get, projectId) {
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

export const createProjectSlice = (set, get) => ({
  projects: [],
  activeProject: null,
  subsystems: [],
  activeSubsystem: null,

  loadProjects: () => doLoadProjects(set, get),
  selectProject: (projectId) => doSelectProject(set, get, projectId),
  loadProject: (id) => doLoadProject(set, get, id),
  selectSubsystem: (subId) => doSelectSubsystem(set, get, subId),

  createProject: async (name, description) => {
    const { token } = get();
    if (!token) return;
    const project = await api.createProject(token, { name, description });
    set((s) => ({ projects: [...s.projects, project], activeProject: project }));
    get().loadProject(project.id);
  },

  deleteProject: (projectId) => doDeleteProject(set, get, projectId),

  createSubsystem: async (name, description) => {
    const { token, activeProject } = get();
    if (!token || !activeProject) return;
    const sub = await api.createSubsystem(token, activeProject.id, { name, description });
    set((s) => ({ subsystems: [...s.subsystems, sub], activeSubsystem: sub }));
  },

  deleteSubsystem: async (subId) => {
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
