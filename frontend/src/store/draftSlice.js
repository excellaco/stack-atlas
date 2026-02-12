import * as api from "../api";
import { toggleInList } from "../utils/search";

// --- Extracted standalone functions ---

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

function computeCurrentSubState(get) {
  const { activeSubsystem, selectedItems, savedStack, draftSubsystems } = get();
  const currentSubState = { ...draftSubsystems };
  if (activeSubsystem) {
    const parentItems = savedStack || [];
    const parentSet = new Set(parentItems);
    const currentSet = new Set(selectedItems);
    currentSubState[activeSubsystem.id] = {
      name: activeSubsystem.name,
      additions: selectedItems.filter((id) => !parentSet.has(id)),
      exclusions: parentItems.filter((id) => !currentSet.has(id)),
    };
  }
  return currentSubState;
}

async function doPerformAutoSave(set, get) {
  const {
    token,
    activeProject,
    _skipAutoSave,
    activeSubsystem,
    selectedItems,
    selectedProviders,
    savedStack,
  } = get();
  if (!token || !activeProject || _skipAutoSave) return;
  set({ draftStatus: "saving" });
  try {
    const currentSubState = computeCurrentSubState(get);
    await api.saveDraft(token, activeProject.id, {
      stack: {
        items: activeSubsystem ? savedStack || [] : selectedItems,
        providers: selectedProviders,
      },
      subsystems: currentSubState,
    });
    set({
      hasDraft: true,
      draftStatus: "saved",
      draftSubsystems: currentSubState,
      lastSavedItems: [...selectedItems],
      lastSavedProviders: [...selectedProviders],
    });
  } catch (err) {
    console.error("Auto-save failed:", err);
    set({ draftStatus: "idle" });
  }
}

function applySubsystemOverlay(committedItems, subData) {
  const parentSet = new Set(committedItems);
  (subData.exclusions || []).forEach((id) => parentSet.delete(id));
  (subData.additions || []).forEach((id) => parentSet.add(id));
  return Array.from(parentSet);
}

async function refreshCommittedState(set, get) {
  const { token, activeProject } = get();
  const stack = await api.getStack(token, activeProject.id);
  const committedItems = stack?.items || [];
  const committedProviders = stack?.providers || [];
  const subs = await api.listSubsystems(token, activeProject.id);
  const subState = buildSubsystemState(subs);
  return { committedItems, committedProviders, subs, subState };
}

async function doCommit(set, get, message) {
  const { token, activeProject, _autoSaveTimerId } = get();
  if (!token || !activeProject) return;
  await get().performAutoSave();
  const commit = await api.commitChanges(token, activeProject.id, { message });
  if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId);
  set({ hasDraft: false, draftStatus: "idle", _skipAutoSave: true, _autoSaveTimerId: null });
  try {
    const { committedItems, committedProviders, subs, subState } = await refreshCommittedState(
      set,
      get
    );
    set({
      savedStack: committedItems,
      savedProviders: committedProviders,
      selectedItems: committedItems,
      selectedProviders: committedProviders,
      lastSavedItems: committedItems,
      lastSavedProviders: committedProviders,
      subsystems: subs,
      draftSubsystems: subState,
      activeSubsystem: null,
    });
  } finally {
    set({ _skipAutoSave: false });
  }
  set((s) => ({ commitVersion: s.commitVersion + 1 }));
  return commit;
}

function resolveDiscardItems(activeSubsystem, committedItems, subState, subs) {
  if (!activeSubsystem) {
    return { selectedItems: committedItems, lastSavedItems: committedItems };
  }
  const subData = subState[activeSubsystem.id] || subs.find((s) => s.id === activeSubsystem.id);
  if (!subData) {
    return { activeSubsystem: null, selectedItems: committedItems, lastSavedItems: committedItems };
  }
  const restoredItems = applySubsystemOverlay(committedItems, subData);
  return { selectedItems: restoredItems, lastSavedItems: restoredItems };
}

async function doDiscard(set, get) {
  const { token, activeProject, activeSubsystem, _autoSaveTimerId } = get();
  if (!token || !activeProject) return;
  await api.discardDraft(token, activeProject.id);
  if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId);
  set({ hasDraft: false, draftStatus: "idle", _skipAutoSave: true, _autoSaveTimerId: null });
  try {
    const { committedItems, committedProviders, subs, subState } = await refreshCommittedState(
      set,
      get
    );
    set({
      savedStack: committedItems,
      savedProviders: committedProviders,
      selectedProviders: committedProviders,
      lastSavedProviders: committedProviders,
      subsystems: subs,
      draftSubsystems: subState,
    });
    const itemUpdates = resolveDiscardItems(activeSubsystem, committedItems, subState, subs);
    set(itemUpdates);
  } finally {
    set({ _skipAutoSave: false });
  }
}

// --- Slice creator (thin action wrappers + state) ---

export const createDraftSlice = (set, get) => ({
  selectedItems: [],
  selectedProviders: [],
  savedStack: null,
  savedProviders: [],
  lastSavedItems: null,
  lastSavedProviders: [],
  hasDraft: false,
  draftStatus: "idle",
  draftSubsystems: {},
  commitVersion: 0,
  _autoSaveTimerId: null,
  _skipAutoSave: false,

  toggleItem: (id) => set((s) => ({ selectedItems: toggleInList(s.selectedItems, id) })),
  addItems: (ids) =>
    set((s) => ({ selectedItems: Array.from(new Set([...s.selectedItems, ...ids])) })),
  removeItem: (id) =>
    set((s) => ({ selectedItems: s.selectedItems.filter((item) => item !== id) })),
  clearSelection: () => set({ selectedItems: [] }),

  setSelectedProviders: (providers) => {
    if (typeof providers === "function") {
      set((s) => ({ selectedProviders: providers(s.selectedProviders) }));
    } else {
      set({ selectedProviders: providers });
    }
  },

  performAutoSave: () => doPerformAutoSave(set, get),
  commit: (message) => doCommit(set, get, message),
  discard: () => doDiscard(set, get),

  scheduleAutoSave: () => {
    const { _autoSaveTimerId } = get();
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId);
    const timerId = setTimeout(() => get().performAutoSave(), 2000);
    set({ _autoSaveTimerId: timerId });
  },
});
