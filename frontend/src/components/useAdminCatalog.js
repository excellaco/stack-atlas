import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import * as actions from "./catalogActions";

function useFilteredItems(editItems, itemCategoryFilter, itemSearch) {
  return useMemo(() => {
    let result = editItems;
    if (itemCategoryFilter) {
      result = result.filter((i) => i.category === itemCategoryFilter);
    }
    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [editItems, itemCategoryFilter, itemSearch]);
}

function useSyncFromStore(storeState, setters) {
  const { catalogCategories, catalogRawItems, catalogTypes, catalogDescriptions } = storeState;
  useEffect(() => {
    setters.setEditCategories(catalogCategories);
    setters.setEditItems(catalogRawItems);
    setters.setEditTypes(catalogTypes);
    setters.setEditDescriptions(catalogDescriptions);
    setters.setCatalogDirty(false);
  }, [catalogCategories, catalogRawItems, catalogTypes, catalogDescriptions, setters]);
}

function buildHandlers(token, setCatalogFromPublish, editState, setters) {
  const { editCategories, editTypes, editDescriptions, editItems, editingItem } = editState;
  return {
    handlePublishCatalog: (setSaving, setError) => {
      const handler = actions.createPublishHandler({
        editCategories,
        editTypes,
        editDescriptions,
        editItems,
        setCatalogDirty: setters.setCatalogDirty,
      });
      return handler(token, setCatalogFromPublish, setSaving, setError);
    },
    handleUploadCatalog: (e, setError) => actions.handleUploadCatalog(e, setters, setError),
    handleSeedFromStatic: () => actions.handleSeedFromStatic(setters),
    handleSaveCatalogItem: (itemData, desc) =>
      actions.saveCatalogItem(itemData, desc, editingItem, setters),
    handleDeleteCatalogItem: (itemId) => actions.deleteCatalogItem(itemId, setters),
    handleSaveCatalogCategory: (catData) => actions.saveCatalogCategory(catData, setters),
    handleDeleteCatalogCategory: (catId) =>
      actions.deleteCatalogCategory(catId, editItems, setters),
  };
}

function useCatalogEditState(
  catalogCategories,
  catalogRawItems,
  catalogTypes,
  catalogDescriptions
) {
  const [editCategories, setEditCategories] = useState(catalogCategories);
  const [editItems, setEditItems] = useState(catalogRawItems);
  const [editTypes, setEditTypes] = useState(catalogTypes);
  const [editDescriptions, setEditDescriptions] = useState(catalogDescriptions);
  const [catalogDirty, setCatalogDirty] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("");
  const setters = {
    setEditCategories,
    setEditItems,
    setEditTypes,
    setEditDescriptions,
    setCatalogDirty,
    setEditingItem,
    setEditingCategory,
  };
  return {
    editCategories,
    editItems,
    editTypes,
    editDescriptions,
    catalogDirty,
    editingItem,
    setEditingItem,
    editingCategory,
    setEditingCategory,
    itemSearch,
    setItemSearch,
    itemCategoryFilter,
    setItemCategoryFilter,
    setters,
  };
}

export default function useAdminCatalog() {
  const token = useStore((s) => s.token);
  const catalogCategories = useStore((s) => s.catalogCategories);
  const catalogTypes = useStore((s) => s.catalogTypes);
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);
  const catalogSource = useStore((s) => s.catalogSource);
  const setCatalogFromPublish = useStore((s) => s.setCatalogFromPublish);

  const es = useCatalogEditState(
    catalogCategories,
    catalogRawItems,
    catalogTypes,
    catalogDescriptions
  );
  const fileInputRef = useRef(null);

  const storeState = { catalogCategories, catalogRawItems, catalogTypes, catalogDescriptions };
  useSyncFromStore(storeState, es.setters);

  const filteredEditItems = useFilteredItems(es.editItems, es.itemCategoryFilter, es.itemSearch);
  const editState = {
    editCategories: es.editCategories,
    editTypes: es.editTypes,
    editDescriptions: es.editDescriptions,
    editItems: es.editItems,
    editingItem: es.editingItem,
  };
  const handlers = buildHandlers(token, setCatalogFromPublish, editState, es.setters);

  return { ...es, catalogSource, fileInputRef, filteredEditItems, ...handlers };
}
