import { randomUUID } from "crypto";
import { isAdmin, isEditor } from "../roles.js";
import {
  getProjectIndex, putProjectIndex,
  putStack, listSubsystems, putSubsystem, deleteSubsystem,
  getDraft, getDraftForProject, putDraft, deleteDraft, isLockExpired,
  getCommitLog, appendCommit
} from "../storage.js";
import { jsonResponse, parseBody, authenticate } from "./utils.js";

export const handleDrafts = async (method, path, event, cors) => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  const draftMatch = path.match(/^\/projects\/([^/]+)\/draft$/);
  const commitMatch = path.match(/^\/projects\/([^/]+)\/commit$/);
  const commitsMatch = path.match(/^\/projects\/([^/]+)\/commits$/);

  if (method === "GET" && draftMatch) {
    const user = await authenticate(auth);
    const projectId = decodeURIComponent(draftMatch[1]);
    if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
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
    const existingDraft = await getDraftForProject(projectId);
    if (existingDraft && existingDraft.lockedBy !== user.sub && !isLockExpired(existingDraft.lockedAt)) {
      return jsonResponse(423, { message: "Project is locked by another user", lockedBy: existingDraft.lockedBy, lockedAt: existingDraft.lockedAt }, cors);
    }
    const body = parseBody(event);
    const now = new Date().toISOString();
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
    if (draft.lockedBy !== user.sub && !await isAdmin(user)) {
      return jsonResponse(403, { message: "Only the draft owner or admin can discard" }, cors);
    }
    await deleteDraft(user.sub, projectId);
    return jsonResponse(200, { message: "Draft discarded" }, cors);
  }

  // --- Commits ---
  if (method === "POST" && commitMatch) {
    const user = await authenticate(auth);
    const projectId = decodeURIComponent(commitMatch[1]);
    if (!await isEditor(user, projectId)) return jsonResponse(403, { message: "Editor access required" }, cors);
    const body = parseBody(event);
    if (!body.message?.trim()) return jsonResponse(400, { message: "Commit message is required" }, cors);

    const draft = await getDraft(user.sub, projectId);
    if (!draft) return jsonResponse(400, { message: "No draft to commit" }, cors);

    const now = new Date().toISOString();

    await putStack(projectId, { items: draft.stack?.items || [], updatedAt: now, updatedBy: user.sub });

    const existingSubs = await listSubsystems(projectId);
    const existingSubIds = new Set(existingSubs.map((s) => s.id));
    const draftSubIds = new Set(Object.keys(draft.subsystems || {}));

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

    for (const subId of existingSubIds) {
      if (!draftSubIds.has(subId)) {
        await deleteSubsystem(projectId, subId);
      }
    }

    const index = await getProjectIndex();
    const project = index.projects.find((p) => p.id === projectId);
    if (project) {
      project.updatedAt = now;
      await putProjectIndex(index);
    }

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
    return jsonResponse(200, { data: log.commits.slice().reverse() }, cors);
  }

  return null;
};
