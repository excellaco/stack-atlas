import * as api from '../api'
import { toggleInList } from '../utils/search'

export const createDraftSlice = (set, get) => ({
  selectedItems: [],
  selectedProviders: [],
  savedStack: null,
  savedProviders: [],
  lastSavedItems: null,
  lastSavedProviders: [],
  hasDraft: false,
  draftStatus: 'idle', // idle | saving | saved
  draftSubsystems: {},
  commitVersion: 0,

  // Internal auto-save state
  _autoSaveTimerId: null,
  _skipAutoSave: false,

  toggleItem: (id) => set((s) => ({ selectedItems: toggleInList(s.selectedItems, id) })),

  addItems: (ids) => set((s) => ({
    selectedItems: Array.from(new Set([...s.selectedItems, ...ids]))
  })),

  removeItem: (id) => set((s) => ({
    selectedItems: s.selectedItems.filter((item) => item !== id)
  })),

  clearSelection: () => set({ selectedItems: [] }),

  setSelectedProviders: (providers) => {
    if (typeof providers === 'function') {
      set((s) => ({ selectedProviders: providers(s.selectedProviders) }))
    } else {
      set({ selectedProviders: providers })
    }
  },

  performAutoSave: async () => {
    const { token, activeProject, _skipAutoSave, activeSubsystem, selectedItems,
            selectedProviders, savedStack, draftSubsystems } = get()
    if (!token || !activeProject || _skipAutoSave) return
    set({ draftStatus: 'saving' })
    try {
      const currentSubState = { ...draftSubsystems }
      if (activeSubsystem) {
        const parentItems = savedStack || []
        const parentSet = new Set(parentItems)
        const currentSet = new Set(selectedItems)
        currentSubState[activeSubsystem.id] = {
          name: activeSubsystem.name,
          additions: selectedItems.filter((id) => !parentSet.has(id)),
          exclusions: parentItems.filter((id) => !currentSet.has(id))
        }
      }
      await api.saveDraft(token, activeProject.id, {
        stack: { items: activeSubsystem ? (savedStack || []) : selectedItems, providers: selectedProviders },
        subsystems: currentSubState
      })
      set({
        hasDraft: true,
        draftStatus: 'saved',
        draftSubsystems: currentSubState,
        lastSavedItems: [...selectedItems],
        lastSavedProviders: [...selectedProviders],
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
      set({ draftStatus: 'idle' })
    }
  },

  commit: async (message) => {
    const { token, activeProject, _autoSaveTimerId } = get()
    if (!token || !activeProject) return
    await get().performAutoSave()
    const commit = await api.commitChanges(token, activeProject.id, { message })
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId)
    set({ hasDraft: false, draftStatus: 'idle', _skipAutoSave: true, _autoSaveTimerId: null })
    try {
      const stack = await api.getStack(token, activeProject.id)
      const committedItems = stack?.items || []
      const committedProviders = stack?.providers || []
      const subs = await api.listSubsystems(token, activeProject.id)
      const subState = {}
      for (const s of subs) {
        subState[s.id] = { name: s.name, additions: s.additions || [], exclusions: s.exclusions || [] }
      }
      set({
        savedStack: committedItems,
        savedProviders: committedProviders,
        selectedItems: committedItems,
        selectedProviders: committedProviders,
        lastSavedItems: committedItems,
        lastSavedProviders: committedProviders,
        subsystems: subs,
        draftSubsystems: subState,
        activeSubsystem: null,
      })
    } finally {
      set({ _skipAutoSave: false })
    }
    set((s) => ({ commitVersion: s.commitVersion + 1 }))
    return commit
  },

  discard: async () => {
    const { token, activeProject, activeSubsystem, _autoSaveTimerId } = get()
    if (!token || !activeProject) return
    await api.discardDraft(token, activeProject.id)
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId)
    set({ hasDraft: false, draftStatus: 'idle', _skipAutoSave: true, _autoSaveTimerId: null })
    try {
      const stack = await api.getStack(token, activeProject.id)
      const committedItems = stack?.items || []
      const discardedProviders = stack?.providers || []
      const subs = await api.listSubsystems(token, activeProject.id)
      const subState = {}
      for (const s of subs) {
        subState[s.id] = { name: s.name, additions: s.additions || [], exclusions: s.exclusions || [] }
      }
      set({
        savedStack: committedItems,
        savedProviders: discardedProviders,
        selectedProviders: discardedProviders,
        lastSavedProviders: discardedProviders,
        subsystems: subs,
        draftSubsystems: subState,
      })
      if (activeSubsystem) {
        const subData = subState[activeSubsystem.id] || subs.find((s) => s.id === activeSubsystem.id)
        if (subData) {
          const parentSet = new Set(committedItems)
          ;(subData.additions || []).forEach((id) => parentSet.add(id))
          const restoredItems = Array.from(parentSet)
          set({ selectedItems: restoredItems, lastSavedItems: restoredItems })
        } else {
          set({ activeSubsystem: null, selectedItems: committedItems, lastSavedItems: committedItems })
        }
      } else {
        set({ selectedItems: committedItems, lastSavedItems: committedItems })
      }
    } finally {
      set({ _skipAutoSave: false })
    }
  },

  scheduleAutoSave: () => {
    const { _autoSaveTimerId } = get()
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId)
    const timerId = setTimeout(() => {
      get().performAutoSave()
    }, 2000)
    set({ _autoSaveTimerId: timerId })
  },
})
