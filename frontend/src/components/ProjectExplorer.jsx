import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../store";
import * as api from "../api";
import "./ProjectExplorer.css";

function StackIcon({ className }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function SubIcon({ className }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function EditBadge() {
  return (
    <span className="editor-badge" title="You can edit this project">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </span>
  );
}

function SubsystemRow({ sub, projectId, isActive, onNavigate }) {
  const subPath = `/view/${projectId}/${sub.id}`;
  return (
    <div className={`explorer-row explorer-sub${isActive(subPath) ? " active" : ""}`}>
      <button type="button" className="explorer-name" onClick={() => onNavigate(subPath)}>
        <SubIcon className="explorer-icon" />
        <span>{sub.name}</span>
      </button>
    </div>
  );
}

function ProjectNode({ project, isExpanded, subs, isLoading, isActive, onToggle, onNavigate }) {
  const viewPath = `/view/${project.id}`;

  return (
    <div className="explorer-node">
      <div className={`explorer-row${isActive(viewPath) ? " active" : ""}`}>
        <button type="button" className="explorer-toggle" onClick={() => onToggle(project.id)}>
          {isExpanded ? "\u25BE" : "\u25B8"}
        </button>
        <button type="button" className="explorer-name" onClick={() => onNavigate(viewPath)}>
          <StackIcon className="explorer-icon" />
          <span>{project.name}</span>
          {project.canEdit && <EditBadge />}
        </button>
      </div>
      {isExpanded && (
        <div className="explorer-children">
          {isLoading && <div className="explorer-loading">Loading...</div>}
          {subs && subs.length === 0 && !isLoading && (
            <div className="explorer-loading">No subsystems</div>
          )}
          {subs &&
            subs.map((sub) => (
              <SubsystemRow
                key={sub.id}
                sub={sub}
                projectId={project.id}
                isActive={isActive}
                onNavigate={onNavigate}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function useExpandableProjects(token) {
  const [expanded, setExpanded] = useState(new Set());
  const [subsystems, setSubsystems] = useState({});
  const [loadingSubs, setLoadingSubs] = useState(new Set());

  const toggleExpand = async (projectId) => {
    const next = new Set(expanded);
    if (next.has(projectId)) {
      next.delete(projectId);
      setExpanded(next);
      return;
    }
    next.add(projectId);
    setExpanded(next);

    if (!subsystems[projectId] && token) {
      setLoadingSubs((prev) => new Set([...prev, projectId]));
      try {
        const subs = await api.listSubsystems(token, projectId);
        setSubsystems((prev) => ({ ...prev, [projectId]: subs }));
      } catch {
        setSubsystems((prev) => ({ ...prev, [projectId]: [] }));
      } finally {
        setLoadingSubs((prev) => {
          const s = new Set(prev);
          s.delete(projectId);
          return s;
        });
      }
    }
  };

  return { expanded, subsystems, loadingSubs, toggleExpand };
}

export default function ProjectExplorer() {
  const projects = useStore((s) => s.projects);
  const token = useStore((s) => s.token);
  const navigate = useNavigate();
  const location = useLocation();
  const { expanded, subsystems, loadingSubs, toggleExpand } = useExpandableProjects(token);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="explorer">
      <div className="explorer-header">
        <h3>Projects</h3>
      </div>
      {projects.length === 0 && <div className="explorer-empty">No projects yet.</div>}
      <div className="explorer-tree">
        {projects.map((project) => (
          <ProjectNode
            key={project.id}
            project={project}
            isExpanded={expanded.has(project.id)}
            subs={subsystems[project.id]}
            isLoading={loadingSubs.has(project.id)}
            isActive={isActive}
            onToggle={toggleExpand}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}
