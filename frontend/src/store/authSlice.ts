import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  getSession,
  parseIdToken,
  getFreshToken,
} from "../auth";
import * as api from "../api";
import type { AuthSlice, StoreSet, StoreGet } from "./types";

// --- Extracted standalone functions ---

async function doRestoreSession(set: StoreSet): Promise<void> {
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
}

async function doSignIn(set: StoreSet, email: string, password: string): Promise<void> {
  const session = await cognitoSignIn(email, password);
  const parsed = parseIdToken(session);
  set({ user: parsed, token: session.getIdToken().getJwtToken() });
}

function doSignOut(set: StoreSet, get: StoreGet): void {
  cognitoSignOut();
  set({
    user: null,
    token: null,
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
  const timerId = get()._autoSaveTimerId;
  if (timerId) clearTimeout(timerId);
}

// --- Slice creator (thin action wrappers) ---

export const createAuthSlice = (set: StoreSet, get: StoreGet): AuthSlice => ({
  user: null,
  token: null,
  authLoading: true,

  restoreSession: () => doRestoreSession(set),
  signIn: (email: string, password: string) => doSignIn(set, email, password),
  signOut: () => doSignOut(set, get),

  startTokenRefresh: (): (() => void) => {
    const interval = setInterval(
      () => {
        void (async () => {
          const fresh = await getFreshToken();
          if (fresh) set({ token: fresh });
          else set({ sessionExpired: true });
        })();
      },
      10 * 60 * 1000
    );
    return () => clearInterval(interval);
  },
});
