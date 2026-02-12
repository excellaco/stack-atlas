import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { createAuthSlice } from "./authSlice";
import { createCatalogSlice } from "./catalogSlice";
import { createProjectSlice } from "./projectSlice";
import { createDraftSlice } from "./draftSlice";
import { createUiSlice } from "./uiSlice";
import type { StoreState } from "./types";

export const useStore = create<StoreState>()(
  devtools(
    subscribeWithSelector((...a) => ({
      ...createAuthSlice(a[0], a[1]),
      ...createCatalogSlice(a[0], a[1]),
      ...createProjectSlice(a[0], a[1]),
      ...createDraftSlice(a[0], a[1]),
      ...createUiSlice(a[0], a[1]),
    })),
    { name: "StackAtlas", enabled: import.meta.env.DEV }
  )
);
