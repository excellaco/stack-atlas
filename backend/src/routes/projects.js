import { randomUUID } from "crypto";
import { isAdmin, isEditor } from "../roles.js";
import {
  getProjectIndex,
  putProjectIndex,
  getStack,
  putStack,
  deleteProjectData,
  listSubsystems,
  getCatalog,
  getRoles,
} from "../storage.js";
import { jsonResponse, parseBody, slugify, authenticate } from "./utils.js";

export const handleProjects = async (method, path, event, cors) => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;

  // --- Projects list ---
  if (method === "GET" && path === "/projects") {
    const user = await authenticate(auth);
    const index = await getProjectIndex();
    const roles = await getRoles();
    const userIsAdmin = await isAdmin(user);
    const projects = index.projects.map((p) => ({
      ...p,
      canEdit:
        userIsAdmin ||
        (roles.editors[p.id] || []).some((e) => (typeof e === "string" ? e : e.sub) === user.sub),
    }));
    return jsonResponse(200, { data: projects }, cors);
  }

  if (method === "POST" && path === "/projects") {
    const user = await authenticate(auth);
    if (!(await isAdmin(user)))
      return jsonResponse(403, { message: "Admin access required" }, cors);
    const body = parseBody(event);
    if (!body.name?.trim()) return jsonResponse(400, { message: "Project name is required" }, cors);
    const now = new Date().toISOString();
    const id = slugify(body.name) || randomUUID();
    const index = await getProjectIndex();
    if (index.projects.some((p) => p.id === id)) {
      return jsonResponse(409, { message: "Project with this name already exists" }, cors);
    }
    const project = {
      id,
      name: body.name.trim(),
      description: (body.description || "").trim(),
      createdBy: user.sub,
      createdAt: now,
      updatedAt: now,
    };
    index.projects.push(project);
    await putProjectIndex(index);
    await putStack(id, { items: [], updatedAt: now, updatedBy: user.sub });
    return jsonResponse(201, { data: project }, cors);
  }

  // --- Single project ---
  const projectMatch = path.match(/^\/projects\/([^/]+)$/);

  if (method === "PUT" && projectMatch) {
    const user = await authenticate(auth);
    const projectId = decodeURIComponent(projectMatch[1]);
    if (!(await isAdmin(user)))
      return jsonResponse(403, { message: "Admin access required" }, cors);
    const body = parseBody(event);
    const index = await getProjectIndex();
    const project = index.projects.find((p) => p.id === projectId);
    if (!project) return jsonResponse(404, { message: "Project not found" }, cors);
    if (body.name?.trim()) project.name = body.name.trim();
    if (body.description !== undefined) project.description = (body.description || "").trim();
    project.updatedAt = new Date().toISOString();
    await putProjectIndex(index);
    return jsonResponse(200, { data: project }, cors);
  }

  if (method === "DELETE" && projectMatch) {
    const user = await authenticate(auth);
    const projectId = decodeURIComponent(projectMatch[1]);
    if (!(await isAdmin(user)))
      return jsonResponse(403, { message: "Admin access required" }, cors);
    const index = await getProjectIndex();
    const idx = index.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return jsonResponse(404, { message: "Project not found" }, cors);
    index.projects.splice(idx, 1);
    await putProjectIndex(index);
    await deleteProjectData(projectId);
    return jsonResponse(200, { message: "Deleted" }, cors);
  }

  // --- Stack ---
  const stackMatch = path.match(/^\/projects\/([^/]+)\/stack$/);

  if (method === "GET" && stackMatch) {
    await authenticate(auth);
    const projectId = decodeURIComponent(stackMatch[1]);
    const stack = await getStack(projectId);
    if (!stack) return jsonResponse(404, { message: "Stack not found" }, cors);
    return jsonResponse(200, { data: stack }, cors);
  }

  if (method === "PUT" && stackMatch) {
    const user = await authenticate(auth);
    const projectId = decodeURIComponent(stackMatch[1]);
    if (!(await isEditor(user, projectId)))
      return jsonResponse(403, { message: "Editor access required" }, cors);
    const body = parseBody(event);
    if (!Array.isArray(body.items))
      return jsonResponse(400, { message: "items must be an array" }, cors);
    const now = new Date().toISOString();
    const stack = { items: body.items, updatedAt: now, updatedBy: user.sub };
    await putStack(projectId, stack);
    const index = await getProjectIndex();
    const project = index.projects.find((p) => p.id === projectId);
    if (project) {
      project.updatedAt = now;
      await putProjectIndex(index);
    }
    return jsonResponse(200, { data: stack }, cors);
  }

  // --- Project view (auth required) ---
  const viewMatch = path.match(/^\/projects\/([^/]+)\/view$/);

  if (method === "GET" && viewMatch) {
    const user = await authenticate(auth);
    const projectId = decodeURIComponent(viewMatch[1]);
    const index = await getProjectIndex();
    const project = index.projects.find((p) => p.id === projectId);
    if (!project) return jsonResponse(404, { message: "Project not found" }, cors);
    const canEdit = await isEditor(user, projectId);
    const stack = await getStack(projectId);
    const subsystemsList = await listSubsystems(projectId);
    const catalog = await getCatalog();
    return jsonResponse(
      200,
      {
        data: {
          project: { ...project, canEdit },
          stack: stack?.items || [],
          subsystems: subsystemsList,
          categories: catalog?.categories || [],
          items: catalog?.items || [],
          descriptions: catalog?.descriptions || {},
        },
      },
      cors
    );
  }

  return null;
};
