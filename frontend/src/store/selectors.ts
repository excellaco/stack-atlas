import { enrichItems } from "../data/stackData";
import type { Category, EnrichedItem, PendingChanges } from "../types";
import type { StoreState } from "./types";

// Catalog-derived selectors
// These are plain functions that take state and return derived values.
// Use with useMemo in components for memoization.

export const selectCatalogItems = (s: StoreState): EnrichedItem[] =>
  enrichItems(s.catalogRawItems, s.catalogDescriptions);

export const selectItemsById = (items: EnrichedItem[]): Map<string, EnrichedItem> =>
  new Map(items.map((item) => [item.id, item]));

export const selectCategoryById = (s: StoreState): Map<string, Category> =>
  new Map(s.catalogCategories.map((c) => [c.id, c]));

export const selectCategoryCounts = (items: EnrichedItem[]): Record<string, number> =>
  items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

export const selectTagCounts = (items: EnrichedItem[]): Record<string, number> =>
  items.reduce<Record<string, number>>((acc, item) => {
    (item.tags || []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

export const selectTagList = (tagCounts: Record<string, number>): string[] =>
  Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag]) => tag);

export const selectIsAdmin = (s: StoreState): boolean =>
  s.user?.groups?.includes("admins") || false;

// Draft-derived selectors
export const selectDirty = (s: StoreState): boolean => {
  if (!s.activeProject || !s.lastSavedItems) return false;
  if (s.selectedItems.length !== s.lastSavedItems.length) return true;
  const saved = new Set(s.lastSavedItems);
  if (s.selectedItems.some((id) => !saved.has(id))) return true;
  if (s.selectedProviders.length !== s.lastSavedProviders.length) return true;
  const sp = new Set(s.lastSavedProviders);
  if (s.selectedProviders.some((p) => !sp.has(p))) return true;
  return false;
};

export const selectPendingChanges = (s: StoreState): PendingChanges | null => {
  if (!s.activeProject || !s.savedStack) return null;
  let committedItems: string[] = s.savedStack;
  if (s.activeSubsystem) {
    const committedSub = s.subsystems.find((sub) => sub.id === s.activeSubsystem!.id);
    if (committedSub) {
      const parentSet = new Set(s.savedStack);
      (committedSub.exclusions || []).forEach((id) => parentSet.delete(id));
      (committedSub.additions || []).forEach((id) => parentSet.add(id));
      committedItems = Array.from(parentSet);
    }
  }
  const savedSet = new Set(committedItems);
  const currentSet = new Set(s.selectedItems);
  const itemsAdded: string[] = s.selectedItems.filter((id) => !savedSet.has(id));
  const itemsRemoved: string[] = committedItems.filter((id) => !currentSet.has(id));
  const savedProvSet = new Set(s.savedProviders);
  const currProvSet = new Set(s.selectedProviders);
  const providersAdded: string[] = s.selectedProviders.filter((p) => !savedProvSet.has(p));
  const providersRemoved: string[] = s.savedProviders.filter((p) => !currProvSet.has(p));
  return { itemsAdded, itemsRemoved, providersAdded, providersRemoved };
};
