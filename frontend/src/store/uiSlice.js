import { toggleInList } from "../utils/search";

// --- Helper for stateful setter pattern ---
const resolveSetter = (v, current) => (typeof v === "function" ? v(current) : v);

// --- Slice creator ---

export const createUiSlice = (set, get) => ({
  // Filter state
  query: "",
  selectedCategories: [],
  selectedTypes: [],
  selectedTags: [],
  isCategoriesOpen: false,
  isProvidersOpen: true,
  isTypesOpen: true,
  isTagsOpen: false,

  // View state
  viewMode: "hierarchy",
  density: "compact",
  collapsedCategories: new Set(),

  // Export state
  exportFormat: "markdown",
  isExportOpen: false,

  // Admin panel
  showAdmin: false,

  // Session expired overlay
  sessionExpired: false,

  // Confirm dialog
  confirmDialog: null,

  // Actions
  setQuery: (query) => set({ query }),
  toggleCategory: (id) =>
    set((s) => ({ selectedCategories: toggleInList(s.selectedCategories, id) })),
  toggleType: (type) => set((s) => ({ selectedTypes: toggleInList(s.selectedTypes, type) })),
  toggleTag: (tag) => set((s) => ({ selectedTags: toggleInList(s.selectedTags, tag) })),
  setIsCategoriesOpen: (v) => set({ isCategoriesOpen: resolveSetter(v, false) }),
  setIsProvidersOpen: (v) => set((s) => ({ isProvidersOpen: resolveSetter(v, s.isProvidersOpen) })),
  setIsTypesOpen: (v) => set((s) => ({ isTypesOpen: resolveSetter(v, s.isTypesOpen) })),
  setIsTagsOpen: (v) => set((s) => ({ isTagsOpen: resolveSetter(v, s.isTagsOpen) })),
  setViewMode: (viewMode) => set({ viewMode }),
  setDensity: (density) => set({ density }),
  toggleCategoryCollapse: (categoryId) =>
    set((s) => {
      const next = new Set(s.collapsedCategories);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return { collapsedCategories: next };
    }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setIsExportOpen: (v) => set((s) => ({ isExportOpen: resolveSetter(v, s.isExportOpen) })),
  setShowAdmin: (showAdmin) => set({ showAdmin }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  requestConfirm: (config) =>
    new Promise((resolve) => set({ confirmDialog: { ...config, resolve } })),
  resolveConfirm: (result) => {
    const { confirmDialog } = get();
    if (confirmDialog?.resolve) confirmDialog.resolve(result);
    set({ confirmDialog: null });
  },
  resetFilters: () =>
    set({ query: "", selectedCategories: [], selectedTypes: [], selectedTags: [] }),
});
