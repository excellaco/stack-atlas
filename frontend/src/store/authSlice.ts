// AuthSlice manages Cognito authentication: session restore, sign in/out, token refresh.
//
// Session lifecycle:
//   1. restoreSession() runs before React renders (see main.tsx). It checks
//      Cognito's localStorage cache for an existing session so users don't see
//      a login screen on refresh. It also registers the 401 error handler.
//   2. signIn() authenticates via Cognito and extracts user info from the ID token
//      (not access token — the ID token has email and groups claims we need).
//   3. startTokenRefresh() sets up a 10-minute interval to proactively refresh
//      the JWT before it expires (Cognito tokens last 1 hour). If refresh fails
//      (e.g. user was disabled), sessionExpired is set to show an overlay.
//   4. signOut() clears all auth + project state and localStorage, ensuring a
//      clean slate for the next login.
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
