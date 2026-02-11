import { isAdmin } from "../roles.js";
import {
  getRoles, putRoles,
  getCatalog, putCatalog,
  getUserRegistry,
  listAllDrafts, deleteDraft, isLockExpired,
  listAllCommitLogs, getProjectIndex
} from "../storage.js";
import { jsonResponse, parseBody, authenticate } from "./utils.js";

export const handleAdmin = async (method, path, event, cors) => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;

  // --- Roles ---
  if (method === "GET" && path === "/admin/roles") {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const roles = await getRoles();
    return jsonResponse(200, { data: roles }, cors);
  }

  if (method === "PUT" && path === "/admin/roles") {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const body = parseBody(event);
    if (!Array.isArray(body.admins) || typeof body.editors !== "object") {
      return jsonResponse(400, { message: "Invalid roles format" }, cors);
    }
    const validEntry = (e) => e && typeof e.sub === "string" && typeof e.email === "string";
    const validAdmins = body.admins.every(validEntry);
    const validEditors = Object.values(body.editors).every((arr) => Array.isArray(arr) && arr.every(validEntry));
    if (!validAdmins || !validEditors) {
      return jsonResponse(400, { message: "Each role entry must have { sub, email }" }, cors);
    }
    const roles = { admins: body.admins, editors: body.editors };
    await putRoles(roles);
    return jsonResponse(200, { data: roles }, cors);
  }

  // --- Catalog ---
  if (method === "GET" && path === "/catalog") {
    const user = await authenticate(auth);
    const catalog = await getCatalog();
    if (!catalog) return jsonResponse(404, { message: "No catalog published" }, cors);
    return jsonResponse(200, { data: catalog }, cors);
  }

  if (method === "PUT" && path === "/admin/catalog") {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const body = parseBody(event);
    if (!Array.isArray(body.categories) || !Array.isArray(body.types) ||
        !Array.isArray(body.items) || typeof body.descriptions !== "object") {
      return jsonResponse(400, { message: "Catalog must have categories, types, items (arrays) and descriptions (object)" }, cors);
    }
    const validItem = (i) => i && typeof i.id === "string" && typeof i.name === "string" &&
      typeof i.category === "string" && typeof i.type === "string";
    if (!body.items.every(validItem)) {
      return jsonResponse(400, { message: "Each item must have id, name, category, and type" }, cors);
    }
    const catalog = { categories: body.categories, types: body.types, descriptions: body.descriptions, items: body.items };
    await putCatalog(catalog);
    return jsonResponse(200, { data: catalog }, cors);
  }

  // --- Users ---
  if (method === "GET" && path === "/admin/users") {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const registry = await getUserRegistry();
    return jsonResponse(200, { data: registry.users }, cors);
  }

  // --- Locks ---
  const lockMatch = path.match(/^\/admin\/locks\/([^/]+)\/([^/]+)$/);

  if (method === "GET" && path === "/admin/locks") {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const allDrafts = await listAllDrafts();
    const registry = await getUserRegistry();
    const activeLocks = allDrafts
      .filter((d) => !isLockExpired(d.lockedAt))
      .map((d) => ({
        projectId: d.projectId,
        userSub: d.userSub,
        email: registry.users[d.lockedBy]?.email || d.lockedBy,
        lockedAt: d.lockedAt,
        updatedAt: d.updatedAt
      }));
    return jsonResponse(200, { data: activeLocks }, cors);
  }

  if (method === "DELETE" && lockMatch) {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const projectId = decodeURIComponent(lockMatch[1]);
    const userSub = decodeURIComponent(lockMatch[2]);
    await deleteDraft(userSub, projectId);
    return jsonResponse(200, { message: "Lock broken" }, cors);
  }

  // --- Activity ---
  if (method === "GET" && path === "/admin/activity") {
    const user = await authenticate(auth);
    if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
    const allCommits = await listAllCommitLogs();
    const index = await getProjectIndex();
    const projectNames = Object.fromEntries(index.projects.map((p) => [p.id, p.name]));
    const enriched = allCommits
      .map((c) => ({ ...c, projectName: projectNames[c.projectId] || c.projectId }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);
    return jsonResponse(200, { data: enriched }, cors);
  }

  return null;
};
