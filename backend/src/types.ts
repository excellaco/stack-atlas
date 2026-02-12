// --- Auth ---

export interface User {
  sub: string;
  email: string;
  groups: string[];
  name?: string;
}

// --- Roles ---

export interface RoleEntry {
  sub: string;
  email: string;
}

export interface Roles {
  admins: (string | RoleEntry)[];
  editors: Record<string, (string | RoleEntry)[]>;
}

// --- Project ---

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIndex {
  projects: Project[];
}

// --- Stack ---

export interface Stack {
  items: string[];
  providers?: string[];
  updatedAt: string;
  updatedBy: string;
}

// --- Subsystem ---

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
  description?: string;
}

// --- Draft ---

export interface Draft {
  stack: { items: string[]; providers?: string[] };
  subsystems: Record<string, SubsystemDraftData>;
  lockedBy: string;
  lockedAt: string;
  updatedAt: string;
}

export interface DraftWithMeta extends Draft {
  userSub: string;
  projectId: string;
}

// --- Commit ---

export interface CommitSnapshot {
  stack: string[];
  providers: string[];
  subsystems: Record<string, { name: string; additions: string[]; exclusions: string[] }>;
}

export interface CommitEntry {
  id: string;
  message: string;
  author: string;
  authorSub: string;
  timestamp: string;
  snapshot: CommitSnapshot;
}

export interface CommitLog {
  commits: CommitEntry[];
}

// --- Catalog ---

export interface Catalog {
  categories: Array<{ id: string; name: string; description: string; color: string }>;
  types: string[];
  items: Array<{ id: string; name: string; category: string; type: string }>;
  descriptions: Record<string, string>;
}

// --- User Registry ---

export interface UserRegistryEntry {
  email: string;
  name: string;
  firstSeen: string;
}

export interface UserRegistry {
  users: Record<string, UserRegistryEntry>;
}

// --- Lambda ---

export interface CorsHeaders {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Headers": string;
  "Access-Control-Allow-Methods": string;
}

export interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
}

export interface LambdaEvent {
  requestContext: {
    http: { method: string };
  };
  rawPath: string;
  headers?: Record<string, string | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
}

export type RouteHandler = (
  method: string,
  path: string,
  event: LambdaEvent,
  cors: CorsHeaders
) => Promise<LambdaResponse | null>;
