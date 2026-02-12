import { Link } from "react-router-dom";
import type { Project, Subsystem } from "../types";
import "./Breadcrumbs.css";

interface Props {
  project: Project | null;
  subsystem: Subsystem | null;
  mode: "view" | "edit" | "sandbox";
}

export default function Breadcrumbs({
  project,
  subsystem,
  mode,
}: Readonly<Props>): React.JSX.Element {
  return (
    <nav className="breadcrumbs">
      <Link to="/" className="breadcrumb-link">
        Home
      </Link>
      {project && (
        <>
          <span className="breadcrumb-sep">/</span>
          {mode === "view" && !subsystem ? (
            <span className="breadcrumb-current">{project.name}</span>
          ) : (
            <Link to={`/view/${project.id}`} className="breadcrumb-link">
              {project.name}
            </Link>
          )}
        </>
      )}
      {subsystem && (
        <>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{subsystem.name}</span>
        </>
      )}
      {mode === "edit" && (
        <>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-mode">Editing</span>
        </>
      )}
      {mode === "sandbox" && <span className="breadcrumb-mode">Sandbox</span>}
    </nav>
  );
}
