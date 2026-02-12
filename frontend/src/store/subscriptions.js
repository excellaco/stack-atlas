import { useStore } from './index'
import { selectDirty } from './selectors'

export function setupSubscriptions() {
  // When token changes, load catalog + projects
  useStore.subscribe(
    (s) => s.token,
    (token) => {
      if (token) {
        useStore.getState().loadCatalog()
        useStore.getState().loadProjects()
      }
    }
  )

  // Auto-save: when selectedItems or selectedProviders change and dirty, schedule save
  let prevItems = useStore.getState().selectedItems
  let prevProviders = useStore.getState().selectedProviders
  useStore.subscribe(
    (s) => ({ items: s.selectedItems, providers: s.selectedProviders }),
    ({ items, providers }) => {
      // Only trigger if actually changed (reference check)
      if (items === prevItems && providers === prevProviders) return
      prevItems = items
      prevProviders = providers

      const state = useStore.getState()
      if (!state.token || !state.activeProject || state._skipAutoSave || !state.lastSavedItems) return
      if (!selectDirty(state)) return
      state.scheduleAutoSave()
    },
    { equalityFn: (a, b) => a.items === b.items && a.providers === b.providers }
  )
}
