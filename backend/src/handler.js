import { randomUUID } from "crypto";
import { verifyAuth } from "./auth.js";
import { isAdmin, isEditor } from "./roles.js";
import {
  getProjectIndex, putProjectIndex,
  getStack, putStack, deleteProjectData,
  listSubsystems, getSubsystem, putSubsystem, deleteSubsystem,
  getRoles, putRoles,
  getCatalog, putCatalog,
  getDraft, getDraftForProject, putDraft, deleteDraft, isLockExpired,
  getCommitLog, appendCommit,
  getUserRegistry, ensureUserInRegistry,
  listAllDrafts, listAllCommitLogs
} from "./storage.js";

const jsonResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", ...headers },
  body: JSON.stringify(body)
});

const emptyResponse = (statusCode, headers = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", ...headers }
});

const getCorsHeaders = (origin) => {
  const allowList = (process.env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim());
  const allowOrigin = allowList.includes("*") ? "*" : allowList.includes(origin ?? "") ? origin : allowList[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization,content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  };
};

const parseBody = (event) => {
  if (!event.body) throw new Error("Missing request body");
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  return JSON.parse(raw);
};

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);

const authenticate = async (auth) => {
  const user = await verifyAuth(auth);
  // Fire-and-forget user registry update
  ensureUserInRegistry(user).catch(() => {});
  return user;
};

