import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.DATA_BUCKET;

const readJson = async (key) => {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body.transformToString());
  } catch (err) {
    if (err.name === "NoSuchKey") return null;
    throw err;
  }
};

const writeJson = async (key, data) => {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json"
  }));
};

const deleteKey = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

const listKeys = async (prefix) => {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
  return (res.Contents || []).map((obj) => obj.Key);
};

// --- Projects ---

export const getProjectIndex = async () => {
  const data = await readJson("projects/index.json");
  return data || { projects: [] };
};

export const putProjectIndex = async (index) => {
  await writeJson("projects/index.json", index);
};

export const getStack = async (projectId) => {
  return readJson(`projects/${projectId}/stack.json`);
};

export const putStack = async (projectId, stack) => {
  await writeJson(`projects/${projectId}/stack.json`, stack);
};

export const deleteProjectData = async (projectId) => {
  const keys = await listKeys(`projects/${projectId}/`);
  for (const key of keys) {
    await deleteKey(key);
  }
};

// --- Subsystems ---

export const listSubsystems = async (projectId) => {
  const keys = await listKeys(`projects/${projectId}/subsystems/`);
  const subsystems = [];
  for (const key of keys) {
    if (key.endsWith(".json")) {
      const data = await readJson(key);
      if (data) subsystems.push(data);
    }
  }
  return subsystems;
};

export const getSubsystem = async (projectId, subsystemId) => {
  return readJson(`projects/${projectId}/subsystems/${subsystemId}.json`);
};

export const putSubsystem = async (projectId, subsystemId, data) => {
  await writeJson(`projects/${projectId}/subsystems/${subsystemId}.json`, data);
};

export const deleteSubsystem = async (projectId, subsystemId) => {
  await deleteKey(`projects/${projectId}/subsystems/${subsystemId}.json`);
};

// --- Roles ---

let rolesCache = null;

export const getRoles = async () => {
  if (rolesCache) return rolesCache;
  const data = await readJson("config/roles.json");
  rolesCache = data || { admins: [], editors: {} };
  return rolesCache;
};

export const putRoles = async (roles) => {
  await writeJson("config/roles.json", roles);
  rolesCache = roles;
};

export const invalidateRolesCache = () => {
  rolesCache = null;
};

// --- Drafts ---

const LOCK_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const getDraft = async (userSub, projectId) => {
  return readJson(`drafts/${userSub}/${projectId}.json`);
};

export const getDraftForProject = async (projectId) => {
  const keys = await listKeys(`drafts/`);
  for (const key of keys) {
    if (key.endsWith(`/${projectId}.json`)) {
      const data = await readJson(key);
      if (data) return data;
    }
  }
  return null;
};

export const putDraft = async (userSub, projectId, data) => {
  await writeJson(`drafts/${userSub}/${projectId}.json`, data);
};

export const deleteDraft = async (userSub, projectId) => {
  await deleteKey(`drafts/${userSub}/${projectId}.json`);
};

export const isLockExpired = (lockedAt) => {
  if (!lockedAt) return true;
  return Date.now() - new Date(lockedAt).getTime() > LOCK_EXPIRY_MS;
};

// --- Commits ---

export const getCommitLog = async (projectId) => {
  const data = await readJson(`projects/${projectId}/commits.json`);
  return data || { commits: [] };
};

export const appendCommit = async (projectId, commit) => {
  const log = await getCommitLog(projectId);
  log.commits.push(commit);
  await writeJson(`projects/${projectId}/commits.json`, log);
};
