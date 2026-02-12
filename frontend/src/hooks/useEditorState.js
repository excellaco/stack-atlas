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

const PROVIDER_IDS = ["aws", "azure", "gcp"];

function matchesCategory(item, selectedCategories) {
  return !selectedCategories.length || selectedCategories.includes(item.category);
}

function matchesProvider(item, selectedProviders) {
  if (!selectedProviders.length) return true;
  const ip = PROVIDER_IDS.filter((p) => item.tags?.includes(p));
  return !ip.length || ip.some((p) => selectedProviders.includes(p));
}

function matchesType(item, selectedTypes) {
  return !selectedTypes.length || selectedTypes.includes(item.type);
}

function matchesTags(item, selectedTags) {
  return !selectedTags.length || selectedTags.every((tag) => item.tags?.includes(tag));
}

function matchesQuery(item, q, categoryById) {
  if (!q) return true;
  return buildSearchText(item, categoryById).includes(q);
}

function addParentIds(baseMatches, itemsById, ids) {
  baseMatches.forEach((item) => {
    (item.parents || []).forEach((parentId) => {
      if (itemsById.has(parentId)) ids.add(parentId);
    });
  });
}

export function useUrlSync(sandbox) {
  const params = useParams();
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

export function useCatalogData() {
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);
  const catalogCategories = useStore((s) => s.catalogCategories);

  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
    [catalogRawItems, catalogDescriptions]
  );
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems]);
  const categoryById = useMemo(
    () => selectCategoryById({ catalogCategories }),
    [catalogCategories]
  );

  return { catalogItems, itemsById, categoryById };
}

export function useSelectionState(itemsById) {
  const selectedItems = useStore((s) => s.selectedItems);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const savedStack = useStore((s) => s.savedStack);
  const catalogCategories = useStore((s) => s.catalogCategories);

  const selectedSet = useMemo(() => new Set(selectedItems), [selectedItems]);

  const inheritedSet = useMemo(() => {
    if (!activeSubsystem || !savedStack) return new Set();
    const parentSet = new Set(savedStack);
    const exclusionSet = new Set(activeSubsystem.exclusions || []);
    const inherited = new Set();
    for (const id of parentSet) {
      if (!exclusionSet.has(id)) inherited.add(id);
    }
    return inherited;
  }, [activeSubsystem, savedStack]);

  const selectedByCategory = useMemo(() => {
    return catalogCategories
      .map((category) => {
        const catItems = selectedItems
          .map((id) => itemsById.get(id))
          .filter(Boolean)
          .filter((item) => item.category === category.id)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!catItems.length) return null;
        return { category, items: catItems };
      })
      .filter(Boolean);
  }, [selectedItems, catalogCategories, itemsById]);

  const exportData = useMemo(
    () => buildExportData(selectedItems, itemsById, catalogCategories),
    [selectedItems, itemsById, catalogCategories]
  );

  return { selectedSet, inheritedSet, selectedByCategory, exportData };
}

export function useFilteredSections(catalogItems, itemsById, categoryById) {
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

  return useMemo(() => {
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
      .filter(Boolean);
  }, [filteredItems, viewMode, catalogCategories]);
}

export function useHasActualChanges() {
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
      }),
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

  return (
    pendingChanges &&
    (pendingChanges.itemsAdded.length > 0 ||
      pendingChanges.itemsRemoved.length > 0 ||
      pendingChanges.providersAdded.length > 0 ||
      pendingChanges.providersRemoved.length > 0)
  );
}
