import { randomUUID } from "crypto";
import { isAdmin, isEditor } from "../roles.js";
import {
  getProjectIndex,
  putProjectIndex,
  putStack,
  listSubsystems,
  putSubsystem,
  deleteSubsystem,
  getDraft,
  getDraftForProject,
  putDraft,
  deleteDraft,
  isLockExpired,
  getCommitLog,
  appendCommit,
} from "../storage.js";
import { jsonResponse, parseBody, authenticate } from "./utils.js";

function checkLock(existingDraft, userSub, cors) {
  if (
    existingDraft &&
    existingDraft.lockedBy !== userSub &&
    !isLockExpired(existingDraft.lockedAt)
  ) {
    return jsonResponse(
      423,
      {
        message: "Project is locked by another user",
        lockedBy: existingDraft.lockedBy,
        lockedAt: existingDraft.lockedAt,
      },
      cors
    );
  }
  return null;
}

async function getDraftRoute(auth, _event, projectId, cors) {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const existingDraft = await getDraftForProject(projectId);
  const locked = checkLock(existingDraft, user.sub, cors);
  if (locked) return locked;
  const draft = await getDraft(user.sub, projectId);
  return jsonResponse(200, { data: draft }, cors);
}

async function putDraftRoute(auth, event, projectId, cors) {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const existingDraft = await getDraftForProject(projectId);
  const locked = checkLock(existingDraft, user.sub, cors);
  if (locked) return locked;
  const body = parseBody(event);
  const now = new Date().toISOString();
  const myDraft = await getDraft(user.sub, projectId);
  const draft = {
    stack: body.stack || { items: [] },
    subsystems: body.subsystems || {},
    lockedBy: user.sub,
    lockedAt: myDraft?.lockedAt || now,
    updatedAt: now,
  };
  await putDraft(user.sub, projectId, draft);
  return jsonResponse(200, { data: draft }, cors);
}

async function deleteDraftRoute(auth, _event, projectId, cors) {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const draft = await getDraft(user.sub, projectId);
  if (!draft) return jsonResponse(404, { message: "No draft found" }, cors);
  if (draft.lockedBy !== user.sub && !(await isAdmin(user))) {
    return jsonResponse(403, { message: "Only the draft owner or admin can discard" }, cors);
  }
  await deleteDraft(user.sub, projectId);
  return jsonResponse(200, { message: "Draft discarded" }, cors);
}

async function commitStack(user, projectId, draft) {
  const now = new Date().toISOString();
  await putStack(projectId, {
    items: draft.stack?.items || [],
    providers: draft.stack?.providers || [],
    updatedAt: now,
    updatedBy: user.sub,
  });
  return now;
}

function buildSubsystem(subId, subData, existing, projectId, userSub, now) {
  const base = existing || {};
  return {
    id: subId,
    projectId,
    name: subData.name || base.name || subId,
    description: subData.description || base.description || "",
    additions: subData.additions || [],
    exclusions: subData.exclusions || [],
    createdBy: base.createdBy || userSub,
    createdAt: base.createdAt || now,
    updatedAt: now,
  };
}

async function commitSubsystems(user, projectId, draft, now) {
  const existingSubs = await listSubsystems(projectId);
  const draftSubs = draft.subsystems || {};

  for (const [subId, subData] of Object.entries(draftSubs)) {
    const existing = existingSubs.find((s) => s.id === subId);
    const sub = buildSubsystem(subId, subData, existing, projectId, user.sub, now);
    await putSubsystem(projectId, subId, sub);
  }

  const draftSubIds = new Set(Object.keys(draftSubs));
  for (const { id } of existingSubs) {
    if (!draftSubIds.has(id)) await deleteSubsystem(projectId, id);
  }
}

function buildSnapshot(draft) {
  const snapshot = {
    stack: draft.stack?.items || [],
    providers: draft.stack?.providers || [],
    subsystems: {},
  };
  for (const [subId, subData] of Object.entries(draft.subsystems || {})) {
    snapshot.subsystems[subId] = {
      name: subData.name || subId,
      additions: subData.additions || [],
      exclusions: subData.exclusions || [],
    };
  }
  return snapshot;
}

async function commitRoute(auth, event, projectId, cors) {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const body = parseBody(event);
  if (!body.message?.trim())
    return jsonResponse(400, { message: "Commit message is required" }, cors);
  const draft = await getDraft(user.sub, projectId);
  if (!draft) return jsonResponse(400, { message: "No draft to commit" }, cors);

  const now = await commitStack(user, projectId, draft);
  await commitSubsystems(user, projectId, draft, now);

  const index = await getProjectIndex();
  const project = index.projects.find((p) => p.id === projectId);
  if (project) {
    project.updatedAt = now;
    await putProjectIndex(index);
  }

  const commit = {
    id: randomUUID().slice(0, 8),
    message: body.message.trim(),
    author: user.email,
    authorSub: user.sub,
    timestamp: now,
    snapshot: buildSnapshot(draft),
  };

  await appendCommit(projectId, commit);
  await deleteDraft(user.sub, projectId);
  return jsonResponse(201, { data: commit }, cors);
}

async function getCommitsRoute(auth, _event, projectId, cors) {
  await authenticate(auth);
  const log = await getCommitLog(projectId);
  return jsonResponse(200, { data: log.commits.slice().reverse() }, cors);
}

const draftMethods = { GET: getDraftRoute, PUT: putDraftRoute, DELETE: deleteDraftRoute };

function matchDraftRoute(method, path) {
  const draftMatch = path.match(/^\/projects\/([^/]+)\/draft$/);
  if (draftMatch) {
    const handler = draftMethods[method];
    if (handler) return { handler, id: decodeURIComponent(draftMatch[1]) };
  }
  const commitMatch = path.match(/^\/projects\/([^/]+)\/commit$/);
  if (method === "POST" && commitMatch) {
    return { handler: commitRoute, id: decodeURIComponent(commitMatch[1]) };
  }
  const commitsMatch = path.match(/^\/projects\/([^/]+)\/commits$/);
  if (method === "GET" && commitsMatch) {
    return { handler: getCommitsRoute, id: decodeURIComponent(commitsMatch[1]) };
  }
  return null;
}

export const handleDrafts = async (method, path, event, cors) => {
  const match = matchDraftRoute(method, path);
  if (!match) return null;
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  return match.handler(auth, event, match.id, cors);
};
