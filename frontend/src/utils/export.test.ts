import { describe, it, expect } from "vitest";
import { buildExportData, formatExport } from "./export";
import type { Category, EnrichedItem } from "../types";

// --- Fixtures ---

const categories: Category[] = [
  { id: "devops", name: "DevOps", description: "", color: "#000" },
  { id: "security", name: "Security", description: "", color: "#000" },
];

const items: EnrichedItem[] = [
  { id: "docker", name: "Docker", type: "Tool", category: "devops", tags: [] },
  { id: "ci-cd", name: "CI/CD", type: "Capability", category: "devops", tags: [] },
  { id: "sast", name: "SAST", type: "Technique", category: "security", tags: [] },
];

const itemsById = new Map(items.map((i) => [i.id, i]));

// --- buildExportData ---

describe("buildExportData", () => {
  it("filters to selected IDs only", () => {
    const data = buildExportData(["docker"], itemsById, categories);
    const allNames = data.categories.flatMap((c) =>
      [...c.technologies, ...c.tools].map((e) => e.name)
    );
    expect(allNames).toEqual(["Docker"]);
  });

  it("groups items by category", () => {
    const data = buildExportData(["docker", "sast"], itemsById, categories);
    const catNames = data.categories.map((c) => c.name);
    expect(catNames).toContain("DevOps");
    expect(catNames).toContain("Security");
    expect(catNames).toHaveLength(2);
  });

  it("puts Capability into technologies and Tool into tools", () => {
    const data = buildExportData(["docker", "ci-cd"], itemsById, categories);
    const devops = data.categories.find((c) => c.name === "DevOps")!;
    expect(devops.tools.map((t) => t.name)).toContain("Docker");
    expect(devops.technologies.map((t) => t.name)).toContain("CI/CD");
  });

  it("omits categories with no selected items", () => {
    const data = buildExportData(["docker"], itemsById, categories);
    const catNames = data.categories.map((c) => c.name);
    expect(catNames).not.toContain("Security");
  });
});

// --- formatExport ---

describe("formatExport", () => {
  it("produces valid JSON for json format", () => {
    const data = buildExportData(["docker"], itemsById, categories);
    const output = formatExport(data, "json");
    const parsed = JSON.parse(output) as { generatedAt: string; categories: unknown[] };
    expect(parsed).toHaveProperty("generatedAt");
    expect(parsed).toHaveProperty("categories");
    expect(Array.isArray(parsed.categories)).toBe(true);
  });

  it("produces markdown with header and category names", () => {
    const data = buildExportData(["docker", "sast"], itemsById, categories);
    const output = formatExport(data, "markdown");
    expect(output).toMatch(/^# Standardized Stack/);
    expect(output).toContain("DevOps");
    expect(output).toContain("Security");
  });

  it('returns "No items selected" when categories are empty', () => {
    const data = buildExportData([], itemsById, categories);
    const output = formatExport(data, "markdown");
    expect(output).toContain("No items selected");
  });
});
