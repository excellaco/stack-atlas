import type {
  LambdaEvent,
  LambdaResponse,
  CorsHeaders,
  User,
  DraftWithMeta,
  CommitEntry,
} from "../types";
import { isAdmin } from "../roles";
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
} from "../storage";
import { jsonResponse, parseBody, authenticate } from "./utils";

type AdminRouteHandler = (
  auth: string | undefined,
  event: LambdaEvent,
  cors: CorsHeaders,
  extra?: RegExpMatchArray
) => Promise<LambdaResponse>;

async function requireAdmin(auth: string | undefined): Promise<User> {
  const user = await authenticate(auth);
  if (!(await isAdmin(user))) throw new Error("FORBIDDEN");
  return user;
}

async function getRolesRoute(
  auth: string | undefined,
  _event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await requireAdmin(auth);
  const roles = await getRoles();
  return jsonResponse(200, { data: roles }, cors);
}

async function putRolesRoute(
  auth: string | undefined,
  event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await requireAdmin(auth);
  const body = parseBody(event);
  if (!Array.isArray(body.admins) || typeof body.editors !== "object") {
    return jsonResponse(400, { message: "Invalid roles format" }, cors);
  }
  const validEntry = (e: unknown): boolean =>
    !!e &&
    typeof (e as Record<string, unknown>).sub === "string" &&
    typeof (e as Record<string, unknown>).email === "string";
  const validAdmins = (body.admins as unknown[]).every(validEntry);
  const validEditors = Object.values(body.editors as Record<string, unknown>).every(
    (arr) => Array.isArray(arr) && (arr as unknown[]).every(validEntry)
  );
  if (!validAdmins || !validEditors) {
    return jsonResponse(400, { message: "Each role entry must have { sub, email }" }, cors);
  }
  const roles = {
    admins: body.admins as { sub: string; email: string }[],
    editors: body.editors as Record<string, { sub: string; email: string }[]>,
  };
  await putRoles(roles);
  return jsonResponse(200, { data: roles }, cors);
}

async function getCatalogRoute(
  auth: string | undefined,
  _event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await authenticate(auth);
  const catalog = await getCatalog();
  if (!catalog) return jsonResponse(404, { message: "No catalog published" }, cors);
  return jsonResponse(200, { data: catalog }, cors);
}

async function putCatalogRoute(
  auth: string | undefined,
  event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
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
  const validItem = (i: unknown): boolean =>
    !!i &&
    typeof (i as Record<string, unknown>).id === "string" &&
    typeof (i as Record<string, unknown>).name === "string" &&
    typeof (i as Record<string, unknown>).category === "string" &&
    typeof (i as Record<string, unknown>).type === "string";
  if (!(body.items as unknown[]).every(validItem)) {
    return jsonResponse(400, { message: "Each item must have id, name, category, and type" }, cors);
  }
  const catalog = {
    categories: body.categories as {
      id: string;
      name: string;
      description: string;
      color: string;
    }[],
    types: body.types as string[],
    descriptions: body.descriptions as Record<string, string>,
    items: body.items as { id: string; name: string; category: string; type: string }[],
  };
  await putCatalog(catalog);
  return jsonResponse(200, { data: catalog }, cors);
}

async function getUsersRoute(
  auth: string | undefined,
  _event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await requireAdmin(auth);
  const registry = await getUserRegistry();
  return jsonResponse(200, { data: registry.users }, cors);
}

async function getLocksRoute(
  auth: string | undefined,
  _event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await requireAdmin(auth);
  const allDrafts = await listAllDrafts();
  const registry = await getUserRegistry();
  const activeLocks = allDrafts
    .filter((d: DraftWithMeta) => !isLockExpired(d.lockedAt))
    .map((d: DraftWithMeta) => ({
      projectId: d.projectId,
      userSub: d.userSub,
      email: registry.users[d.lockedBy]?.email || d.lockedBy,
      lockedAt: d.lockedAt,
      updatedAt: d.updatedAt,
    }));
  return jsonResponse(200, { data: activeLocks }, cors);
}

async function getActivityRoute(
  auth: string | undefined,
  _event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse> {
  await requireAdmin(auth);
  const allCommits = await listAllCommitLogs();
  const index = await getProjectIndex();
  const projectNames = Object.fromEntries(index.projects.map((p) => [p.id, p.name]));
  const enriched = allCommits
    .map((c: CommitEntry & { projectId: string }) => ({
      ...c,
      projectName: projectNames[c.projectId] || c.projectId,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);
  return jsonResponse(200, { data: enriched }, cors);
}

async function deleteLockRoute(
  auth: string | undefined,
  _event: LambdaEvent,
  cors: CorsHeaders,
  lockMatch?: RegExpMatchArray
): Promise<LambdaResponse> {
  await requireAdmin(auth);
  const projectId = decodeURIComponent(lockMatch![1]!);
  const userSub = decodeURIComponent(lockMatch![2]!);
  await deleteDraft(userSub, projectId);
  return jsonResponse(200, { message: "Lock broken" }, cors);
}

const routes: Record<string, AdminRouteHandler> = {
  "GET /admin/roles": getRolesRoute,
  "PUT /admin/roles": putRolesRoute,
  "GET /catalog": getCatalogRoute,
  "PUT /admin/catalog": putCatalogRoute,
  "GET /admin/users": getUsersRoute,
  "GET /admin/locks": getLocksRoute,
  "GET /admin/activity": getActivityRoute,
};

async function dispatch(
  handler: AdminRouteHandler,
  auth: string | undefined,
  event: LambdaEvent,
  cors: CorsHeaders,
  extra?: RegExpMatchArray
): Promise<LambdaResponse> {
  try {
    return await handler(auth, event, cors, extra);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return jsonResponse(403, { message: "Admin access required" }, cors);
    }
    throw err;
  }
}

export const handleAdmin = async (
  method: string,
  path: string,
  event: LambdaEvent,
  cors: CorsHeaders
): Promise<LambdaResponse | null> => {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;

  const handler = routes[`${method} ${path}`];
  if (handler) return dispatch(handler, auth, event, cors);

  const lockMatch = path.match(/^\/admin\/locks\/([^/]+)\/([^/]+)$/);
  if (method === "DELETE" && lockMatch) {
    return dispatch(deleteLockRoute, auth, event, cors, lockMatch);
  }

  return null;
};
