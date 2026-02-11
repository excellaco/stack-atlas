import { config } from "./config";

const request = async (path, { method = "GET", token, body } = {}) => {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  const result = await response.json();
  return result.data ?? result;
};

// Projects
export const listProjects = (token) =>
  request("/projects", { token });

export const createProject = (token, { name, description }) =>
  request("/projects", { method: "POST", token, body: { name, description } });

export const updateProject = (token, projectId, { name, description }) =>
  request(`/projects/${encodeURIComponent(projectId)}`, { method: "PUT", token, body: { name, description } });

export const deleteProject = (token, projectId) =>
  request(`/projects/${encodeURIComponent(projectId)}`, { method: "DELETE", token });

// Stacks
export const getStack = (token, projectId) =>
  request(`/projects/${encodeURIComponent(projectId)}/stack`, { token });

export const saveStack = (token, projectId, items) =>
  request(`/projects/${encodeURIComponent(projectId)}/stack`, { method: "PUT", token, body: { items } });

// Subsystems
export const listSubsystems = (token, projectId) =>
  request(`/projects/${encodeURIComponent(projectId)}/subsystems`, { token });

export const createSubsystem = (token, projectId, { name, description }) =>
  request(`/projects/${encodeURIComponent(projectId)}/subsystems`, { method: "POST", token, body: { name, description } });

export const updateSubsystem = (token, projectId, subsystemId, { name, description, additions, exclusions }) =>
  request(`/projects/${encodeURIComponent(projectId)}/subsystems/${encodeURIComponent(subsystemId)}`, {
    method: "PUT", token, body: { name, description, additions, exclusions }
  });

export const deleteSubsystemApi = (token, projectId, subsystemId) =>
  request(`/projects/${encodeURIComponent(projectId)}/subsystems/${encodeURIComponent(subsystemId)}`, {
    method: "DELETE", token
  });

// Admin
export const getRoles = (token) =>
  request("/admin/roles", { token });

export const putRoles = (token, roles) =>
  request("/admin/roles", { method: "PUT", token, body: roles });
