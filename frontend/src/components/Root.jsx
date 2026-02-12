import { Outlet } from "react-router-dom";
import { useStore } from "../store";
import AuthBar from "./AuthBar";
import SplashScreen from "./SplashScreen";
import ProjectExplorer from "./ProjectExplorer";
import ConfirmModal from "./ConfirmModal";
import "./Root.css";

function AppFooter() {
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

export default function Root() {
  const user = useStore((s) => s.user);
  const authLoading = useStore((s) => s.authLoading);

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
          <ProjectExplorer />
        </aside>
        <main className="root-content">
          <Outlet />
        </main>
      </div>
      <AppFooter />
      <ConfirmModal />
    </div>
  );
}
