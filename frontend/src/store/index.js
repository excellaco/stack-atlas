import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { createAuthSlice } from "./authSlice";
import { createCatalogSlice } from "./catalogSlice";
import { createProjectSlice } from "./projectSlice";
import { createDraftSlice } from "./draftSlice";
import { createUiSlice } from "./uiSlice";

export const useStore = create(
  devtools(
    subscribeWithSelector((set, get, api) => ({
      ...createAuthSlice(set, get, api),
      ...createCatalogSlice(set, get, api),
      ...createProjectSlice(set, get, api),
      ...createDraftSlice(set, get, api),
      ...createUiSlice(set, get, api),
    })),
    { name: "StackAtlas", enabled: import.meta.env.DEV }
  )
);
