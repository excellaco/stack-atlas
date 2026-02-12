// Integration tests for the Lambda handler. These test the full request flow
// from event → routing → auth → authorization → storage → response.
//
// Mock boundary: ONLY storage.ts (S3) and auth.ts (Cognito JWT) are mocked.
// Everything else runs for real: route matching, roles.ts authorization logic,
// utils.ts parsing, and response formatting. This catches integration bugs
// that unit tests miss (e.g. wrong status codes, missing CORS headers,
// authorization checks not wired up).
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

vi.mock("./storage");
vi.mock("./auth");

import { handler } from "./handler";
import { verifyAuth } from "./auth";
import {
  getProjectIndex,
  putProjectIndex,
  putStack,
  getRoles,
  getDraft,
  getDraftForProject,
  putDraft,
  deleteDraft,
  isLockExpired,
  listSubsystems,
  putSubsystem,
  appendCommit,
  ensureUserInRegistry,
} from "./storage";
import type { LambdaEvent, User, Roles } from "./types";

// isLockExpired is a pure function (no S3 calls) so we use the real
// implementation even though storage.ts is mocked. This avoids reimplementing
// the 30-minute expiry logic in tests and catches regressions in it.
const { isLockExpired: realIsLockExpired } =
  await vi.importActual<typeof import("./storage")>("./storage");

function makeEvent(
  method: string,
  path: string,
  opts?: { body?: unknown; token?: string }
): LambdaEvent {
  return {
    requestContext: { http: { method } },
    rawPath: path,
    headers: {
      origin: "https://stack-atlas.com",
      authorization: opts?.token ? `Bearer ${opts.token}` : "Bearer test-token",
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  } as LambdaEvent;
}

const adminUser: User = {
  sub: "admin-sub",
  email: "admin@test.com",
  groups: ["admins"],
};
const regularUser: User = {
  sub: "user-sub",
  email: "user@test.com",
  groups: [],
};
const mockRoles: Roles = {
  admins: [{ sub: "admin-sub", email: "admin@test.com" }],
  editors: {},
};

beforeAll(() => {
  process.env.ALLOWED_ORIGINS = "https://stack-atlas.com";
  process.env.DATA_BUCKET = "test-bucket";
});

beforeEach(() => {
  vi.mocked(verifyAuth).mockResolvedValue(adminUser);
  vi.mocked(getRoles).mockResolvedValue(mockRoles);
  vi.mocked(ensureUserInRegistry).mockResolvedValue(undefined);
  vi.mocked(isLockExpired).mockImplementation(realIsLockExpired);
});

describe("handler integration", () => {
  it("OPTIONS returns 204 with CORS", async () => {
    const res = await handler(makeEvent("OPTIONS", "/projects"));
    expect(res.statusCode).toBe(204);
    expect(res.headers?.["Access-Control-Allow-Origin"]).toBe("https://stack-atlas.com");
  });

  it("GET /nonexistent returns 404", async () => {
    const res = await handler(makeEvent("GET", "/nonexistent"));
    expect(res.statusCode).toBe(404);
    expect(res.body).toContain("Not found");
  });

  it("GET /projects as admin returns projects with canEdit true", async () => {
    vi.mocked(getProjectIndex).mockResolvedValue({
      projects: [
        {
          id: "p1",
          name: "Project 1",
          description: "",
          createdBy: "admin-sub",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    });

    const res = await handler(makeEvent("GET", "/projects"));
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body!) as { data: Array<{ canEdit: boolean }> };
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.canEdit).toBe(true);
  });

  it("POST /projects as admin creates project", async () => {
    vi.mocked(getProjectIndex).mockResolvedValue({ projects: [] });
    vi.mocked(putProjectIndex).mockResolvedValue(undefined);
    vi.mocked(putStack).mockResolvedValue(undefined);

    const res = await handler(
      makeEvent("POST", "/projects", {
        body: { name: "New Project", description: "desc" },
      })
    );
    expect(res.statusCode).toBe(201);

    expect(putProjectIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        projects: expect.arrayContaining([expect.objectContaining({ name: "New Project" })]),
      })
    );
    expect(putStack).toHaveBeenCalledWith("new-project", expect.objectContaining({ items: [] }));
  });

  it("POST /projects as non-admin returns 403", async () => {
    vi.mocked(verifyAuth).mockResolvedValue(regularUser);
    vi.mocked(getRoles).mockResolvedValue({ admins: [], editors: {} });

    const res = await handler(makeEvent("POST", "/projects", { body: { name: "test" } }));
    expect(res.statusCode).toBe(403);
  });

  it("PUT /projects/{id}/draft saves draft", async () => {
    vi.mocked(verifyAuth).mockResolvedValue(adminUser);
    vi.mocked(getDraftForProject).mockResolvedValue(null);
    vi.mocked(getDraft).mockResolvedValue(null);
    vi.mocked(putDraft).mockResolvedValue(undefined);

    const res = await handler(
      makeEvent("PUT", "/projects/p1/draft", {
        body: { stack: { items: ["react"] } },
      })
    );
    expect(res.statusCode).toBe(200);
    expect(putDraft).toHaveBeenCalled();
  });

  it("PUT /projects/{id}/draft returns 423 when locked by another user", async () => {
    vi.mocked(verifyAuth).mockResolvedValue(regularUser);
    vi.mocked(getRoles).mockResolvedValue({
      admins: [],
      editors: {
        p1: [{ sub: "user-sub", email: "user@test.com" }],
      },
    });
    vi.mocked(getDraftForProject).mockResolvedValue({
      lockedBy: "other-sub",
      lockedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      stack: { items: [] },
      subsystems: {},
      updatedAt: new Date().toISOString(),
    });

    const res = await handler(
      makeEvent("PUT", "/projects/p1/draft", {
        body: { stack: { items: ["react"] } },
      })
    );
    expect(res.statusCode).toBe(423);
  });

  it("POST /projects/{id}/commit performs full commit flow", async () => {
    vi.mocked(verifyAuth).mockResolvedValue(adminUser);
    vi.mocked(getDraft).mockResolvedValue({
      stack: { items: ["react", "node"], providers: ["aws"] },
      subsystems: {
        sub1: { name: "Frontend", additions: ["vite"], exclusions: [] },
      },
      lockedBy: "admin-sub",
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(listSubsystems).mockResolvedValue([]);
    vi.mocked(getProjectIndex).mockResolvedValue({
      projects: [
        {
          id: "p1",
          name: "Project 1",
          description: "",
          createdBy: "admin-sub",
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    });
    vi.mocked(putProjectIndex).mockResolvedValue(undefined);
    vi.mocked(putStack).mockResolvedValue(undefined);
    vi.mocked(putSubsystem).mockResolvedValue(undefined);
    vi.mocked(appendCommit).mockResolvedValue(undefined);
    vi.mocked(deleteDraft).mockResolvedValue(undefined);

    const res = await handler(
      makeEvent("POST", "/projects/p1/commit", {
        body: { message: "Initial commit" },
      })
    );
    expect(res.statusCode).toBe(201);
    expect(putStack).toHaveBeenCalled();
    expect(putSubsystem).toHaveBeenCalledWith(
      "p1",
      "sub1",
      expect.objectContaining({ name: "Frontend" })
    );
    expect(appendCommit).toHaveBeenCalled();
    expect(deleteDraft).toHaveBeenCalled();
  });
});
