import { describe, it, expect } from "vitest";
import { selectDirty, selectPendingChanges, selectCategoryCounts } from "./selectors";
import type { StoreState } from "./types";
import type { EnrichedItem } from "../types";

// --- Helper ---

function makeState(overrides: Partial<StoreState>): StoreState {
  return {
    activeProject: {
      id: "p1",
      name: "P1",
      description: "",
      createdBy: "user",
      createdAt: "",
      updatedAt: "",
    },
    selectedItems: [],
    lastSavedItems: [],
    selectedProviders: [],
    lastSavedProviders: [],
    savedStack: [],
    subsystems: [],
    activeSubsystem: null,
    savedProviders: [],
    ...overrides,
  } as unknown as StoreState;
}

// --- selectDirty ---

describe("selectDirty", () => {
  it("returns false when items and providers match", () => {
    const state = makeState({
      selectedItems: ["a", "b"],
      lastSavedItems: ["a", "b"],
      selectedProviders: ["aws"],
      lastSavedProviders: ["aws"],
    });
    expect(selectDirty(state)).toBe(false);
  });

  it("returns true when an item is added", () => {
    const state = makeState({
      selectedItems: ["a", "b"],
      lastSavedItems: ["a"],
      selectedProviders: [],
      lastSavedProviders: [],
    });
    expect(selectDirty(state)).toBe(true);
  });

  it("returns true when an item is removed", () => {
    const state = makeState({
      selectedItems: ["a"],
      lastSavedItems: ["a", "b"],
      selectedProviders: [],
      lastSavedProviders: [],
    });
    expect(selectDirty(state)).toBe(true);
  });

  it("returns true when providers differ", () => {
    const state = makeState({
      selectedItems: ["a"],
      lastSavedItems: ["a"],
      selectedProviders: ["aws", "gcp"],
      lastSavedProviders: ["aws"],
    });
    expect(selectDirty(state)).toBe(true);
  });

  it("returns false when there is no active project", () => {
    const state = makeState({
      activeProject: null,
      selectedItems: ["a"],
      lastSavedItems: [],
    });
    expect(selectDirty(state)).toBe(false);
  });
});

// --- selectPendingChanges ---

describe("selectPendingChanges", () => {
  it("detects items added since last save", () => {
    const state = makeState({
      savedStack: ["a"],
      selectedItems: ["a", "b"],
      savedProviders: [],
      selectedProviders: [],
    });
    const changes = selectPendingChanges(state)!;
    expect(changes.itemsAdded).toEqual(["b"]);
    expect(changes.itemsRemoved).toEqual([]);
  });

  it("detects items removed since last save", () => {
    const state = makeState({
      savedStack: ["a", "b"],
      selectedItems: ["a"],
      savedProviders: [],
      selectedProviders: [],
    });
    const changes = selectPendingChanges(state)!;
    expect(changes.itemsRemoved).toEqual(["b"]);
    expect(changes.itemsAdded).toEqual([]);
  });

  it("returns null when there is no active project", () => {
    const state = makeState({
      activeProject: null,
      savedStack: ["a"],
      selectedItems: ["a", "b"],
    });
    expect(selectPendingChanges(state)).toBeNull();
  });
});

// --- selectCategoryCounts ---

describe("selectCategoryCounts", () => {
  const makeItem = (id: string, category: string): EnrichedItem =>
    ({ id, name: id, type: "Tool", category, tags: [] }) as EnrichedItem;

  it("counts multiple items in the same category", () => {
    const items = [makeItem("a", "devops"), makeItem("b", "devops")];
    const counts = selectCategoryCounts(items);
    expect(counts["devops"]).toBe(2);
  });

  it("counts items in different categories separately", () => {
    const items = [makeItem("a", "devops"), makeItem("b", "security"), makeItem("c", "security")];
    const counts = selectCategoryCounts(items);
    expect(counts["devops"]).toBe(1);
    expect(counts["security"]).toBe(2);
  });
});
