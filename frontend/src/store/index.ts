// Zustand store composed from slices. Each slice owns a domain (auth, catalog,
// projects, drafts, UI) and can access other slices via get(). The store uses
// subscribeWithSelector middleware for the auto-save subscription in
// subscriptions.ts, which watches selectedItems/selectedProviders changes.
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
