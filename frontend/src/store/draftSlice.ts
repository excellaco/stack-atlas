import * as api from "../api";
import { toggleInList } from "../utils/search";
import type { Commit, Subsystem, SubsystemDraftData } from "../types";
import type { DraftSlice, StoreSet, StoreGet, StoreState } from "./types";

// --- Extracted standalone functions ---

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

function computeCurrentSubState(get: StoreGet): Record<string, SubsystemDraftData> {
  const { activeSubsystem, selectedItems, savedStack, draftSubsystems } = get();
  const currentSubState: Record<string, SubsystemDraftData> = { ...draftSubsystems };
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

async function doPerformAutoSave(set: StoreSet, get: StoreGet): Promise<void> {
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
  } catch (err: unknown) {
    console.error("Auto-save failed:", err);
    set({ draftStatus: "idle" });
  }
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

interface RefreshedState {
  committedItems: string[];
  committedProviders: string[];
  subs: Subsystem[];
  subState: Record<string, SubsystemDraftData>;
}

async function refreshCommittedState(_set: StoreSet, get: StoreGet): Promise<RefreshedState> {
  const { token, activeProject } = get();
  const stack = await api.getStack(token!, activeProject!.id);
  const committedItems: string[] = stack?.items || [];
  const committedProviders: string[] = stack?.providers || [];
  const subs: Subsystem[] = await api.listSubsystems(token!, activeProject!.id);
  const subState = buildSubsystemState(subs);
  return { committedItems, committedProviders, subs, subState };
}

async function doCommit(
  set: StoreSet,
  get: StoreGet,
  message: string
): Promise<Commit | undefined> {
  const { token, activeProject, _autoSaveTimerId } = get();
  if (!token || !activeProject) return;
  await get().performAutoSave();
  const commit: Commit = await api.commitChanges(token, activeProject.id, { message });
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

function resolveDiscardItems(
  activeSubsystem: StoreState["activeSubsystem"],
  committedItems: string[],
  subState: Record<string, SubsystemDraftData>,
  subs: Subsystem[]
): Partial<StoreState> {
  if (!activeSubsystem) {
    return { selectedItems: committedItems, lastSavedItems: committedItems };
  }
  const subData = subState[activeSubsystem.id] || subs.find((s) => s.id === activeSubsystem.id);
  if (!subData) {
    return {
      activeSubsystem: null,
      selectedItems: committedItems,
      lastSavedItems: committedItems,
    };
  }
  const restoredItems = applySubsystemOverlay(committedItems, subData);
  return { selectedItems: restoredItems, lastSavedItems: restoredItems };
}

async function doDiscard(set: StoreSet, get: StoreGet): Promise<void> {
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

export const createDraftSlice = (set: StoreSet, get: StoreGet): DraftSlice => ({
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

  toggleItem: (id: string): void =>
    set((s) => ({ selectedItems: toggleInList(s.selectedItems, id) })),
  addItems: (ids: string[]): void =>
    set((s) => ({ selectedItems: Array.from(new Set([...s.selectedItems, ...ids])) })),
  removeItem: (id: string): void =>
    set((s) => ({ selectedItems: s.selectedItems.filter((item) => item !== id) })),
  clearSelection: (): void => set({ selectedItems: [] }),

  setSelectedProviders: (providers: string[] | ((prev: string[]) => string[])): void => {
    if (typeof providers === "function") {
      set((s) => ({ selectedProviders: providers(s.selectedProviders) }));
    } else {
      set({ selectedProviders: providers });
    }
  },

  performAutoSave: (): Promise<void> => doPerformAutoSave(set, get),
  commit: (message: string): Promise<Commit | undefined> => doCommit(set, get, message),
  discard: (): Promise<void> => doDiscard(set, get),

  scheduleAutoSave: (): void => {
    const { _autoSaveTimerId } = get();
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId);
    const timerId = setTimeout(() => {
      void get().performAutoSave();
    }, 2000);
    set({ _autoSaveTimerId: timerId });
  },
});
