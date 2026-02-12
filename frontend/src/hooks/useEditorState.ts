// Editor state hooks — filtering pipeline, selection tracking, and URL sync.
//
// Filtering pipeline (useFilteredSections):
//   Items pass through category → provider → type → tag → search query filters.
//   In hierarchy view mode, if a child matches, its parent is auto-included so
//   the tree isn't broken (addParentIds). Results are grouped by category into
//   Sections, with empty categories omitted.
//
// Cloud provider matching (matchesProvider):
//   Items tagged with "aws", "azure", or "gcp" are cloud-provider-specific.
//   When a provider filter is active, items WITH provider tags must match at
//   least one selected provider. Items WITHOUT any provider tags always pass —
//   they're cloud-agnostic (e.g. "Git", "Docker").
//
// Inheritance display (useSelectionState.inheritedSet):
//   When viewing a subsystem, inheritedSet contains items from the parent
//   project's committed stack that haven't been excluded by the subsystem.
//   These items show an "inherited" badge in the UI to distinguish them from
//   items the subsystem added on its own.
//
// URL sync (useUrlSync):
//   The /edit/:projectId/:subsystemId? route params drive project/subsystem
//   selection. Two effects sync URL → store: one for project, one for subsystem
//   (subsystem waits for subsystems list to load before syncing).
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { buildTree, flattenTree } from "../utils/tree";
import { buildExportData } from "../utils/export";
import { buildSearchText } from "../utils/search";
import { useStore } from "../store";
import {
  selectCatalogItems,
  selectItemsById,
  selectCategoryById,
  selectPendingChanges,
} from "../store/selectors";
import type { EnrichedItem, Category, Section } from "../types";

// These tag values are treated specially as cloud provider filters.
// Items with any of these tags are considered provider-specific; items
// without them are cloud-agnostic and pass all provider filters.
const PROVIDER_IDS = ["aws", "azure", "gcp"];

function matchesCategory(item: EnrichedItem, selectedCategories: string[]): boolean {
  return !selectedCategories.length || selectedCategories.includes(item.category);
}

function matchesProvider(item: EnrichedItem, selectedProviders: string[]): boolean {
  if (!selectedProviders.length) return true;
  const ip = PROVIDER_IDS.filter((p) => item.tags?.includes(p));
  return !ip.length || ip.some((p) => selectedProviders.includes(p));
}

function matchesType(item: EnrichedItem, selectedTypes: string[]): boolean {
  return !selectedTypes.length || selectedTypes.includes(item.type);
}

function matchesTags(item: EnrichedItem, selectedTags: string[]): boolean {
  return !selectedTags.length || selectedTags.every((tag) => item.tags?.includes(tag));
}

function matchesQuery(item: EnrichedItem, q: string, categoryById: Map<string, Category>): boolean {
  if (!q) return true;
  return buildSearchText(item, categoryById).includes(q);
}

function addParentIds(
  baseMatches: EnrichedItem[],
  itemsById: Map<string, EnrichedItem>,
  ids: Set<string>
): void {
  baseMatches.forEach((item) => {
    (item.parents || []).forEach((parentId) => {
      if (itemsById.has(parentId)) ids.add(parentId);
    });
  });
}

export function useUrlSync(sandbox: boolean | undefined): void {
  const params = useParams<{ projectId?: string; subsystemId?: string }>();
  const urlProjectId = sandbox ? null : params.projectId;
  const urlSubsystemId = sandbox ? null : params.subsystemId;

  const token = useStore((s) => s.token);
  const activeProject = useStore((s) => s.activeProject);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const projects = useStore((s) => s.projects);
  const subsystems = useStore((s) => s.subsystems);
  const selectProject = useStore((s) => s.selectProject);
  const selectSubsystem = useStore((s) => s.selectSubsystem);

  useEffect(() => {
    if (!urlProjectId || !token || !projects.length) return;
    if (activeProject?.id !== urlProjectId) selectProject(urlProjectId);
  }, [urlProjectId, token, projects.length, activeProject?.id, selectProject]);

  useEffect(() => {
    if (!urlSubsystemId || !activeProject || activeProject.id !== urlProjectId) return;
    if (!subsystems.length) return;
    if (activeSubsystem?.id !== urlSubsystemId) selectSubsystem(urlSubsystemId);
  }, [
    urlSubsystemId,
    urlProjectId,
    activeProject,
    activeSubsystem?.id,
    subsystems.length,
    selectSubsystem,
  ]);
}

export function useCatalogData(): {
  catalogItems: EnrichedItem[];
  itemsById: Map<string, EnrichedItem>;
  categoryById: Map<string, Category>;
} {
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);
  const catalogCategories = useStore((s) => s.catalogCategories);

  const catalogItems = useMemo(
    () =>
      selectCatalogItems({ catalogRawItems, catalogDescriptions } as Parameters<
        typeof selectCatalogItems
      >[0]),
    [catalogRawItems, catalogDescriptions]
  );
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems]);
  const categoryById = useMemo(
    () => selectCategoryById({ catalogCategories } as Parameters<typeof selectCategoryById>[0]),
    [catalogCategories]
  );

  return { catalogItems, itemsById, categoryById };
}

