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
      set({
        catalogCategories: catalog.categories,
        catalogTypes: catalog.types,
        catalogRawItems: catalog.items,
        catalogDescriptions: catalog.descriptions,
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
