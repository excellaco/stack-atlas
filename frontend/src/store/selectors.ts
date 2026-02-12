import { enrichItems } from "../data/stackData";
import type { Category, EnrichedItem, PendingChanges } from "../types";
import type { StoreState } from "./types";

// Selectors are plain functions (not hooks) so they can be unit-tested without
// React. Components use them inside useMemo for memoization. This pattern keeps
// derived state logic testable and out of components.

export const selectCatalogItems = (s: StoreState): EnrichedItem[] =>
  enrichItems(s.catalogRawItems || [], s.catalogDescriptions || {});

export const selectItemsById = (items: EnrichedItem[]): Map<string, EnrichedItem> =>
  new Map((items || []).map((item) => [item.id, item]));

export const selectCategoryById = (s: StoreState): Map<string, Category> =>
  new Map((s.catalogCategories || []).map((c) => [c.id, c]));

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

// selectDirty drives the auto-save trigger. It compares current selections
// against last-saved state using set membership (not reference equality).
// False negatives here = lost work. False positives = extra saves (harmless).
export const selectDirty = (s: StoreState): boolean => {
  if (!s.activeProject || !s.lastSavedItems) return false;
  const selectedItems = s.selectedItems || [];
  const lastSavedItems = s.lastSavedItems || [];
  const selectedProviders = s.selectedProviders || [];
  const lastSavedProviders = s.lastSavedProviders || [];
  if (selectedItems.length !== lastSavedItems.length) return true;
  const saved = new Set(lastSavedItems);
  if (selectedItems.some((id) => !saved.has(id))) return true;
  if (selectedProviders.length !== lastSavedProviders.length) return true;
  const sp = new Set(lastSavedProviders);
  if (selectedProviders.some((p) => !sp.has(p))) return true;
  return false;
};

export const selectPendingChanges = (s: StoreState): PendingChanges | null => {
  if (!s.activeProject || !s.savedStack) return null;
  let committedItems: string[] = s.savedStack;
  if (s.activeSubsystem) {
    const committedSub = (s.subsystems || []).find((sub) => sub.id === s.activeSubsystem!.id);
    if (committedSub) {
      const parentSet = new Set(s.savedStack);
      (committedSub.exclusions || []).forEach((id) => parentSet.delete(id));
      (committedSub.additions || []).forEach((id) => parentSet.add(id));
      committedItems = Array.from(parentSet);
    }
  }
  const selectedItems = s.selectedItems || [];
  const selectedProviders = s.selectedProviders || [];
  const savedProviders = s.savedProviders || [];
  const savedSet = new Set(committedItems);
  const currentSet = new Set(selectedItems);
  const itemsAdded: string[] = selectedItems.filter((id) => !savedSet.has(id));
  const itemsRemoved: string[] = committedItems.filter((id) => !currentSet.has(id));
  const savedProvSet = new Set(savedProviders);
  const currProvSet = new Set(selectedProviders);
  const providersAdded: string[] = selectedProviders.filter((p) => !savedProvSet.has(p));
  const providersRemoved: string[] = savedProviders.filter((p) => !currProvSet.has(p));
  return { itemsAdded, itemsRemoved, providersAdded, providersRemoved };
};
