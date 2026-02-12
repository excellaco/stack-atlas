import { randomUUID } from "crypto";
import type { LambdaEvent, LambdaResponse, CorsHeaders, Subsystem } from "../types";
import { isEditor } from "../roles";
import { listSubsystems, getSubsystem, putSubsystem, deleteSubsystem } from "../storage";
import { jsonResponse, parseBody, slugify, authenticate } from "./utils";

async function listRoute(
  auth: string | undefined,
  projectId: string,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await authenticate(auth);
  const subs = await listSubsystems(projectId);
  return jsonResponse(200, { data: subs }, cors);
}

async function createRoute(
  auth: string | undefined,
  event: LambdaEvent,
  projectId: string,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const body = parseBody(event);
  if (!(body.name as string | undefined)?.trim())
    return jsonResponse(400, { message: "Subsystem name is required" }, cors);
  const now = new Date().toISOString();
  const id = slugify(body.name as string) || randomUUID();
  const existing = await getSubsystem(projectId, id);
  if (existing)
    return jsonResponse(409, { message: "Subsystem with this name already exists" }, cors);
  const sub: Subsystem = {
    id,
    projectId,
    name: (body.name as string).trim(),
    description: ((body.description as string) || "").trim(),
    additions: (body.additions as string[]) || [],
    exclusions: (body.exclusions as string[]) || [],
    createdBy: user.sub,
    createdAt: now,
    updatedAt: now,
  };
  await putSubsystem(projectId, id, sub);
  return jsonResponse(201, { data: sub }, cors);
}

async function updateRoute(
  auth: string | undefined,
  event: LambdaEvent,
  projectId: string,
  subId: string,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const existing = await getSubsystem(projectId, subId);
  if (!existing) return jsonResponse(404, { message: "Subsystem not found" }, cors);
  const body = parseBody(event);
  if ((body.name as string | undefined)?.trim()) existing.name = (body.name as string).trim();
  if (body.description !== undefined)
    existing.description = ((body.description as string) || "").trim();
  if (Array.isArray(body.additions)) existing.additions = body.additions as string[];
  if (Array.isArray(body.exclusions)) existing.exclusions = body.exclusions as string[];
  existing.updatedAt = new Date().toISOString();
  await putSubsystem(projectId, subId, existing);
  return jsonResponse(200, { data: existing }, cors);
}

async function removeRoute(
  auth: string | undefined,
  projectId: string,
  subId: string,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  const user = await authenticate(auth);
  if (!(await isEditor(user, projectId)))
    return jsonResponse(403, { message: "Editor access required" }, cors);
  const existing = await getSubsystem(projectId, subId);
  if (!existing) return jsonResponse(404, { message: "Subsystem not found" }, cors);
  await deleteSubsystem(projectId, subId);
  return jsonResponse(200, { message: "Deleted" }, cors);
}

export const handleSubsystems = async (
  method: string,
  path: string,
  event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse | null> => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  const subsystemsMatch = path.match(/^\/projects\/([^/]+)\/subsystems$/);
  const subsystemMatch = path.match(/^\/projects\/([^/]+)\/subsystems\/([^/]+)$/);

  if (subsystemsMatch) {
    const projectId = decodeURIComponent(subsystemsMatch[1]!);
    if (method === "GET") return listRoute(auth, projectId, cors);
    if (method === "POST") return createRoute(auth, event, projectId, cors);
  }
  if (subsystemMatch) {
    const projectId = decodeURIComponent(subsystemMatch[1]!);
    const subId = decodeURIComponent(subsystemMatch[2]!);
    if (method === "PUT") return updateRoute(auth, event, projectId, subId, cors);
    if (method === "DELETE") return removeRoute(auth, projectId, subId, cors);
  }

  return null;
};
