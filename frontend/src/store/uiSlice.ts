import { toggleInList } from "../utils/search";
import type { ConfirmConfig, Density, ExportFormat, ViewMode } from "../types";
import type { UiSlice, StoreSet, StoreGet } from "./types";

// --- Helper for stateful setter pattern ---
const resolveSetter = <T>(v: T | ((current: T) => T), current: T): T =>
  typeof v === "function" ? (v as (current: T) => T)(current) : v;

// --- Initial state ---

const UI_INITIAL_STATE = {
  query: "",
  selectedCategories: [] as string[],
  selectedTypes: [] as string[],
  selectedTags: [] as string[],
  isCategoriesOpen: false,
  isProvidersOpen: true,
  isTypesOpen: true,
  isTagsOpen: false,
  viewMode: "hierarchy" as const,
  density: "compact" as const,
  collapsedCategories: new Set<string>(),
  exportFormat: "markdown" as const,
  isExportOpen: false,
  showAdmin: false,
  sessionExpired: false,
  confirmDialog: null as UiSlice["confirmDialog"],
};

// --- Slice creator ---

export const createUiSlice = (set: StoreSet, get: StoreGet): UiSlice => ({
  ...UI_INITIAL_STATE,
  setQuery: (query: string): void => set({ query }),
  toggleCategory: (id: string): void =>
    set((s) => ({ selectedCategories: toggleInList(s.selectedCategories, id) })),
  toggleType: (type: string): void =>
    set((s) => ({ selectedTypes: toggleInList(s.selectedTypes, type) })),
  toggleTag: (tag: string): void =>
    set((s) => ({ selectedTags: toggleInList(s.selectedTags, tag) })),
  setIsCategoriesOpen: (v: boolean | ((prev: boolean) => boolean)): void =>
    set((s) => ({ isCategoriesOpen: resolveSetter(v, s.isCategoriesOpen) })),
  setIsProvidersOpen: (v: boolean | ((prev: boolean) => boolean)): void =>
    set((s) => ({ isProvidersOpen: resolveSetter(v, s.isProvidersOpen) })),
  setIsTypesOpen: (v: boolean | ((prev: boolean) => boolean)): void =>
    set((s) => ({ isTypesOpen: resolveSetter(v, s.isTypesOpen) })),
  setIsTagsOpen: (v: boolean | ((prev: boolean) => boolean)): void =>
    set((s) => ({ isTagsOpen: resolveSetter(v, s.isTagsOpen) })),
  setViewMode: (viewMode: ViewMode): void => set({ viewMode }),
  setDensity: (density: Density): void => set({ density }),
  toggleCategoryCollapse: (categoryId: string): void =>
    set((s) => {
      const next = new Set(s.collapsedCategories);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return { collapsedCategories: next };
    }),
  setExportFormat: (exportFormat: ExportFormat): void => set({ exportFormat }),
  setIsExportOpen: (v: boolean | ((prev: boolean) => boolean)): void =>
    set((s) => ({ isExportOpen: resolveSetter(v, s.isExportOpen) })),
  setShowAdmin: (showAdmin: boolean): void => set({ showAdmin }),
  setSessionExpired: (sessionExpired: boolean): void => set({ sessionExpired }),
  requestConfirm: (config: ConfirmConfig): Promise<boolean> =>
    new Promise<boolean>((resolve) => set({ confirmDialog: { ...config, resolve } })),
  resolveConfirm: (result: boolean): void => {
    const { confirmDialog } = get();
    if (confirmDialog?.resolve) confirmDialog.resolve(result);
    set({ confirmDialog: null });
  },
  resetFilters: (): void =>
    set({ query: "", selectedCategories: [], selectedTypes: [], selectedTags: [] }),
});
