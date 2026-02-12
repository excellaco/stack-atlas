import { isAdmin } from "../roles.js";
import {
  getRoles,
  putRoles,
  getCatalog,
  putCatalog,
  getUserRegistry,
  listAllDrafts,
  deleteDraft,
  isLockExpired,
  listAllCommitLogs,
  getProjectIndex,
} from "../storage.js";
import { jsonResponse, parseBody, authenticate } from "./utils.js";

async function requireAdmin(auth) {
  const user = await authenticate(auth);
  if (!(await isAdmin(user))) throw new Error("FORBIDDEN");
  return user;
}

async function getRolesRoute(auth, _event, cors) {
  await requireAdmin(auth);
  const roles = await getRoles();
  return jsonResponse(200, { data: roles }, cors);
}

async function putRolesRoute(auth, event, cors) {
  await requireAdmin(auth);
  const body = parseBody(event);
  if (!Array.isArray(body.admins) || typeof body.editors !== "object") {
    return jsonResponse(400, { message: "Invalid roles format" }, cors);
  }
  const validEntry = (e) => e && typeof e.sub === "string" && typeof e.email === "string";
  const validAdmins = body.admins.every(validEntry);
  const validEditors = Object.values(body.editors).every(
    (arr) => Array.isArray(arr) && arr.every(validEntry)
  );
  if (!validAdmins || !validEditors) {
    return jsonResponse(400, { message: "Each role entry must have { sub, email }" }, cors);
  }
  const roles = { admins: body.admins, editors: body.editors };
  await putRoles(roles);
  return jsonResponse(200, { data: roles }, cors);
}

async function getCatalogRoute(auth, _event, cors) {
  await authenticate(auth);
  const catalog = await getCatalog();
  if (!catalog) return jsonResponse(404, { message: "No catalog published" }, cors);
  return jsonResponse(200, { data: catalog }, cors);
}

async function putCatalogRoute(auth, event, cors) {
  await requireAdmin(auth);
  const body = parseBody(event);
  if (
    !Array.isArray(body.categories) ||
    !Array.isArray(body.types) ||
    !Array.isArray(body.items) ||
    typeof body.descriptions !== "object"
  ) {
    return jsonResponse(
      400,
      {
        message: "Catalog must have categories, types, items (arrays) and descriptions (object)",
      },
      cors
    );
  }
  const validItem = (i) =>
    i &&
    typeof i.id === "string" &&
    typeof i.name === "string" &&
    typeof i.category === "string" &&
    typeof i.type === "string";
  if (!body.items.every(validItem)) {
    return jsonResponse(400, { message: "Each item must have id, name, category, and type" }, cors);
  }
  const catalog = {
    categories: body.categories,
    types: body.types,
    descriptions: body.descriptions,
    items: body.items,
  };
  await putCatalog(catalog);
  return jsonResponse(200, { data: catalog }, cors);
}

async function getUsersRoute(auth, _event, cors) {
  await requireAdmin(auth);
  const registry = await getUserRegistry();
  return jsonResponse(200, { data: registry.users }, cors);
}

async function getLocksRoute(auth, _event, cors) {
  await requireAdmin(auth);
  const allDrafts = await listAllDrafts();
  const registry = await getUserRegistry();
  const activeLocks = allDrafts
    .filter((d) => !isLockExpired(d.lockedAt))
    .map((d) => ({
      projectId: d.projectId,
      userSub: d.userSub,
      email: registry.users[d.lockedBy]?.email || d.lockedBy,
      lockedAt: d.lockedAt,
      updatedAt: d.updatedAt,
    }));
  return jsonResponse(200, { data: activeLocks }, cors);
}

async function getActivityRoute(auth, _event, cors) {
  await requireAdmin(auth);
  const allCommits = await listAllCommitLogs();
  const index = await getProjectIndex();
  const projectNames = Object.fromEntries(index.projects.map((p) => [p.id, p.name]));
  const enriched = allCommits
    .map((c) => ({ ...c, projectName: projectNames[c.projectId] || c.projectId }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
  return jsonResponse(200, { data: enriched }, cors);
}

async function deleteLockRoute(auth, event, cors, lockMatch) {
  await requireAdmin(auth);
  const projectId = decodeURIComponent(lockMatch[1]);
  const userSub = decodeURIComponent(lockMatch[2]);
  await deleteDraft(userSub, projectId);
  return jsonResponse(200, { message: "Lock broken" }, cors);
}

const routes = {
  "GET /admin/roles": getRolesRoute,
  "PUT /admin/roles": putRolesRoute,
  "GET /catalog": getCatalogRoute,
  "PUT /admin/catalog": putCatalogRoute,
  "GET /admin/users": getUsersRoute,
  "GET /admin/locks": getLocksRoute,
  "GET /admin/activity": getActivityRoute,
};

async function dispatch(handler, auth, event, cors, extra) {
  try {
    return await handler(auth, event, cors, extra);
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return jsonResponse(403, { message: "Admin access required" }, cors);
    }
    throw err;
  }
}

export const handleAdmin = async (method, path, event, cors) => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;

  const handler = routes[`${method} ${path}`];
  if (handler) return dispatch(handler, auth, event, cors);

  const lockMatch = path.match(/^\/admin\/locks\/([^/]+)\/([^/]+)$/);
  if (method === "DELETE" && lockMatch) {
    return dispatch(deleteLockRoute, auth, event, cors, lockMatch);
  }

  return null;
};
