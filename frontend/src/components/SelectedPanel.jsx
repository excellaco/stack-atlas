import { useStore } from "../store";
import CommitPane from "./CommitPane";
import CommitLog from "./CommitLog";

function CopyMenu({ onCopyAs }) {
  return (
    <div className="copy-menu">
      <button type="button" className="copy-trigger" title="Copy stack">
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
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <div className="copy-dropdown">
        <button type="button" onClick={() => onCopyAs("markdown")}>
          Markdown
        </button>
        <button type="button" onClick={() => onCopyAs("json")}>
          JSON
        </button>
      </div>
    </div>
  );
}

function SelectedGroups({ selectedByCategory, inheritedSet, removeItem }) {
  return (
    <div className="selected-groups">
      {selectedByCategory.map((group) => (
        <div key={group.category.id} className="selected-group">
          <div className="selected-group-title">
            <span className="dot" data-category={group.category.id} />
            {group.category.name}
          </div>
          <div className="selected-chips">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="selected-chip"
                data-inherited={inheritedSet.has(item.id) || undefined}
                onClick={() => removeItem(item.id)}
              >
                {item.name}
                {inheritedSet.has(item.id) && <span className="inherited-dot" />}
                <span className="remove">x</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectContext({ sandbox, hasActualChanges }) {
  const activeProject = useStore((s) => s.activeProject);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const token = useStore((s) => s.token);

  if (sandbox || !activeProject) return null;

  return (
    <>
      <div className="project-context">
        <strong>{activeProject.name}</strong>
        {activeSubsystem && <span> / {activeSubsystem.name}</span>}
        {hasActualChanges && <span className="draft-badge">Draft</span>}
      </div>
      {token && <CommitPane />}
      <CommitLog />
    </>
  );
}

export default function SelectedPanel({
  sandbox,
  selectedByCategory,
  inheritedSet,
  handleCopyAs,
  hasActualChanges,
}) {
  const selectedItems = useStore((s) => s.selectedItems);
  const removeItem = useStore((s) => s.removeItem);
  const count = selectedItems.length;

  return (
    <aside className="selected-panel">
      <ProjectContext sandbox={sandbox} hasActualChanges={hasActualChanges} />
      <div className="panel-header">
        <h3>Selected Stack{count > 0 ? ` (${count})` : ""}</h3>
        <CopyMenu onCopyAs={handleCopyAs} />
      </div>
      {count ? (
        <SelectedGroups
          selectedByCategory={selectedByCategory}
          inheritedSet={inheritedSet}
          removeItem={removeItem}
        />
      ) : (
        <div className="empty-state">Select items to build a standardized stack output.</div>
      )}
    </aside>
  );
}
