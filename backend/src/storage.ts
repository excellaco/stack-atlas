import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type {
  ProjectIndex,
  Stack,
  Subsystem,
  Roles,
  Catalog,
  Draft,
  DraftWithMeta,
  CommitLog,
  CommitEntry,
  UserRegistry,
  User,
} from "./types";

const s3 = new S3Client({});
const BUCKET: string | undefined = process.env.DATA_BUCKET;

const readJson = async <T>(key: string): Promise<T | null> => {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body!.transformToString()) as T;
  } catch (err: unknown) {
    if (err instanceof Error && (err as Error & { name: string }).name === "NoSuchKey") return null;
    throw err;
  }
};

const writeJson = async (key: string, data: unknown): Promise<void> => {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    })
  );
};

const deleteKey = async (key: string): Promise<void> => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

const listKeys = async (prefix: string): Promise<(string | undefined)[]> => {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return (res.Contents || []).map((obj) => obj.Key);
};

// --- Projects ---

export const getProjectIndex = async (): Promise<ProjectIndex> => {
  const data = await readJson<ProjectIndex>("projects/index.json");
  return data || { projects: [] };
};

export const putProjectIndex = async (index: ProjectIndex): Promise<void> => {
  await writeJson("projects/index.json", index);
};

export const getStack = async (projectId: string): Promise<Stack | null> => {
  return readJson<Stack>(`projects/${projectId}/stack.json`);
};

export const putStack = async (projectId: string, stack: Stack): Promise<void> => {
  await writeJson(`projects/${projectId}/stack.json`, stack);
};

export const deleteProjectData = async (projectId: string): Promise<void> => {
  const keys = await listKeys(`projects/${projectId}/`);
  for (const key of keys) {
    if (key) await deleteKey(key);
  }
};

// --- Subsystems ---

export const listSubsystems = async (projectId: string): Promise<Subsystem[]> => {
  const keys = await listKeys(`projects/${projectId}/subsystems/`);
  const subsystems: Subsystem[] = [];
  for (const key of keys) {
    if (key?.endsWith(".json")) {
      const data = await readJson<Subsystem>(key);
      if (data) subsystems.push(data);
    }
  }
  return subsystems;
};

export const getSubsystem = async (
  projectId: string,
  subsystemId: string
): Promise<Subsystem | null> => {
  return readJson<Subsystem>(`projects/${projectId}/subsystems/${subsystemId}.json`);
};

export const putSubsystem = async (
  projectId: string,
  subsystemId: string,
  data: Subsystem
): Promise<void> => {
  await writeJson(`projects/${projectId}/subsystems/${subsystemId}.json`, data);
};

export const deleteSubsystem = async (projectId: string, subsystemId: string): Promise<void> => {
  await deleteKey(`projects/${projectId}/subsystems/${subsystemId}.json`);
};

// --- Roles ---

let rolesCache: Roles | null = null;

export const getRoles = async (): Promise<Roles> => {
  if (rolesCache) return rolesCache;
  const data = await readJson<Roles>("config/roles.json");
  rolesCache = data || { admins: [], editors: {} };
  return rolesCache;
};

export const putRoles = async (roles: Roles): Promise<void> => {
  await writeJson("config/roles.json", roles);
  rolesCache = roles;
};

export const invalidateRolesCache = (): void => {
  rolesCache = null;
};

// --- Catalog ---

let catalogCache: Catalog | null = null;

export const getCatalog = async (): Promise<Catalog | null> => {
  if (catalogCache) return catalogCache;
  const data = await readJson<Catalog>("config/catalog.json");
  catalogCache = data;
  return catalogCache;
};

export const putCatalog = async (catalog: Catalog): Promise<void> => {
  await writeJson("config/catalog.json", catalog);
  catalogCache = catalog;
};

// --- Drafts ---

const LOCK_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const getDraft = async (userSub: string, projectId: string): Promise<Draft | null> => {
  return readJson<Draft>(`drafts/${userSub}/${projectId}.json`);
};

export const getDraftForProject = async (projectId: string): Promise<Draft | null> => {
  const keys = await listKeys(`drafts/`);
  for (const key of keys) {
    if (key?.endsWith(`/${projectId}.json`)) {
      const data = await readJson<Draft>(key);
      if (data) return data;
    }
  }
  return null;
};

export const putDraft = async (userSub: string, projectId: string, data: Draft): Promise<void> => {
  await writeJson(`drafts/${userSub}/${projectId}.json`, data);
};

export const deleteDraft = async (userSub: string, projectId: string): Promise<void> => {
  await deleteKey(`drafts/${userSub}/${projectId}.json`);
};

export const isLockExpired = (lockedAt: string | undefined): boolean => {
  if (!lockedAt) return true;
  return Date.now() - new Date(lockedAt).getTime() > LOCK_EXPIRY_MS;
};

// --- Commits ---

export const getCommitLog = async (projectId: string): Promise<CommitLog> => {
  const data = await readJson<CommitLog>(`projects/${projectId}/commits.json`);
  return data || { commits: [] };
};

export const appendCommit = async (projectId: string, commit: CommitEntry): Promise<void> => {
  const log = await getCommitLog(projectId);
  log.commits.push(commit);
  await writeJson(`projects/${projectId}/commits.json`, log);
};

// --- User Registry ---

const registeredThisInvocation = new Set<string>();

export const getUserRegistry = async (): Promise<UserRegistry> => {
  const data = await readJson<UserRegistry>("config/users.json");
  return data || { users: {} };
};

export const ensureUserInRegistry = async (user: User): Promise<void> => {
  if (registeredThisInvocation.has(user.sub)) return;
  registeredThisInvocation.add(user.sub);
  const registry = await getUserRegistry();
  if (registry.users[user.sub]) return;
  registry.users[user.sub] = {
    email: user.email || "",
    name: user.name || "",
    firstSeen: new Date().toISOString(),
  };
  await writeJson("config/users.json", registry);
};

// --- Admin helpers ---

export const listAllDrafts = async (): Promise<DraftWithMeta[]> => {
  const keys = await listKeys("drafts/");
  const drafts: DraftWithMeta[] = [];
  for (const key of keys) {
    if (!key?.endsWith(".json")) continue;
    // Key format: drafts/{userSub}/{projectId}.json
    const parts = key.replace("drafts/", "").replace(".json", "").split("/");
    if (parts.length !== 2) continue;
    const data = await readJson<Draft>(key);
    if (data) {
      drafts.push({ userSub: parts[0]!, projectId: parts[1]!, ...data });
    }
  }
  return drafts;
};

export const listAllCommitLogs = async (): Promise<(CommitEntry & { projectId: string })[]> => {
  const keys = await listKeys("projects/");
  const commits: (CommitEntry & { projectId: string })[] = [];
  for (const key of keys) {
    if (!key?.endsWith("/commits.json")) continue;
    // Key format: projects/{projectId}/commits.json
    const projectId = key.split("/")[1];
    const data = await readJson<CommitLog>(key);
    if (data?.commits) {
      for (const commit of data.commits) {
        commits.push({ ...commit, projectId: projectId! });
      }
    }
  }
  return commits;
};
