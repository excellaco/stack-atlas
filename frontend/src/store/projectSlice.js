import * as api from '../api'

export const createProjectSlice = (set, get) => ({
  projects: [],
  activeProject: null,
  subsystems: [],
  activeSubsystem: null,

  loadProjects: async () => {
    const { token } = get()
    if (!token) {
      set({ projects: [], activeProject: null, subsystems: [], activeSubsystem: null })
      return
    }
    try {
      const list = await api.listProjects(token)
      set({ projects: list })
      const savedProjectId = localStorage.getItem('sa_activeProject')
      if (savedProjectId) {
        const project = list.find((p) => p.id === savedProjectId)
        if (project) {
          set({ activeProject: project })
          get().loadProject(savedProjectId)
        }
      }
    } catch {
      set({ projects: [] })
    }
  },

  selectProject: (projectId) => {
    const { projects, _autoSaveTimerId } = get()
    if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId)

    if (!projectId) {
      set({
        activeProject: null,
        activeSubsystem: null,
        savedStack: null,
        savedProviders: [],
        selectedProviders: [],
        selectedItems: [],
        lastSavedItems: null,
        lastSavedProviders: [],
        hasDraft: false,
        draftStatus: 'idle',
        draftSubsystems: {},
        _autoSaveTimerId: null,
      })
      localStorage.removeItem('sa_activeProject')
      localStorage.removeItem('sa_activeSubsystem')
      return
    }
    const project = projects.find((p) => p.id === projectId)
    set({
      activeProject: project || null,
      activeSubsystem: null,
      savedStack: null,
      savedProviders: [],
      hasDraft: false,
      draftStatus: 'idle',
      draftSubsystems: {},
    })
    localStorage.setItem('sa_activeProject', projectId)
    localStorage.removeItem('sa_activeSubsystem')
    if (project) get().loadProject(projectId)
  },

  loadProject: async (projectIdOverride) => {
    const { token, activeProject } = get()
    const pid = projectIdOverride || activeProject?.id
    if (!token || !pid) return
    set({ _skipAutoSave: true })
    try {
      // Load committed state
      const stack = await api.getStack(token, pid)
      const committedItems = stack?.items || []
      const committedProviders = stack?.providers || []

      // Load subsystems
      const subs = await api.listSubsystems(token, pid)
      const subState = {}
      for (const s of subs) {
        subState[s.id] = { name: s.name, additions: s.additions || [], exclusions: s.exclusions || [] }
      }

      // Check for existing draft
      let draftData = null
      try {
        draftData = await api.getDraft(token, pid)
      } catch (err) {
        if (err.message?.includes('423') || err.message?.includes('locked')) {
          console.warn('Project locked by another user')
        }
      }

      const effectiveSubState = draftData?.subsystems || subState
      const baseItems = draftData ? (draftData.stack?.items || committedItems) : committedItems
      const baseProviders = draftData ? (draftData.stack?.providers || committedProviders) : committedProviders

      // Restore subsystem from localStorage if applicable
      const savedSubId = localStorage.getItem('sa_activeSubsystem')
      const restoredSub = savedSubId ? subs.find((s) => s.id === savedSubId) : null

      let effectiveItems = baseItems
      let activeSubsystem = null
      if (restoredSub) {
        activeSubsystem = restoredSub
        const subData = effectiveSubState[restoredSub.id] || restoredSub
        const parentSet = new Set(committedItems)
        ;(subData.exclusions || []).forEach((id) => parentSet.delete(id))
        ;(subData.additions || []).forEach((id) => parentSet.add(id))
        effectiveItems = Array.from(parentSet)
      }

      // Set all state atomically
      set({
        subsystems: subs,
        activeSubsystem,
        savedStack: committedItems,
        savedProviders: committedProviders,
        selectedItems: effectiveItems,
        selectedProviders: baseProviders,
        lastSavedItems: [...effectiveItems],
        lastSavedProviders: [...baseProviders],
        draftSubsystems: effectiveSubState,
        hasDraft: !!draftData,
        draftStatus: draftData ? 'saved' : 'idle',
      })
    } catch (err) {
      console.error('Failed to load stack:', err)
    } finally {
      set({ _skipAutoSave: false })
    }
  },

  selectSubsystem: (subId) => {
    const { subsystems, draftSubsystems, savedStack } = get()
    set({ _skipAutoSave: true })
    try {
      if (!subId) {
        set({ activeSubsystem: null })
        localStorage.removeItem('sa_activeSubsystem')
        if (savedStack) {
          set({
            selectedItems: [...savedStack],
            lastSavedItems: [...savedStack],
          })
        }
        return
      }
      const sub = subsystems.find((s) => s.id === subId)
      set({ activeSubsystem: sub || null })
      localStorage.setItem('sa_activeSubsystem', subId)
      const subData = draftSubsystems[subId] || sub
      if (subData && savedStack) {
        const parentSet = new Set(savedStack)
        ;(subData.exclusions || []).forEach((id) => parentSet.delete(id))
        ;(subData.additions || []).forEach((id) => parentSet.add(id))
        const items = Array.from(parentSet)
        set({
          selectedItems: items,
          lastSavedItems: [...items],
        })
      }
    } finally {
      set({ _skipAutoSave: false })
    }
  },

  createProject: async (name, description) => {
    const { token } = get()
    if (!token) return
    const project = await api.createProject(token, { name, description })
    set((s) => ({ projects: [...s.projects, project], activeProject: project }))
    get().loadProject(project.id)
  },

  deleteProject: async (projectId) => {
    const { token, activeProject, _autoSaveTimerId } = get()
    if (!token) return
    await api.deleteProject(token, projectId)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }))
    if (activeProject?.id === projectId) {
      if (_autoSaveTimerId) clearTimeout(_autoSaveTimerId)
      set({
        activeProject: null,
        activeSubsystem: null,
        savedStack: null,
        savedProviders: [],
        selectedProviders: [],
        selectedItems: [],
        lastSavedItems: null,
        lastSavedProviders: [],
        hasDraft: false,
        draftStatus: 'idle',
        draftSubsystems: {},
        _autoSaveTimerId: null,
      })
    }
  },

  createSubsystem: async (name, description) => {
    const { token, activeProject } = get()
    if (!token || !activeProject) return
    const sub = await api.createSubsystem(token, activeProject.id, { name, description })
    set((s) => ({ subsystems: [...s.subsystems, sub], activeSubsystem: sub }))
  },

  deleteSubsystem: async (subId) => {
    const { token, activeProject, activeSubsystem, savedStack } = get()
    if (!token || !activeProject) return
    await api.deleteSubsystemApi(token, activeProject.id, subId)
    set((s) => ({ subsystems: s.subsystems.filter((s2) => s2.id !== subId) }))
    if (activeSubsystem?.id === subId) {
      set({ activeSubsystem: null })
      if (savedStack) set({ selectedItems: [...savedStack] })
    }
  },
})
