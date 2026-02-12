import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Markdown from "react-markdown";
import { useStore } from "../store";
import * as api from "../api";
import {
  categories as staticCategories,
  rawItems as staticRawItems,
  descriptionById as staticDescriptions,
  enrichItems,
} from "../data/stackData";
import { buildExportData, formatExport } from "../utils/export";
import type { Subsystem, Project } from "../types";
import "./ProjectView.css";

interface ProjectViewData {
  project: Project;
  stack: string[];
  subsystems: Subsystem[];
  items: import("../types").RawItem[];
  descriptions: Record<string, string>;
  categories: import("../types").Category[];
}

function useProjectData(projectId: string | undefined) {
  const [data, setData] = useState<ProjectViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useStore((s) => s.token);
  const authLoading = useStore((s) => s.authLoading);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getProjectView(token, projectId!)
      .then((result) => setData(result as unknown as ProjectViewData))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId, token, authLoading]);

  return { data, error, loading: loading || authLoading };
}

interface ProjectViewHeaderProps {
  project: Project;
  subsystem: Subsystem | null;
  canEdit: boolean;
  onEdit: () => void;
}

function ProjectViewHeader({
  project,
  subsystem,
  canEdit,
  onEdit,
}: Readonly<ProjectViewHeaderProps>): React.JSX.Element {
  return (
    <header className="project-view-header">
      <div className="project-view-header-top">
        <div>
          <h1>
            {project.name}
            {subsystem ? ` / ${subsystem.name}` : ""}
          </h1>
          {project.description && <p>{project.description}</p>}
          {subsystem?.description && <p>{subsystem.description}</p>}
        </div>
        {canEdit && (
          <button type="button" className="edit-mode-btn" onClick={onEdit}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        )}
      </div>
    </header>
  );
}

interface SubsystemListProps {
  projectId: string;
  subsystems: Subsystem[];
}

function SubsystemList({ projectId, subsystems }: Readonly<SubsystemListProps>): React.JSX.Element {
  return (
    <section className="project-view-subsystems">
      <h2>Subsystems</h2>
      {subsystems.map((sub) => (
        <Link key={sub.id} to={`/view/${projectId}/${sub.id}`} className="project-view-subsystem">
          <h3>{sub.name}</h3>
          {sub.description && <p>{sub.description}</p>}
        </Link>
      ))}
    </section>
  );
}

function useMarkdown(data: ProjectViewData | null, effectiveStack: string[]): string {
  return useMemo(() => {
    if (!data) return "";
    const catalogItems = data.items.length ? data.items : staticRawItems;
    const catalogDescs = Object.keys(data.descriptions).length
      ? data.descriptions
      : staticDescriptions;
    const catalogCats = data.categories.length ? data.categories : staticCategories;
    const items = enrichItems(catalogItems, catalogDescs);
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const exportData = buildExportData(effectiveStack, itemsById, catalogCats);
    return formatExport(exportData, "markdown");
  }, [data, effectiveStack]);
}

interface ProjectViewErrorProps {
  message: string;
  linkTo: string;
  linkLabel: string;
}

function ProjectViewError({
  message,
  linkTo,
  linkLabel,
}: Readonly<ProjectViewErrorProps>): React.JSX.Element {
  return (
    <div className="project-view">
      <div className="project-view-error">{message}</div>
      <Link to={linkTo} className="project-view-back">
        {linkLabel}
      </Link>
    </div>
  );
}

function useEffectiveStack(data: ProjectViewData | null, subsystem: Subsystem | null): string[] {
  return useMemo(() => {
    if (!data) return [];
    if (!subsystem) return data.stack;
    const stackSet = new Set(data.stack);
    (subsystem.additions || []).forEach((id) => stackSet.add(id));
    return Array.from(stackSet);
  }, [data, subsystem]);
}

interface ProjectViewContentProps {
  data: ProjectViewData;
  subsystem: Subsystem | null;
  subsystemId: string | undefined;
  projectId: string;
  markdown: string;
  onEdit: () => void;
}

function ProjectViewContent({
  data,
  subsystem,
  subsystemId,
  projectId,
  markdown,
  onEdit,
}: Readonly<ProjectViewContentProps>): React.JSX.Element {
  const canEdit = data.project.canEdit || false;

  return (
    <div className="project-view">
      <ProjectViewHeader
        project={data.project}
        subsystem={subsystem}
        canEdit={canEdit}
        onEdit={onEdit}
      />
      <article className="project-view-content">
        <Markdown>{markdown}</Markdown>
      </article>
      {!subsystemId && data.subsystems.length > 0 && (
        <SubsystemList projectId={projectId} subsystems={data.subsystems} />
      )}
    </div>
  );
}

export default function ProjectView(): React.JSX.Element | null {
  const { projectId, subsystemId } = useParams<{ projectId: string; subsystemId?: string }>();
  const navigate = useNavigate();
  const { data, error, loading } = useProjectData(projectId);

  const subsystem = useMemo((): Subsystem | null => {
    if (!data || !subsystemId) return null;
    return data.subsystems.find((s) => s.id === subsystemId) || null;
  }, [data, subsystemId]);

  const effectiveStack = useEffectiveStack(data, subsystem);
  const markdown = useMarkdown(data, effectiveStack);

  const handleEdit = (): void => {
    const subPath = subsystemId ? `/${subsystemId}` : "";
    void navigate(`/edit/${projectId}${subPath}`);
  };

  if (loading) return <div className="project-view-loading">Loading...</div>;
  if (error) return <ProjectViewError message={error} linkTo="/" linkLabel="Back to Projects" />;
  if (subsystemId && !subsystem) {
    return (
      <ProjectViewError
        message="Subsystem not found"
        linkTo={`/view/${projectId}`}
        linkLabel="View base system"
      />
    );
  }
  if (!data) return null;

  return (
    <ProjectViewContent
      data={data}
      subsystem={subsystem}
      subsystemId={subsystemId}
      projectId={projectId!}
      markdown={markdown}
      onEdit={handleEdit}
    />
  );
}
