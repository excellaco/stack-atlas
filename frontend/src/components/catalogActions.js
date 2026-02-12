import {
  categories as staticCategories,
  types as staticTypes,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions,
} from "../data/stackData";
import { useStore } from "../store";
import * as api from "../api";

export function createPublishHandler(state) {
  const { editCategories, editTypes, editDescriptions, editItems, setCatalogDirty } = state;
  return async (token, setCatalogFromPublish, setSaving, setError) => {
    const ok = await useStore.getState().requestConfirm({
      title: "Publish Catalog",
      message: "Publish catalog changes? This will update the catalog for all users.",
      confirmLabel: "Publish",
      variant: "warning",
    });
    if (!ok) return;
    setSaving(true);
    try {
      const catalog = {
        categories: editCategories,
        types: editTypes,
        descriptions: editDescriptions,
        items: editItems,
      };
      await api.putCatalog(token, catalog);
      setCatalogFromPublish(catalog);
      setCatalogDirty(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
}

export function handleUploadCatalog(e, setters, setError) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      const valid =
        Array.isArray(data.categories) &&
        Array.isArray(data.types) &&
        Array.isArray(data.items) &&
        typeof data.descriptions === "object";
      if (!valid) {
        setError("Invalid catalog format");
        return;
      }
      setters.setEditCategories(data.categories);
      setters.setEditTypes(data.types);
      setters.setEditItems(data.items);
      setters.setEditDescriptions(data.descriptions);
      setters.setCatalogDirty(true);
      setError("");
    } catch {
      setError("Invalid JSON file");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

export function handleSeedFromStatic(setters) {
  setters.setEditCategories(staticCategories);
  setters.setEditTypes(staticTypes);
  setters.setEditItems(staticRawItems);
  setters.setEditDescriptions(staticDescriptions);
  setters.setCatalogDirty(true);
}

export function saveCatalogItem(itemData, description, editingItem, setters) {
  const isRename = editingItem?.id && editingItem.id !== itemData.id;
  if (isRename) {
    setters.setEditItems((prev) => [...prev.filter((i) => i.id !== editingItem.id), itemData]);
    setters.setEditDescriptions((prev) => {
      const next = { ...prev };
      delete next[editingItem.id];
      if (description) next[itemData.id] = description;
      return next;
    });
  } else {
    setters.setEditItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemData.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = itemData;
        return next;
      }
      return [...prev, itemData];
    });
    if (description) {
      setters.setEditDescriptions((prev) => ({ ...prev, [itemData.id]: description }));
    }
  }
  setters.setCatalogDirty(true);
  setters.setEditingItem(null);
}

export async function deleteCatalogItem(itemId, setters) {
  const ok = await useStore.getState().requestConfirm({
    title: "Delete Item",
    message: `Delete item "${itemId}"? It may be referenced by existing projects.`,
    confirmLabel: "Delete",
    variant: "danger",
  });
  if (!ok) return;
  setters.setEditItems((prev) => prev.filter((i) => i.id !== itemId));
  setters.setEditDescriptions((prev) => {
    const next = { ...prev };
    delete next[itemId];
    return next;
  });
  setters.setCatalogDirty(true);
}

export function saveCatalogCategory(catData, setters) {
  setters.setEditCategories((prev) => {
    const idx = prev.findIndex((c) => c.id === catData.id);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = catData;
      return next;
    }
    return [...prev, catData];
  });
  setters.setCatalogDirty(true);
  setters.setEditingCategory(null);
}

export async function deleteCatalogCategory(catId, editItems, setters) {
  const count = editItems.filter((i) => i.category === catId).length;
  if (count > 0) {
    const ok = await useStore.getState().requestConfirm({
      title: "Delete Category",
      message: `Category has ${count} items. Delete anyway?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
  }
  setters.setEditCategories((prev) => prev.filter((c) => c.id !== catId));
  setters.setCatalogDirty(true);
}
