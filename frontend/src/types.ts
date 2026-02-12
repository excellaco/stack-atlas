// --- Catalog domain ---

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface RawItem {
  id: string;
  name: string;
  category: string;
  type: string;
  tags?: string[];
  synonyms?: string[];
  parents?: string[];
  commonWith?: string[];
}

export interface EnrichedItem extends RawItem {
  description?: string;
  tags: string[];
}

// --- Project domain ---

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  canEdit?: boolean;
}

export interface Subsystem {
  id: string;
  projectId: string;
  name: string;
  description: string;
  additions: string[];
  exclusions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubsystemDraftData {
  name: string;
  additions: string[];
  exclusions: string[];
}

export interface Stack {
  items: string[];
  providers?: string[];
  updatedAt: string;
  updatedBy: string;
}

// --- Draft/Commit domain ---

export interface Draft {
  stack: { items: string[]; providers?: string[] };
  subsystems: Record<string, SubsystemDraftData>;
  lockedBy: string;
  lockedAt: string;
  updatedAt: string;
}

export interface CommitSnapshot {
  stack: string[];
  providers: string[];
  subsystems: Record<string, { name: string; additions: string[]; exclusions: string[] }>;
}

export interface Commit {
  id: string;
  message: string;
  author: string;
  authorSub: string;
  timestamp: string;
  snapshot: CommitSnapshot;
  projectId?: string;
  projectName?: string;
}

// --- Auth domain ---

export interface User {
  sub: string;
  email: string;
  groups: string[];
}

// --- Roles domain ---

export interface RoleEntry {
  sub: string;
  email: string;
}

export interface Roles {
  admins: RoleEntry[];
  editors: Record<string, RoleEntry[]>;
}

// --- Catalog (full) ---

export interface Catalog {
  categories: Category[];
  types: string[];
  items: RawItem[];
  descriptions: Record<string, string>;
}

// --- UI domain ---

export type DraftStatus = "idle" | "saving" | "saved";
export type ViewMode = "hierarchy" | "flat";
export type Density = "compact" | "comfortable";
export type ExportFormat = "markdown" | "json";

// --- Confirm dialog ---

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "warning" | "danger";
}

export interface ConfirmDialog extends ConfirmConfig {
  resolve: (value: boolean) => void;
}

// --- Pending changes ---

export interface PendingChanges {
  itemsAdded: string[];
  itemsRemoved: string[];
  providersAdded: string[];
  providersRemoved: string[];
}

// --- Tree ---

export interface TreeNode {
  item: EnrichedItem;
  children: TreeNode[];
}

export interface FlattenedNode {
  item: EnrichedItem;
  depth: number;
}

// --- Section (filtered category with items) ---

export interface Section extends Category {
  items: FlattenedNode[];
}

// --- Project view ---

export interface ProjectViewData {
  project: Project;
  stack: Stack;
  subsystems: Subsystem[];
  commits: Commit[];
}
