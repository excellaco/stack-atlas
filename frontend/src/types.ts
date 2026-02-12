// =============================================================================
// Domain model for Stack Atlas.
//
// Key concepts:
//
// CATALOG — The master list of technologies/tools available for selection.
//   Categories group items (e.g. "DevOps", "Security"). Each item has a type
//   (Tool, Capability, Technique, etc.), tags for filtering (including cloud
//   provider tags: "aws", "azure", "gcp"), and optional parent relationships
//   for hierarchy view. The catalog can come from a static bundled file
//   (stackData.ts) or from the API (admin-published). API always wins if available.
//
// PROJECT — A team's technology stack. Contains a flat list of selected item IDs
//   and optional cloud provider selections. Projects support role-based access:
//   admins can do everything, editors can modify specific projects.
//
// SUBSYSTEM — A project variant (e.g. "Frontend", "Backend"). Subsystems inherit
//   the parent project's stack and express differences as additions (items added
//   on top of parent) and exclusions (parent items removed). This inheritance
//   model means subsystems stay in sync when the parent stack changes.
//
// DRAFT — Unsaved work. Drafts are auto-saved every 2 seconds and locked to
//   one user at a time (30-minute expiry). Committing a draft writes it to the
//   permanent stack and creates a commit log entry with a snapshot for diffing.
// =============================================================================

// --- Catalog domain ---

export interface Category {
  id: string;
  name: string;
  description: string;
  // Used for CSS custom properties: each category gets a colored accent.
  color: string;
}

// RawItem is what comes from the catalog data source (API or static file).
// It becomes EnrichedItem after joining with descriptions.
export interface RawItem {
  id: string;
  name: string;
  category: string;
  type: string;
  // Tags serve double duty: general labels ("open-source", "saas") AND cloud
  // provider affinity ("aws", "azure", "gcp"). The FilterPanel treats "aws",
  // "azure", "gcp" tags specially as the Cloud Provider filter.
  tags?: string[];
  synonyms?: string[];
  // Parent IDs for hierarchy view. An item can have multiple parents but only
  // the first one present in the current filtered set is used for tree display.
  parents?: string[];
  // Items commonly selected together — shown as "add" suggestions on the card.
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
  // Set by the backend based on the requesting user's role (admin or editor).
  canEdit?: boolean;
}

// Subsystems use an additions/exclusions model rather than storing a full item
// list. This means if the parent project adds "Docker", all subsystems that
// haven't explicitly excluded it will automatically include it.
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
// The draft/commit model is similar to git: users edit a draft (working copy),
// then commit it with a message. Each commit stores a full snapshot so we can
// diff any two commits without reconstructing state from deltas.

export interface Draft {
  stack: { items: string[]; providers?: string[] };
  subsystems: Record<string, SubsystemDraftData>;
  // Only one user can edit a project at a time. The lock prevents conflicts.
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
  // Full snapshot at commit time. Used by computeDiff() to show what changed.
  snapshot: CommitSnapshot;
  // Added client-side when displaying cross-project activity in admin panel.
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
// Used by the "hierarchy" view mode in the editor. Items with parent
// relationships are displayed as indented children. The tree is built per
// category from the filtered item list, then flattened with depth info for
// rendering as a flat list with CSS indentation.

export interface TreeNode {
  item: EnrichedItem;
  children: TreeNode[];
}

export interface FlattenedNode {
  item: EnrichedItem;
  depth: number;
}

// A Section is a category with its filtered+sorted items, ready for rendering.
// Empty categories are omitted — only categories with matching items appear.
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
