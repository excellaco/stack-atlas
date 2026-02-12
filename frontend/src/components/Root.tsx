// Root — layout shell for the non-editor routes (landing page, project view).
//
// Three rendering states:
//   1. authLoading=true  → minimal loading indicator (logo + spinner). This is
//      brief — restoreSession() in main.tsx resolves quickly from Cognito's
//      localStorage cache.
//   2. user=null          → SplashScreen (login form + marketing content). No
//      sidebar or navigation since there's nothing to show without auth.
//   3. user exists         → Full app shell: top bar with auth controls, sidebar
//      with ProjectExplorer tree, and <Outlet> for child routes (LandingContent
//      at "/" or ProjectView at "/view/:projectId/:subsystemId?").
//
// This is separate from the Editor layout intentionally — the Editor uses a
// 3-column grid that's incompatible with Root's sidebar+content structure.
// Both share state through the Zustand store.
import { Outlet } from "react-router-dom";
import { useStore } from "../store";
import AdminPanel from "./AdminPanel";
import AuthBar from "./AuthBar";
import ErrorBoundary from "./ErrorBoundary";
import SplashScreen from "./SplashScreen";
import ProjectExplorer from "./ProjectExplorer";
import ConfirmModal from "./ConfirmModal";
import "./Root.css";

function AppFooter(): React.JSX.Element {
  return (
    <footer className="app-footer">
      <span>Copyright &copy; {new Date().getFullYear()}</span>
      <a href="https://www.excella.com" target="_blank" rel="noreferrer">
        <img
          src="https://www.excella.com/wp-content/themes/excllcwpt/images/logo.svg"
          alt="Excella"
          height="14"
        />
      </a>
    </footer>
  );
}

export default function Root(): React.JSX.Element {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const authLoading = useStore((s) => s.authLoading);
  const showAdmin = useStore((s) => s.showAdmin);

  if (authLoading) {
    return (
      <div className="root-loading">
        <img src="/stack-atlas.png" alt="Stack Atlas" width="32" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <SplashScreen />
        <ConfirmModal />
      </>
    );
  }

  return (
    <div className="root-page">
      <div className="root-top-bar">
        <div className="top-bar-left">
          <div className="brand">
            <img src="/stack-atlas.png" alt="Stack Atlas" className="brand-logo" />
            <span className="brand-name">Stack Atlas</span>
          </div>
        </div>
        <AuthBar />
      </div>
      <div className="root-body">
        <aside className="root-sidebar">
          <ErrorBoundary name="Project explorer">
            <ProjectExplorer />
          </ErrorBoundary>
        </aside>
        <main className="root-content">
          <ErrorBoundary name="Content">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      {showAdmin && token && <AdminPanel />}
      <AppFooter />
      <ConfirmModal />
    </div>
  );
}
