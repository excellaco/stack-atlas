import { describe, it, expect, vi, afterEach } from "vitest";
import { computeDiff, formatTimeAgo } from "./diff";
import type { CommitSnapshot } from "../types";

describe("computeDiff", () => {
  it("detects items added to the stack", () => {
    const prev: CommitSnapshot = {
      stack: ["a"],
      providers: [],
      subsystems: {},
    };
    const curr: CommitSnapshot = {
      stack: ["a", "b"],
      providers: [],
      subsystems: {},
    };

    const diff = computeDiff(prev, curr);

    expect(diff.stackAdded).toEqual(["b"]);
    expect(diff.stackRemoved).toEqual([]);
  });

  it("detects items removed from the stack", () => {
    const prev: CommitSnapshot = {
      stack: ["a", "b"],
      providers: [],
      subsystems: {},
    };
    const curr: CommitSnapshot = {
      stack: ["a"],
      providers: [],
      subsystems: {},
    };

    const diff = computeDiff(prev, curr);

    expect(diff.stackRemoved).toEqual(["b"]);
    expect(diff.stackAdded).toEqual([]);
  });

  it("detects providers added", () => {
    const prev: CommitSnapshot = {
      stack: [],
      providers: ["aws"],
      subsystems: {},
    };
    const curr: CommitSnapshot = {
      stack: [],
      providers: ["aws", "gcp"],
      subsystems: {},
    };

    const diff = computeDiff(prev, curr);

    expect(diff.providersAdded).toEqual(["gcp"]);
    expect(diff.providersRemoved).toEqual([]);
  });

  it("detects a subsystem added", () => {
    const prev: CommitSnapshot = {
      stack: [],
      providers: [],
      subsystems: {},
    };
    const curr: CommitSnapshot = {
      stack: [],
      providers: [],
      subsystems: {
        s1: { name: "Sub One", additions: [], exclusions: [] },
      },
    };

    const diff = computeDiff(prev, curr);

    expect(diff.subsystemsAdded).toEqual([{ id: "s1", name: "Sub One" }]);
    expect(diff.subsystemsRemoved).toEqual([]);
  });

  it("detects a subsystem removed", () => {
    const prev: CommitSnapshot = {
      stack: [],
      providers: [],
      subsystems: {
        s1: { name: "Sub One", additions: [], exclusions: [] },
      },
    };
    const curr: CommitSnapshot = {
      stack: [],
      providers: [],
      subsystems: {},
    };

    const diff = computeDiff(prev, curr);

    expect(diff.subsystemsRemoved).toEqual([{ id: "s1", name: "Sub One" }]);
    expect(diff.subsystemsAdded).toEqual([]);
  });

  it("detects a subsystem changed (different additions)", () => {
    const prev: CommitSnapshot = {
      stack: [],
      providers: [],
      subsystems: {
        s1: { name: "Sub One", additions: ["x"], exclusions: [] },
      },
    };
    const curr: CommitSnapshot = {
      stack: [],
      providers: [],
      subsystems: {
        s1: { name: "Sub One", additions: ["x", "y"], exclusions: [] },
      },
    };

    const diff = computeDiff(prev, curr);

    expect(diff.subsystemsChanged).toHaveLength(1);
    expect(diff.subsystemsChanged[0]!.id).toBe("s1");
    expect(diff.subsystemsChanged[0]!.additionsAdded).toEqual(["y"]);
    expect(diff.subsystemsChanged[0]!.additionsRemoved).toEqual([]);
  });

  it("returns all empty arrays when both snapshots are null", () => {
    const diff = computeDiff(null, null);

    expect(diff.stackAdded).toEqual([]);
    expect(diff.stackRemoved).toEqual([]);
    expect(diff.providersAdded).toEqual([]);
    expect(diff.providersRemoved).toEqual([]);
    expect(diff.subsystemsAdded).toEqual([]);
    expect(diff.subsystemsRemoved).toEqual([]);
    expect(diff.subsystemsChanged).toEqual([]);
  });
});

describe("formatTimeAgo", () => {
  const NOW = new Date("2025-06-15T12:00:00Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  }

  it('returns "just now" for 30 seconds ago', () => {
    setup();
    const ts = new Date(NOW.getTime() - 30_000).toISOString();
    expect(formatTimeAgo(ts)).toBe("just now");
  });

  it('returns "5m ago" for 5 minutes ago', () => {
    setup();
    const ts = new Date(NOW.getTime() - 5 * 60_000).toISOString();
    expect(formatTimeAgo(ts)).toBe("5m ago");
  });

  it('returns "3h ago" for 3 hours ago', () => {
    setup();
    const ts = new Date(NOW.getTime() - 3 * 3_600_000).toISOString();
    expect(formatTimeAgo(ts)).toBe("3h ago");
  });

  it('returns "2d ago" for 2 days ago', () => {
    setup();
    const ts = new Date(NOW.getTime() - 2 * 86_400_000).toISOString();
    expect(formatTimeAgo(ts)).toBe("2d ago");
  });
});