export function useSelectionState(itemsById: Map<string, EnrichedItem>): {
  selectedSet: Set<string>;
  inheritedSet: Set<string>;
  selectedByCategory: { category: Category; items: EnrichedItem[] }[];
  exportData: ReturnType<typeof buildExportData>;
} {
  const selectedItems = useStore((s) => s.selectedItems);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const savedStack = useStore((s) => s.savedStack);
  const catalogCategories = useStore((s) => s.catalogCategories);

  const selectedSet = useMemo(() => new Set(selectedItems), [selectedItems]);

  const inheritedSet = useMemo((): Set<string> => {
    if (!activeSubsystem || !savedStack) return new Set<string>();
    const parentSet = new Set(savedStack);
    const exclusionSet = new Set(activeSubsystem.exclusions || []);
    const inherited = new Set<string>();
    for (const id of parentSet) {
      if (!exclusionSet.has(id)) inherited.add(id);
    }
    return inherited;
  }, [activeSubsystem, savedStack]);

  const selectedByCategory = useMemo((): { category: Category; items: EnrichedItem[] }[] => {
    return catalogCategories
      .map((category) => {
        const catItems = selectedItems
          .map((id) => itemsById.get(id))
          .filter((item): item is EnrichedItem => Boolean(item))
          .filter((item) => item.category === category.id)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!catItems.length) return null;
        return { category, items: catItems };
      })
      .filter((entry): entry is { category: Category; items: EnrichedItem[] } => Boolean(entry));
  }, [selectedItems, catalogCategories, itemsById]);

  const exportData = useMemo(
    () => buildExportData(selectedItems, itemsById, catalogCategories),
    [selectedItems, itemsById, catalogCategories]
  );

  return { selectedSet, inheritedSet, selectedByCategory, exportData };
}

export function useFilteredSections(
  catalogItems: EnrichedItem[],
  itemsById: Map<string, EnrichedItem>,
  categoryById: Map<string, Category>
): Section[] {
  const query = useStore((s) => s.query);
  const selectedCategories = useStore((s) => s.selectedCategories);
  const selectedProviders = useStore((s) => s.selectedProviders);
  const selectedTypes = useStore((s) => s.selectedTypes);
  const selectedTags = useStore((s) => s.selectedTags);
  const viewMode = useStore((s) => s.viewMode);
  const catalogCategories = useStore((s) => s.catalogCategories);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const baseMatches = catalogItems.filter(
      (item) =>
        matchesCategory(item, selectedCategories) &&
        matchesProvider(item, selectedProviders) &&
        matchesType(item, selectedTypes) &&
        matchesTags(item, selectedTags) &&
        matchesQuery(item, q, categoryById)
    );
    const ids = new Set(baseMatches.map((item) => item.id));
    if (viewMode === "hierarchy") addParentIds(baseMatches, itemsById, ids);
    return catalogItems.filter((item) => ids.has(item.id));
  }, [
    query,
    selectedCategories,
    selectedProviders,
    selectedTypes,
    selectedTags,
    viewMode,
    catalogItems,
    categoryById,
    itemsById,
  ]);

  return useMemo((): Section[] => {
    return catalogCategories
      .map((category) => {
        const items = filteredItems.filter((item) => item.category === category.id);
        if (!items.length) return null;
        const displayItems =
          viewMode === "flat"
            ? [...items]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => ({ item, depth: 0 }))
            : flattenTree(buildTree(items));
        return { ...category, items: displayItems };
      })
      .filter((section): section is Section => Boolean(section));
  }, [filteredItems, viewMode, catalogCategories]);
}

export function useHasActualChanges(): boolean {
  const activeProject = useStore((s) => s.activeProject);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const selectedItems = useStore((s) => s.selectedItems);
  const savedStack = useStore((s) => s.savedStack);
  const savedProviders = useStore((s) => s.savedProviders);
  const selectedProviders = useStore((s) => s.selectedProviders);
  const subsystems = useStore((s) => s.subsystems);

  const pendingChanges = useMemo(
    () =>
      selectPendingChanges({
        activeProject,
        savedStack,
        activeSubsystem,
        subsystems,
        selectedItems,
        savedProviders,
        selectedProviders,
      } as Parameters<typeof selectPendingChanges>[0]),
    [
      activeProject,
      savedStack,
      activeSubsystem,
      subsystems,
      selectedItems,
      savedProviders,
      selectedProviders,
    ]
  );

  return !!(
    pendingChanges &&
    (pendingChanges.itemsAdded.length > 0 ||
      pendingChanges.itemsRemoved.length > 0 ||
      pendingChanges.providersAdded.length > 0 ||
      pendingChanges.providersRemoved.length > 0)
  );
}
