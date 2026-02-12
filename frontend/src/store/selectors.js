import { enrichItems } from "../data/stackData";

// Catalog-derived selectors
// These are plain functions that take state and return derived values.
// Use with useMemo in components for memoization.

export const selectCatalogItems = (s) => enrichItems(s.catalogRawItems, s.catalogDescriptions);

export const selectItemsById = (items) => new Map(items.map((item) => [item.id, item]));

export const selectCategoryById = (s) => new Map(s.catalogCategories.map((c) => [c.id, c]));

export const selectCategoryCounts = (items) =>
  items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

export const selectTagCounts = (items) =>
  items.reduce((acc, item) => {
    (item.tags || []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

export const selectTagList = (tagCounts) =>
  Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag]) => tag);

export const selectIsAdmin = (s) => s.user?.groups?.includes("admins") || false;

// Draft-derived selectors
export const selectDirty = (s) => {
  if (!s.activeProject || !s.lastSavedItems) return false;
  if (s.selectedItems.length !== s.lastSavedItems.length) return true;
  const saved = new Set(s.lastSavedItems);
  if (s.selectedItems.some((id) => !saved.has(id))) return true;
  if (s.selectedProviders.length !== s.lastSavedProviders.length) return true;
  const sp = new Set(s.lastSavedProviders);
  if (s.selectedProviders.some((p) => !sp.has(p))) return true;
  return false;
};

export const selectPendingChanges = (s) => {
  if (!s.activeProject || !s.savedStack) return null;
  let committedItems = s.savedStack;
  if (s.activeSubsystem) {
    const committedSub = s.subsystems.find((sub) => sub.id === s.activeSubsystem.id);
    if (committedSub) {
      const parentSet = new Set(s.savedStack);
      (committedSub.exclusions || []).forEach((id) => parentSet.delete(id));
      (committedSub.additions || []).forEach((id) => parentSet.add(id));
      committedItems = Array.from(parentSet);
    }
  }
  const savedSet = new Set(committedItems);
  const currentSet = new Set(s.selectedItems);
  const itemsAdded = s.selectedItems.filter((id) => !savedSet.has(id));
  const itemsRemoved = committedItems.filter((id) => !currentSet.has(id));
  const savedProvSet = new Set(s.savedProviders);
  const currProvSet = new Set(s.selectedProviders);
  const providersAdded = s.selectedProviders.filter((p) => !savedProvSet.has(p));
  const providersRemoved = s.savedProviders.filter((p) => !currProvSet.has(p));
  return { itemsAdded, itemsRemoved, providersAdded, providersRemoved };
};
