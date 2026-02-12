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

async function listProjects(auth, _event, _id, cors) {
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

async function createProject(auth, event, _id, cors) {
  const user = await authenticate(auth);
  if (!(await isAdmin(user))) return jsonResponse(403, { message: "Admin access required" }, cors);
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

async function updateProject(auth, event, projectId, cors) {
  const user = await authenticate(auth);
  if (!(await isAdmin(user))) return jsonResponse(403, { message: "Admin access required" }, cors);
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

async function removeProject(auth, _event, projectId, cors) {
  const user = await authenticate(auth);
  if (!(await isAdmin(user))) return jsonResponse(403, { message: "Admin access required" }, cors);
  const index = await getProjectIndex();
  const idx = index.projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return jsonResponse(404, { message: "Project not found" }, cors);
  index.projects.splice(idx, 1);
  await putProjectIndex(index);
  await deleteProjectData(projectId);
  return jsonResponse(200, { message: "Deleted" }, cors);
}

async function getStackRoute(auth, _event, projectId, cors) {
  await authenticate(auth);
  const stack = await getStack(projectId);
  if (!stack) return jsonResponse(404, { message: "Stack not found" }, cors);
  return jsonResponse(200, { data: stack }, cors);
}

async function putStackRoute(auth, event, projectId, cors) {
  const user = await authenticate(auth);
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

async function getProjectView(auth, _event, projectId, cors) {
  const user = await authenticate(auth);
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

const projectMethods = { PUT: updateProject, DELETE: removeProject };
const stackMethods = { GET: getStackRoute, PUT: putStackRoute };

function matchProjectRoute(method, path) {
  if (path === "/projects") {
    if (method === "GET") return { handler: listProjects };
    if (method === "POST") return { handler: createProject };
    return null;
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const handler = projectMethods[method];
    return handler ? { handler, id: decodeURIComponent(projectMatch[1]) } : null;
  }

  const stackMatch = path.match(/^\/projects\/([^/]+)\/stack$/);
  if (stackMatch) {
    const handler = stackMethods[method];
    return handler ? { handler, id: decodeURIComponent(stackMatch[1]) } : null;
  }

  const viewMatch = method === "GET" && path.match(/^\/projects\/([^/]+)\/view$/);
  return viewMatch ? { handler: getProjectView, id: decodeURIComponent(viewMatch[1]) } : null;
}

export const handleProjects = async (method, path, event, cors) => {
  const match = matchProjectRoute(method, path);
  if (!match) return null;
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  return match.handler(auth, event, match.id, cors);
};
