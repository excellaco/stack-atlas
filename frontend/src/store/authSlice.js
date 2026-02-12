import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  getSession,
  parseIdToken,
  getFreshToken,
} from "../auth";
import * as api from "../api";

export const createAuthSlice = (set, get) => ({
  user: null,
  token: null,
  authLoading: true,

  restoreSession: async () => {
    api.setOnAuthError(() => set({ sessionExpired: true }));
    try {
      const session = await getSession();
      if (session) {
        const parsed = parseIdToken(session);
        set({ user: parsed, token: session.getIdToken().getJwtToken() });
      }
    } catch {
      // no session
    } finally {
      set({ authLoading: false });
    }
  },

  signIn: async (email, password) => {
    const session = await cognitoSignIn(email, password);
    const parsed = parseIdToken(session);
    set({ user: parsed, token: session.getIdToken().getJwtToken() });
  },

  signOut: () => {
    cognitoSignOut();
    set({
      user: null,
      token: null,
      // Cross-slice resets
      projects: [],
      activeProject: null,
      subsystems: [],
      activeSubsystem: null,
      savedStack: null,
      savedProviders: [],
      selectedProviders: [],
      selectedItems: [],
      lastSavedItems: null,
      lastSavedProviders: [],
      hasDraft: false,
      draftStatus: "idle",
      draftSubsystems: {},
    });
    localStorage.removeItem("sa_activeProject");
    localStorage.removeItem("sa_activeSubsystem");
    // Cancel any pending auto-save timer
    const timerId = get()._autoSaveTimerId;
    if (timerId) clearTimeout(timerId);
  },

  startTokenRefresh: () => {
    const interval = setInterval(
      async () => {
        const fresh = await getFreshToken();
        if (fresh) {
          set({ token: fresh });
        } else {
          set({ sessionExpired: true });
        }
      },
      10 * 60 * 1000
    );
    return () => clearInterval(interval);
  },
});
