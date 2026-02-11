import { randomUUID } from "crypto";
import { isEditor } from "../roles.js";
import {
  listSubsystems, getSubsystem, putSubsystem, deleteSubsystem
} from "../storage.js";
import { jsonResponse, parseBody, slugify, authenticate } from "./utils.js";

export const handleSubsystems = async (method, path, event, cors) => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
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

  return null;
};
