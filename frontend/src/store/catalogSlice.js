import {
  categories as staticCategories,
  types as staticTypes,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions,
} from "../data/stackData";
import * as api from "../api";

export const createCatalogSlice = (set, get) => ({
  catalogCategories: staticCategories,
  catalogTypes: staticTypes,
  catalogRawItems: staticRawItems,
  catalogDescriptions: staticDescriptions,
  catalogSource: "static",

  loadCatalog: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const catalog = await api.getCatalog(token);
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

  setCatalogFromPublish: (catalog) => {
    set({
      catalogCategories: catalog.categories,
      catalogTypes: catalog.types,
      catalogRawItems: catalog.items,
      catalogDescriptions: catalog.descriptions,
      catalogSource: "api",
    });
  },
});
