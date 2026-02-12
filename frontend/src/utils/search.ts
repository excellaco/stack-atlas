import type { Category, EnrichedItem } from "../types";

export const toggleInList = <T>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export const buildSearchText = (
  item: EnrichedItem,
  categoryById: Map<string, Category>
): string => {
  const parts: string[] = [
    item.name,
    item.type,
    item.description || "",
    ...(item.synonyms || []),
    ...(item.tags || []),
    categoryById.get(item.category)?.name || "",
  ];
  return parts.join(" ").toLowerCase();
};
