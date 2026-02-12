import type { Category, EnrichedItem, ExportFormat } from "../types";

export const technologyTypes: Set<string> = new Set([
  "Capability",
  "Technique",
  "Pattern",
  "Practice",
  "Methodology",
  "Test Type",
  "Standard",
]);

export const toolTypes: Set<string> = new Set([
  "Tool",
  "Service",
  "Platform",
  "Framework",
  "Library",
  "Language",
  "Runtime",
  "DataStore",
]);

interface ExportEntry {
  name: string;
  type: string;
}

interface ExportCategory {
  name: string;
  technologies: ExportEntry[];
  tools: ExportEntry[];
}

interface ExportData {
  generatedAt: string;
  categories: ExportCategory[];
}

export const buildExportData = (
  selectedIds: string[],
  itemsById: Map<string, EnrichedItem>,
  categories: Category[]
): ExportData => {
  const selectedItems: EnrichedItem[] = selectedIds
    .map((id) => itemsById.get(id))
    .filter((item): item is EnrichedItem => item != null);

  const categoriesPayload: ExportCategory[] = categories
    .map((category) => {
      const categoryItems = selectedItems.filter((item) => item.category === category.id);

      if (!categoryItems.length) return null;

      const technologies: ExportEntry[] = categoryItems
        .filter((item) => technologyTypes.has(item.type))
        .map((item) => ({ name: item.name, type: item.type }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const tools: ExportEntry[] = categoryItems
        .filter((item) => toolTypes.has(item.type))
        .map((item) => ({ name: item.name, type: item.type }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        name: category.name,
        technologies,
        tools,
      };
    })
    .filter((c): c is ExportCategory => c != null);

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    categories: categoriesPayload,
  };
};

export const formatExport = (data: ExportData, format: ExportFormat): string => {
  if (!data.categories.length) {
    return "No items selected yet. Use the list to build a standardized stack.";
  }

  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  const lines: string[] = [`# Standardized Stack`, `Generated: ${data.generatedAt}`, ""];
  data.categories.forEach((category) => {
    lines.push(`## ${category.name}`);
    if (category.technologies.length) {
      lines.push(`- Technologies: ${category.technologies.map((item) => item.name).join("; ")}`);
    }
    if (category.tools.length) {
      lines.push(`- Tools: ${category.tools.map((item) => item.name).join("; ")}`);
    }
    lines.push("");
  });
  return lines.join("\n");
};
