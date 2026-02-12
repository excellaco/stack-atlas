// Store type definitions. The store is split into 5 slices:
//
// AuthSlice     — Cognito session: sign in/out, token refresh, session restore
// CatalogSlice  — Technology catalog: categories, items, types (static or API)
// ProjectSlice  — Project CRUD, subsystem management, stack loading
// DraftSlice    — Editor state: selected items, auto-save, commit, discard
// UiSlice       — Filter state, view preferences, modals, admin panel toggle
//
// Slices can cross-reference each other via get() — e.g. DraftSlice reads
// activeProject from ProjectSlice. This is intentional and avoids prop drilling.
import type {
  Category,
  Catalog,
  Commit,
  ConfirmConfig,
  ConfirmDialog,
  Density,
  DraftStatus,
  ExportFormat,
  Project,
  RawItem,
  Subsystem,
  SubsystemDraftData,
  User,
  ViewMode,
} from "../types";

// --- Auth Slice ---
export interface AuthSlice {
  user: User | null;
  token: string | null;
  authLoading: boolean;
  restoreSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  startTokenRefresh: () => () => void;
}

// --- Catalog Slice ---
export interface CatalogSlice {
  catalogCategories: Category[];
  catalogTypes: string[];
  catalogRawItems: RawItem[];
  catalogDescriptions: Record<string, string>;
  catalogSource: "static" | "api";
  loadCatalog: () => Promise<void>;
  setCatalogFromPublish: (catalog: Catalog) => void;
}

// --- Project Slice ---
export interface ProjectSlice {
  projects: Project[];
  activeProject: Project | null;
  subsystems: Subsystem[];
  activeSubsystem: Subsystem | null;
  loadProjects: () => Promise<void>;
  selectProject: (projectId: string | null) => void;
  loadProject: (id?: string) => Promise<void>;
  selectSubsystem: (subId: string | null) => void;
  createProject: (name: string, description: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  createSubsystem: (name: string, description: string) => Promise<void>;
  deleteSubsystem: (subId: string) => Promise<void>;
}

// --- Draft Slice ---
export interface DraftSlice {
  selectedItems: string[];
  selectedProviders: string[];
  savedStack: string[] | null;
  savedProviders: string[];
  lastSavedItems: string[] | null;
  lastSavedProviders: string[];
  hasDraft: boolean;
  draftStatus: DraftStatus;
  draftSubsystems: Record<string, SubsystemDraftData>;
  commitVersion: number;
  _autoSaveTimerId: ReturnType<typeof setTimeout> | null;
  _skipAutoSave: boolean;
  toggleItem: (id: string) => void;
  addItems: (ids: string[]) => void;
  removeItem: (id: string) => void;
  clearSelection: () => void;
  setSelectedProviders: (providers: string[] | ((prev: string[]) => string[])) => void;
  performAutoSave: () => Promise<void>;
  commit: (message: string) => Promise<Commit | undefined>;
  discard: () => Promise<void>;
  scheduleAutoSave: () => void;
}

// --- UI Slice ---
export interface UiSlice {
  query: string;
  selectedCategories: string[];
  selectedTypes: string[];
  selectedTags: string[];
  isCategoriesOpen: boolean;
  isProvidersOpen: boolean;
  isTypesOpen: boolean;
  isTagsOpen: boolean;
  viewMode: ViewMode;
  density: Density;
  collapsedCategories: Set<string>;
  exportFormat: ExportFormat;
  isExportOpen: boolean;
  showAdmin: boolean;
  sessionExpired: boolean;
  confirmDialog: ConfirmDialog | null;
  setQuery: (query: string) => void;
  toggleCategory: (id: string) => void;
  toggleType: (type: string) => void;
  toggleTag: (tag: string) => void;
  setIsCategoriesOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsProvidersOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsTypesOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsTagsOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setDensity: (density: Density) => void;
  toggleCategoryCollapse: (categoryId: string) => void;
  setExportFormat: (exportFormat: ExportFormat) => void;
  setIsExportOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowAdmin: (showAdmin: boolean) => void;
  setSessionExpired: (sessionExpired: boolean) => void;
  requestConfirm: (config: ConfirmConfig) => Promise<boolean>;
  resolveConfirm: (result: boolean) => void;
  resetFilters: () => void;
}

// --- Combined Store ---
export type StoreState = AuthSlice & CatalogSlice & ProjectSlice & DraftSlice & UiSlice;

// --- Slice creator helpers ---
export type StoreSet = {
  (partial: Partial<StoreState> | ((state: StoreState) => Partial<StoreState>)): void;
};
export type StoreGet = () => StoreState;
