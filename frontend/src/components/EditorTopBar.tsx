import { useStore } from "../store";
import AuthBar from "./AuthBar";
import Breadcrumbs from "./Breadcrumbs";
import type { ViewMode, Density } from "../types";

interface ViewToggleProps {
  label: string;
  options: { value: string; text: string }[];
  current: string;
  onChange: (value: string) => void;
}

function ViewToggle({
  label,
  options,
  current,
  onChange,
}: Readonly<ViewToggleProps>): React.JSX.Element {
  return (
    <div className="view-toggle">
      <span>{label}</span>
      {options.map(({ value, text }) => (
        <button
          key={value}
          type="button"
          data-active={current === value || undefined}
          onClick={() => onChange(value)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

const VIEW_OPTIONS = [
  { value: "hierarchy", text: "Hierarchy" },
  { value: "flat", text: "Flat" },
];

const DENSITY_OPTIONS = [
  { value: "compact", text: "Compact" },
  { value: "comfortable", text: "Comfortable" },
];

interface ViewModeButtonProps {
  show: boolean;
  onClick: () => void;
}

function ViewModeButton({
  show,
  onClick,
}: Readonly<ViewModeButtonProps>): React.JSX.Element | null {
  if (!show) return null;
  return (
    <button type="button" className="view-mode-btn" onClick={onClick}>
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
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      View Mode
    </button>
  );
}

interface Props {
  sandbox?: boolean;
  onSwitchToView: () => void;
}

export default function EditorTopBar({
  sandbox,
  onSwitchToView,
}: Readonly<Props>): React.JSX.Element {
  const activeProject = useStore((s) => s.activeProject);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const density = useStore((s) => s.density);
  const setDensity = useStore((s) => s.setDensity);
  const authLoading = useStore((s) => s.authLoading);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="brand">
          <img src="/stack-atlas.png" alt="Stack Atlas" className="brand-logo" />
          <span className="brand-name">Stack Atlas</span>
        </div>
        <Breadcrumbs
          project={activeProject}
          subsystem={activeSubsystem}
          mode={sandbox ? "sandbox" : "edit"}
        />
      </div>
      <div className="top-bar-right">
        <ViewModeButton show={!sandbox && !!activeProject} onClick={onSwitchToView} />
        {sandbox && <span className="sandbox-indicator">Sandbox</span>}
        <div className="editor-controls">
          <ViewToggle
            label="View"
            options={VIEW_OPTIONS}
            current={viewMode}
            onChange={(v: string) => setViewMode(v as ViewMode)}
          />
          <ViewToggle
            label="Density"
            options={DENSITY_OPTIONS}
            current={density}
            onChange={(v: string) => setDensity(v as Density)}
          />
        </div>
        {!authLoading && <AuthBar />}
      </div>
    </div>
  );
}
