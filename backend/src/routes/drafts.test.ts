import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isLockExpired } from "../storage";
import { checkLock, buildSnapshot, buildSubsystem } from "./drafts";
import type { Draft, CorsHeaders, Subsystem, SubsystemDraftData } from "../types";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                    */
/* ------------------------------------------------------------------ */
const cors: CorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const NOW = new Date("2025-06-01T12:00:00.000Z");

/* ------------------------------------------------------------------ */
/*  isLockExpired                                                     */
/* ------------------------------------------------------------------ */
describe("isLockExpired", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when lockedAt is undefined", () => {
    expect(isLockExpired(undefined)).toBe(true);
  });

  it("returns true when lock is older than 30 minutes", () => {
    const thirtyOneMinutesAgo = new Date(NOW.getTime() - 31 * 60 * 1000).toISOString();
    expect(isLockExpired(thirtyOneMinutesAgo)).toBe(true);
  });

  it("returns false when lock is less than 30 minutes old", () => {
    const twentyNineMinutesAgo = new Date(NOW.getTime() - 29 * 60 * 1000).toISOString();
    expect(isLockExpired(twentyNineMinutesAgo)).toBe(false);
  });

  it("returns false when lock was just created", () => {
    expect(isLockExpired(NOW.toISOString())).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  checkLock                                                         */
/* ------------------------------------------------------------------ */
describe("checkLock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when no existing draft", () => {
    expect(checkLock(null, "user-1", cors)).toBeNull();
  });

  it("returns null when draft belongs to the same user", () => {
    const draft: Draft = {
      stack: { items: [] },
      subsystems: {},
      lockedBy: "user-1",
      lockedAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
    expect(checkLock(draft, "user-1", cors)).toBeNull();
  });

  it("returns null when lock is expired (different user)", () => {
    const expiredTime = new Date(NOW.getTime() - 31 * 60 * 1000).toISOString();
    const draft: Draft = {
      stack: { items: [] },
      subsystems: {},
      lockedBy: "user-2",
      lockedAt: expiredTime,
      updatedAt: expiredTime,
    };
    expect(checkLock(draft, "user-1", cors)).toBeNull();
  });

  it("returns 423 response when locked by different user with active lock", () => {
    const recentTime = new Date(NOW.getTime() - 5 * 60 * 1000).toISOString();
    const draft: Draft = {
      stack: { items: [] },
      subsystems: {},
      lockedBy: "user-2",
      lockedAt: recentTime,
      updatedAt: recentTime,
    };
    const result = checkLock(draft, "user-1", cors);
    expect(result).not.toBeNull();
    expect(result!.statusCode).toBe(423);
    const body = JSON.parse(result!.body!) as {
      message: string;
      lockedBy: string;
      lockedAt: string;
    };
    expect(body.message).toBe("Project is locked by another user");
    expect(body.lockedBy).toBe("user-2");
    expect(body.lockedAt).toBe(recentTime);
  });
});

/* ------------------------------------------------------------------ */
/*  buildSnapshot                                                     */
/* ------------------------------------------------------------------ */
describe("buildSnapshot", () => {
  it("extracts items and providers from draft stack", () => {
    const draft: Draft = {
      stack: { items: ["react", "node"], providers: ["aws", "gcp"] },
      subsystems: {},
      lockedBy: "user-1",
      lockedAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
    const snapshot = buildSnapshot(draft);
    expect(snapshot.stack).toEqual(["react", "node"]);
    expect(snapshot.providers).toEqual(["aws", "gcp"]);
    expect(snapshot.subsystems).toEqual({});
  });

  it("includes subsystem data with name, additions, and exclusions", () => {
    const draft: Draft = {
      stack: { items: [] },
      subsystems: {
        "sub-1": { name: "Frontend", additions: ["vue"], exclusions: ["angular"] },
        "sub-2": { name: "Backend", additions: ["express"], exclusions: [] },
      },
      lockedBy: "user-1",
      lockedAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
    const snapshot = buildSnapshot(draft);
    expect(snapshot.subsystems["sub-1"]).toEqual({
      name: "Frontend",
      additions: ["vue"],
      exclusions: ["angular"],
    });
    expect(snapshot.subsystems["sub-2"]).toEqual({
      name: "Backend",
      additions: ["express"],
      exclusions: [],
    });
  });

  it("handles minimal draft with empty arrays", () => {
    const draft: Draft = {
      stack: { items: [] },
      subsystems: {},
      lockedBy: "user-1",
      lockedAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
    const snapshot = buildSnapshot(draft);
    expect(snapshot.stack).toEqual([]);
    expect(snapshot.providers).toEqual([]);
    expect(snapshot.subsystems).toEqual({});
  });
});

/* ------------------------------------------------------------------ */
/*  buildSubsystem                                                    */
/* ------------------------------------------------------------------ */
describe("buildSubsystem", () => {
  const now = "2025-06-01T12:00:00.000Z";
  const projectId = "proj-1";
  const userSub = "user-1";

  it("creates a new subsystem when no existing one is provided", () => {
    const subData: SubsystemDraftData = {
      name: "Frontend",
      additions: ["react"],
      exclusions: ["angular"],
      description: "The frontend layer",
    };
    const result = buildSubsystem("sub-1", subData, undefined, projectId, userSub, now);
    expect(result).toEqual({
      id: "sub-1",
      projectId,
      name: "Frontend",
      description: "The frontend layer",
      additions: ["react"],
      exclusions: ["angular"],
      createdBy: userSub,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("preserves createdBy and createdAt from existing subsystem", () => {
    const existing: Subsystem = {
      id: "sub-1",
      projectId,
      name: "Old Name",
      description: "Old description",
      additions: ["old-item"],
      exclusions: [],
      createdBy: "original-user",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };
    const subData: SubsystemDraftData = {
      name: "New Name",
      additions: ["new-item"],
      exclusions: ["removed-item"],
    };
    const result = buildSubsystem("sub-1", subData, existing, projectId, userSub, now);
    expect(result.createdBy).toBe("original-user");
    expect(result.createdAt).toBe("2025-01-01T00:00:00.000Z");
    expect(result.name).toBe("New Name");
    expect(result.additions).toEqual(["new-item"]);
    expect(result.exclusions).toEqual(["removed-item"]);
    expect(result.updatedAt).toBe(now);
  });
});
