import { useMemo, useState } from "react";
import { useStore } from "../store";
import {
  selectDirty,
  selectPendingChanges,
  selectCatalogItems,
  selectItemsById,
} from "../store/selectors";
import "./CommitPane.css";

function ChangesList({ pendingChanges, hasChanges, dirty, resolveItemName }) {
  if (hasChanges) {
    return (
      <div className="commit-pane-changes">
        {pendingChanges.itemsAdded.map((id) => (
          <div key={`+${id}`} className="diff-added">
            {resolveItemName(id)}
          </div>
        ))}
        {pendingChanges.itemsRemoved.map((id) => (
          <div key={`-${id}`} className="diff-removed">
            {resolveItemName(id)}
          </div>
        ))}
        {pendingChanges.providersAdded.map((p) => (
          <div key={`+p-${p}`} className="diff-added">
            Provider: {p.toUpperCase()}
          </div>
        ))}
        {pendingChanges.providersRemoved.map((p) => (
          <div key={`-p-${p}`} className="diff-removed">
            Provider: {p.toUpperCase()}
          </div>
        ))}
      </div>
    );
  }
  if (dirty) {
    return <div className="commit-pane-no-changes">Saving changes...</div>;
  }
  return <div className="commit-pane-no-changes">No changes to commit</div>;
}

function CommitForm({ message, setMessage, onSubmit, onDiscard, loading, error, disabled }) {
  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        className="commit-pane-input"
        placeholder="Describe what changed..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <div className="auth-error">{error}</div>}
      <div className="commit-pane-actions">
        <button type="submit" className="primary" disabled={loading || !message.trim() || disabled}>
          {loading ? "Committing..." : "Commit"}
        </button>
        <button type="button" className="ghost danger" disabled={disabled} onClick={onDiscard}>
          Discard
        </button>
      </div>
    </form>
  );
}

function getStatusLabel(draftStatus, dirty, hasChanges) {
  if (draftStatus === "saving") return "Saving...";
  if (dirty) return "Unsaved changes";
  if (hasChanges) return "Draft saved";
  return "Up to date";
}

function getStatusClass(draftStatus, dirty, hasChanges) {
  if (draftStatus === "saving") return "saving";
  if (dirty) return "unsaved";
  if (hasChanges) return "saved";
  return "idle";
}

function computeHasChanges(pendingChanges) {
  return (
    pendingChanges &&
    (pendingChanges.itemsAdded.length > 0 ||
      pendingChanges.itemsRemoved.length > 0 ||
      pendingChanges.providersAdded.length > 0 ||
      pendingChanges.providersRemoved.length > 0)
  );
}

function CommitPaneHeader({ isOpen, setIsOpen, statusClass, statusLabel }) {
  return (
    <div className="commit-pane-header" onClick={() => setIsOpen(!isOpen)}>
      <div className="commit-pane-title">
        <h4>Changes</h4>
        <span className={`commit-pane-status ${statusClass}`}>{statusLabel}</span>
      </div>
      <span className="commit-pane-toggle">{isOpen ? "\u2212" : "+"}</span>
    </div>
  );
}

function useCommitPaneData() {
  const dirty = useStore((s) => selectDirty(s));
  const hasDraft = useStore((s) => s.hasDraft);
  const draftStatus = useStore((s) => s.draftStatus);
  const commitAction = useStore((s) => s.commit);
  const discard = useStore((s) => s.discard);

  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);
  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
    [catalogRawItems, catalogDescriptions]
  );
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems]);

  const pendingChanges = useStore((s) =>
    selectPendingChanges({
      activeProject: s.activeProject,
      savedStack: s.savedStack,
      activeSubsystem: s.activeSubsystem,
      subsystems: s.subsystems,
      selectedItems: s.selectedItems,
      savedProviders: s.savedProviders,
      selectedProviders: s.selectedProviders,
    })
  );

  const hasChanges = computeHasChanges(pendingChanges);

  const resolveItemName = (id) => {
    const item = itemsById?.get(id);
    return item ? `${item.name} (${item.type})` : id;
  };

  return {
    dirty,
    hasDraft,
    draftStatus,
    commitAction,
    discard,
    pendingChanges,
    hasChanges,
    resolveItemName,
  };
}

function useCommitActions(
  commitAction,
  discard,
  setMessage,
  setIsOpen,
  setLoading,
  setError,
  message
) {
  const handleCommit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      await commitAction(message.trim());
      setMessage("");
      setIsOpen(false);
    } catch (err) {
      setError(err.message || "Commit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async () => {
    const ok = await useStore.getState().requestConfirm({
      title: "Discard Draft",
      message: "Discard all uncommitted changes? This cannot be undone.",
      confirmLabel: "Discard",
      variant: "danger",
    });
    if (!ok) return;
    await discard();
  };

  return { handleCommit, handleDiscard };
}

function useCommitFormState(commitAction, discard) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const actions = useCommitActions(
    commitAction,
    discard,
    setMessage,
    setIsOpen,
    setLoading,
    setError,
    message
  );
  return { isOpen, setIsOpen, message, setMessage, loading, error, ...actions };
}

export default function CommitPane() {
  const data = useCommitPaneData();
  const form = useCommitFormState(data.commitAction, data.discard);

  return (
    <div className="commit-pane">
      <CommitPaneHeader
        isOpen={form.isOpen}
        setIsOpen={form.setIsOpen}
        statusClass={getStatusClass(data.draftStatus, data.dirty, data.hasChanges)}
        statusLabel={getStatusLabel(data.draftStatus, data.dirty, data.hasChanges)}
      />
      {form.isOpen && (
        <div className="commit-pane-diff">
          <ChangesList
            pendingChanges={data.pendingChanges}
            hasChanges={data.hasChanges}
            dirty={data.dirty}
            resolveItemName={data.resolveItemName}
          />
        </div>
      )}
      <CommitForm
        message={form.message}
        setMessage={form.setMessage}
        onSubmit={form.handleCommit}
        onDiscard={form.handleDiscard}
        loading={form.loading}
        error={form.error}
        disabled={!data.hasDraft && !data.hasChanges}
      />
    </div>
  );
}
