// CatalogSlice manages the technology catalog used by the editor.
//
// Dual-source strategy:
//   1. Static data (stackData.ts) is used as initial state — the editor renders
//      immediately without waiting for an API call.
//   2. loadCatalog() fetches the API-published catalog. If it returns valid data,
//      the static data is replaced. If the API fails (network error, no catalog
//      published yet), the app silently stays on the static data.
//
// This means the first render always has content, and admin-published catalog
// updates take effect on the next loadCatalog() call (triggered on login).
//
// setCatalogFromPublish() is called from AdminPanel after a successful publish
// so the admin sees their changes immediately without re-fetching.
import {
  categories as staticCategories,
  types as staticTypes,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions,
} from "../data/stackData";
import * as api from "../api";
import type { Catalog } from "../types";
import type { CatalogSlice, StoreSet, StoreGet } from "./types";

export const createCatalogSlice = (set: StoreSet, get: StoreGet): CatalogSlice => ({
  catalogCategories: staticCategories,
  catalogTypes: staticTypes,
  catalogRawItems: staticRawItems,
  catalogDescriptions: staticDescriptions,
  catalogSource: "static",

  loadCatalog: async (): Promise<void> => {
    const { token } = get();
    if (!token) return;
    try {
      const catalog: Catalog = await api.getCatalog(token);
      if (!catalog?.categories || !catalog?.items) return;
      set({
        catalogCategories: catalog.categories,
        catalogTypes: catalog.types || [],
        catalogRawItems: catalog.items,
        catalogDescriptions: catalog.descriptions || {},
        catalogSource: "api",
      });
    } catch {
      set({ catalogSource: "static" });
    }
  },

  setCatalogFromPublish: (catalog: Catalog): void => {
    set({
      catalogCategories: catalog.categories,
      catalogTypes: catalog.types,
      catalogRawItems: catalog.items,
      catalogDescriptions: catalog.descriptions,
      catalogSource: "api",
    });
  },
});
