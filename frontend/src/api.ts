import { config } from "./config";
import type {
  Catalog,
  Commit,
  Draft,
  Project,
  ProjectViewData,
  Roles,
  Stack,
  Subsystem,
} from "./types";

interface RequestOptions {
  method?: string;
  token?: string | null;
  body?: unknown;
}

let authErrorHandler: (() => void) | null = null;
export const setOnAuthError = (handler: (() => void) | null): void => {
  authErrorHandler = handler;
};

function buildHeaders(token: string | null | undefined, body: unknown): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  return headers;
}

async function handleError(response: Response): Promise<never> {
  const err = (await response.json().catch(() => ({}))) as { message?: string };
  if (response.status === 401 && authErrorHandler) authErrorHandler();
  throw new Error(err.message ?? `Request failed (${response.status})`);
}

async function request<T>(
  path: string,
  { method = "GET", token, body }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: buildHeaders(token, body),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) await handleError(response);
  if (response.status === 204) return null as T;
  const result = (await response.json()) as { data?: T } & T;
  return (result.data ?? result) as T;
}

// Projects
export const listProjects = (token: string): Promise<Project[]> =>
  request<Project[]>("/projects", { token });

export const createProject = (
  token: string,
  { name, description }: { name: string; description: string }
): Promise<Project> =>
  request<Project>("/projects", { method: "POST", token, body: { name, description } });

export const updateProject = (
  token: string,
  projectId: string,
  { name, description }: { name: string; description: string }
): Promise<Project> =>
  request<Project>(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    token,
    body: { name, description },
  });

export const deleteProject = (token: string, projectId: string): Promise<null> =>
  request<null>(`/projects/${encodeURIComponent(projectId)}`, { method: "DELETE", token });

// Stacks
export const getStack = (token: string, projectId: string): Promise<Stack> =>
  request<Stack>(`/projects/${encodeURIComponent(projectId)}/stack`, { token });

export const saveStack = (token: string, projectId: string, items: string[]): Promise<Stack> =>
  request<Stack>(`/projects/${encodeURIComponent(projectId)}/stack`, {
    method: "PUT",
    token,
    body: { items },
  });

// Subsystems
export const listSubsystems = (token: string, projectId: string): Promise<Subsystem[]> =>
  request<Subsystem[]>(`/projects/${encodeURIComponent(projectId)}/subsystems`, { token });

export const createSubsystem = (
  token: string,
  projectId: string,
  { name, description }: { name: string; description: string }
): Promise<Subsystem> =>
  request<Subsystem>(`/projects/${encodeURIComponent(projectId)}/subsystems`, {
    method: "POST",
    token,
    body: { name, description },
  });

export const updateSubsystem = (
  token: string,
  projectId: string,
  subsystemId: string,
  {
    name,
    description,
    additions,
    exclusions,
  }: { name: string; description: string; additions: string[]; exclusions: string[] }
): Promise<Subsystem> =>
  request<Subsystem>(
    `/projects/${encodeURIComponent(projectId)}/subsystems/${encodeURIComponent(subsystemId)}`,
    {
      method: "PUT",
      token,
      body: { name, description, additions, exclusions },
    }
  );

export const deleteSubsystemApi = (
  token: string,
  projectId: string,
  subsystemId: string
): Promise<null> =>
  request<null>(
    `/projects/${encodeURIComponent(projectId)}/subsystems/${encodeURIComponent(subsystemId)}`,
    {
      method: "DELETE",
      token,
    }
  );

// Admin
export const getRoles = (token: string): Promise<Roles> =>
  request<Roles>("/admin/roles", { token });

export const putRoles = (token: string, roles: Roles): Promise<Roles> =>
  request<Roles>("/admin/roles", { method: "PUT", token, body: roles });

// Drafts
export const getDraft = (token: string, projectId: string): Promise<Draft> =>
  request<Draft>(`/projects/${encodeURIComponent(projectId)}/draft`, { token });

export const saveDraft = (
  token: string,
  projectId: string,
  {
    stack,
    subsystems,
  }: {
    stack: { items: string[]; providers: string[] };
    subsystems: Record<string, { name: string; additions: string[]; exclusions: string[] }>;
  }
): Promise<Draft> =>
  request<Draft>(`/projects/${encodeURIComponent(projectId)}/draft`, {
    method: "PUT",
    token,
    body: { stack, subsystems },
  });

export const discardDraft = (token: string, projectId: string): Promise<null> =>
  request<null>(`/projects/${encodeURIComponent(projectId)}/draft`, { method: "DELETE", token });

// Commits
export const commitChanges = (
  token: string,
  projectId: string,
  { message }: { message: string }
): Promise<Commit> =>
  request<Commit>(`/projects/${encodeURIComponent(projectId)}/commit`, {
    method: "POST",
    token,
    body: { message },
  });

export const getCommits = (token: string, projectId: string): Promise<Commit[]> =>
  request<Commit[]>(`/projects/${encodeURIComponent(projectId)}/commits`, { token });

// Catalog
export const getCatalog = (token: string): Promise<Catalog> =>
  request<Catalog>("/catalog", { token });

export const putCatalog = (token: string, catalog: Catalog): Promise<Catalog> =>
  request<Catalog>("/admin/catalog", { method: "PUT", token, body: catalog });

// Admin - Users
interface AdminUser {
  sub: string;
  email: string;
  enabled: boolean;
  status: string;
  createdAt: string;
}

export const listUsers = (token: string): Promise<AdminUser[]> =>
  request<AdminUser[]>("/admin/users", { token });

// Admin - Locks
interface Lock {
  projectId: string;
  userSub: string;
  lockedAt: string;
}

export const listLocks = (token: string): Promise<Lock[]> =>
  request<Lock[]>("/admin/locks", { token });

export const breakLock = (token: string, projectId: string, userSub: string): Promise<null> =>
  request<null>(`/admin/locks/${encodeURIComponent(projectId)}/${encodeURIComponent(userSub)}`, {
    method: "DELETE",
    token,
  });

// Admin - Activity
interface ActivityEntry {
  timestamp: string;
  action: string;
  user: string;
  projectId?: string;
  detail?: string;
}

export const getActivity = (token: string): Promise<ActivityEntry[]> =>
  request<ActivityEntry[]>("/admin/activity", { token });

// Project view
export const getProjectView = (token: string, projectId: string): Promise<ProjectViewData> =>
  request<ProjectViewData>(`/projects/${encodeURIComponent(projectId)}/view`, { token });