export const handler = async (event) => {
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath;
  const cors = getCorsHeaders(event.headers?.origin ?? event.headers?.Origin);

  if (method === "OPTIONS") return emptyResponse(204, cors);

  try {
    const auth = event.headers?.authorization ?? event.headers?.Authorization;

    // --- Projects list ---
    if (method === "GET" && path === "/projects") {
      const user = await authenticate(auth);
      const index = await getProjectIndex();
      return jsonResponse(200, { data: index.projects }, cors);
    }

    if (method === "POST" && path === "/projects") {
      const user = await authenticate(auth);
      if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
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
        updatedAt: now
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
      if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
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
      if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
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
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(stackMatch[1]);
      const stack = await getStack(projectId);
      if (!stack) return jsonResponse(404, { message: "Stack not found" }, cors);
      return jsonResponse(200, { data: stack }, cors);
    }

    if (method === "PUT" && stackMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(stackMatch[1]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      const body = parseBody(event);
      if (!Array.isArray(body.items)) return jsonResponse(400, { message: "items must be an array" }, cors);
      const now = new Date().toISOString();
      const stack = { items: body.items, updatedAt: now, updatedBy: user.sub };
      await putStack(projectId, stack);
      // Update project timestamp
      const index = await getProjectIndex();
      const project = index.projects.find((p) => p.id === projectId);
      if (project) {
        project.updatedAt = now;
        await putProjectIndex(index);
      }
      return jsonResponse(200, { data: stack }, cors);
    }

    // --- Subsystems ---
    const subsystemsMatch = path.match(/^\/projects\/([^/]+)\/subsystems$/);
    const subsystemMatch = path.match(/^\/projects\/([^/]+)\/subsystems\/([^/]+)$/);

    if (method === "GET" && subsystemsMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(subsystemsMatch[1]);
      const subs = await listSubsystems(projectId);
      return jsonResponse(200, { data: subs }, cors);
    }

    if (method === "POST" && subsystemsMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(subsystemsMatch[1]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      const body = parseBody(event);
      if (!body.name?.trim()) return jsonResponse(400, { message: "Subsystem name is required" }, cors);
      const now = new Date().toISOString();
      const id = slugify(body.name) || randomUUID();
      const existing = await getSubsystem(projectId, id);
      if (existing) return jsonResponse(409, { message: "Subsystem with this name already exists" }, cors);
      const sub = {
        id,
        projectId,
        name: body.name.trim(),
        description: (body.description || "").trim(),
        additions: body.additions || [],
        exclusions: body.exclusions || [],
        createdBy: user.sub,
        createdAt: now,
        updatedAt: now
      };
      await putSubsystem(projectId, id, sub);
      return jsonResponse(201, { data: sub }, cors);
    }

    if (method === "PUT" && subsystemMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(subsystemMatch[1]);
      const subId = decodeURIComponent(subsystemMatch[2]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      const existing = await getSubsystem(projectId, subId);
      if (!existing) return jsonResponse(404, { message: "Subsystem not found" }, cors);
      const body = parseBody(event);
      if (body.name?.trim()) existing.name = body.name.trim();
      if (body.description !== undefined) existing.description = (body.description || "").trim();
      if (Array.isArray(body.additions)) existing.additions = body.additions;
      if (Array.isArray(body.exclusions)) existing.exclusions = body.exclusions;
      existing.updatedAt = new Date().toISOString();
      await putSubsystem(projectId, subId, existing);
      return jsonResponse(200, { data: existing }, cors);
    }

    if (method === "DELETE" && subsystemMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(subsystemMatch[1]);
      const subId = decodeURIComponent(subsystemMatch[2]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      const existing = await getSubsystem(projectId, subId);
      if (!existing) return jsonResponse(404, { message: "Subsystem not found" }, cors);
      await deleteSubsystem(projectId, subId);
      return jsonResponse(200, { message: "Deleted" }, cors);
    }

    // --- Admin: Roles ---
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
      // Validate shape: each entry must have { sub, email }
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

    // --- Admin: Users ---
    if (method === "GET" && path === "/admin/users") {
      const user = await authenticate(auth);
      if (!await isAdmin(user)) return jsonResponse(403, { message: "Admin access required" }, cors);
      const registry = await getUserRegistry();
      return jsonResponse(200, { data: registry.users }, cors);
    }

    // --- Admin: Locks ---
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

    // --- Admin: Activity ---
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

    // --- Drafts ---
    const draftMatch = path.match(/^\/projects\/([^/]+)\/draft$/);

    if (method === "GET" && draftMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(draftMatch[1]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      // Check if another user has an active lock
      const existingDraft = await getDraftForProject(projectId);
      if (existingDraft && existingDraft.lockedBy !== user.sub && !isLockExpired(existingDraft.lockedAt)) {
        return jsonResponse(423, { message: "Project is locked by another user", lockedBy: existingDraft.lockedBy, lockedAt: existingDraft.lockedAt }, cors);
      }
      const draft = await getDraft(user.sub, projectId);
      return jsonResponse(200, { data: draft }, cors);
    }

    if (method === "PUT" && draftMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(draftMatch[1]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      // Check lock
      const existingDraft = await getDraftForProject(projectId);
      if (existingDraft && existingDraft.lockedBy !== user.sub && !isLockExpired(existingDraft.lockedAt)) {
        return jsonResponse(423, { message: "Project is locked by another user", lockedBy: existingDraft.lockedBy, lockedAt: existingDraft.lockedAt }, cors);
      }
      const body = parseBody(event);
      const now = new Date().toISOString();
      // Preserve lockedAt from existing draft if same user, otherwise set new
      const myDraft = await getDraft(user.sub, projectId);
      const draft = {
        stack: body.stack || { items: [] },
        subsystems: body.subsystems || {},
        lockedBy: user.sub,
        lockedAt: myDraft?.lockedAt || now,
        updatedAt: now
      };
      await putDraft(user.sub, projectId, draft);
      return jsonResponse(200, { data: draft }, cors);
    }

    if (method === "DELETE" && draftMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(draftMatch[1]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      const draft = await getDraft(user.sub, projectId);
      if (!draft) return jsonResponse(404, { message: "No draft found" }, cors);
      // Only lock owner or admin can delete
      if (draft.lockedBy !== user.sub && !await isAdmin(user)) {
        return jsonResponse(403, { message: "Only the draft owner or admin can discard" }, cors);
      }
      await deleteDraft(user.sub, projectId);
      return jsonResponse(200, { message: "Draft discarded" }, cors);
    }

    // --- Commits ---
    const commitMatch = path.match(/^\/projects\/([^/]+)\/commit$/);
    const commitsMatch = path.match(/^\/projects\/([^/]+)\/commits$/);

    if (method === "POST" && commitMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(commitMatch[1]);
      if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
      const body = parseBody(event);
      if (!body.message?.trim()) return jsonResponse(400, { message: "Commit message is required" }, cors);

      // Read the user's draft
      const draft = await getDraft(user.sub, projectId);
      if (!draft) return jsonResponse(400, { message: "No draft to commit" }, cors);

      const now = new Date().toISOString();

      // Apply draft to primary store
      await putStack(projectId, { items: draft.stack?.items || [], updatedAt: now, updatedBy: user.sub });

      // Apply subsystem changes
      const existingSubs = await listSubsystems(projectId);
      const existingSubIds = new Set(existingSubs.map((s) => s.id));
      const draftSubIds = new Set(Object.keys(draft.subsystems || {}));

      // Update/create subsystems from draft
      for (const [subId, subData] of Object.entries(draft.subsystems || {})) {
        const existing = existingSubs.find((s) => s.id === subId);
        const sub = {
          id: subId,
          projectId,
          name: subData.name || existing?.name || subId,
          description: subData.description || existing?.description || "",
          additions: subData.additions || [],
          exclusions: subData.exclusions || [],
          createdBy: existing?.createdBy || user.sub,
          createdAt: existing?.createdAt || now,
          updatedAt: now
        };
        await putSubsystem(projectId, subId, sub);
      }

      // Delete subsystems not in draft (if they were removed)
      for (const subId of existingSubIds) {
        if (!draftSubIds.has(subId)) {
          await deleteSubsystem(projectId, subId);
        }
      }

      // Update project timestamp
      const index = await getProjectIndex();
      const project = index.projects.find((p) => p.id === projectId);
      if (project) {
        project.updatedAt = now;
        await putProjectIndex(index);
      }

      // Build snapshot
      const snapshot = {
        stack: draft.stack?.items || [],
        subsystems: {}
      };
      for (const [subId, subData] of Object.entries(draft.subsystems || {})) {
        snapshot.subsystems[subId] = {
          name: subData.name || subId,
          additions: subData.additions || [],
          exclusions: subData.exclusions || []
        };
      }

      // Create commit record
      const commit = {
        id: randomUUID().slice(0, 8),
        message: body.message.trim(),
        author: user.email,
        authorSub: user.sub,
        timestamp: now,
        snapshot
      };

      await appendCommit(projectId, commit);
      await deleteDraft(user.sub, projectId);

      return jsonResponse(201, { data: commit }, cors);
    }

    if (method === "GET" && commitsMatch) {
      const user = await authenticate(auth);
      const projectId = decodeURIComponent(commitsMatch[1]);
      const log = await getCommitLog(projectId);
      // Return newest first
      return jsonResponse(200, { data: log.commits.slice().reverse() }, cors);
    }

    return jsonResponse(404, { message: "Not found" }, cors);
  } catch (error) {
    const message = error.message || "Internal error";
    const statusCode = message.includes("Missing Authorization") || message.includes("Missing Bearer") || message.includes("Invalid token") ? 401 : 400;
    return jsonResponse(statusCode, { message }, cors);
  }
};
