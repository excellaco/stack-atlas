import { useStore } from "./index";
import { selectDirty } from "./selectors";

// Side-effect subscriptions, set up once in main.tsx. These react to store
// changes outside of React's render cycle.
export function setupSubscriptions(): void {
  // When token changes, load catalog + projects
  useStore.subscribe(
    (s) => s.token,
    (token: string | null) => {
      if (token) {
        void useStore.getState().loadCatalog();
        void useStore.getState().loadProjects();
      }
    }
  );

  // Auto-save: debounced save when the user's selections diverge from last-saved.
  // Uses reference equality check + selectDirty to avoid saving on no-op changes
  // (e.g. loading a project populates selectedItems, which shouldn't trigger save).
  // The _skipAutoSave flag is set during loadProject to prevent this exact case.
  let prevItems: string[] = useStore.getState().selectedItems;
  let prevProviders: string[] = useStore.getState().selectedProviders;
  useStore.subscribe(
    (s) => ({ items: s.selectedItems, providers: s.selectedProviders }),
    ({ items, providers }: { items: string[]; providers: string[] }) => {
      // Only trigger if actually changed (reference check)
      if (items === prevItems && providers === prevProviders) return;
      prevItems = items;
      prevProviders = providers;

      const state = useStore.getState();
      if (!state.token || !state.activeProject || state._skipAutoSave || !state.lastSavedItems)
        return;
      if (!selectDirty(state)) return;
      state.scheduleAutoSave();
    },
    {
      equalityFn: (
        a: { items: string[]; providers: string[] },
        b: { items: string[]; providers: string[] }
      ) => a.items === b.items && a.providers === b.providers,
    }
  );
}
