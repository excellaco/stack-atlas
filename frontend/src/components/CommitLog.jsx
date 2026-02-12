import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { selectCatalogItems, selectItemsById } from "../store/selectors";
import * as api from "../api";
import { computeDiff, formatTimeAgo } from "../utils/diff";
import {
  StackDiffSection,
  ProviderDiffSection,
  SubsystemAddRemoveSection,
  SubsystemChangedSection,
} from "./CommitDiffSections";
import "./CommitLog.css";

function CommitEntry({ commit, diff, isExpanded, onToggle, subId, itemsById }) {
  return (
    <div className="commit-entry">
      <div className="commit-entry-header" onClick={onToggle}>
        <span className="commit-entry-toggle">{isExpanded ? "\u25BE" : "\u25B8"}</span>
        <div className="commit-entry-body">
          <div className="commit-entry-message">{commit.message}</div>
          <div className="commit-entry-meta">
            {commit.author} · {formatTimeAgo(commit.timestamp)}
          </div>
        </div>
      </div>
      {isExpanded && diff && (
        <div className="commit-diff">
          {!subId && <StackDiffSection diff={diff} itemsById={itemsById} />}
          {!subId && <ProviderDiffSection diff={diff} />}
          <SubsystemAddRemoveSection diff={diff} subId={subId} />
          <SubsystemChangedSection diff={diff} subId={subId} itemsById={itemsById} />
        </div>
      )}
    </div>
  );
}

function CommitList({ commits, expanded, onToggle, subId, itemsById }) {
  return commits.map((commit, index) => {
    const prevSnapshot = index < commits.length - 1 ? commits[index + 1]?.snapshot : null;
    const isExpanded = expanded.has(commit.id);
    const diff = isExpanded ? computeDiff(prevSnapshot, commit.snapshot) : null;
    return (
      <CommitEntry
        key={commit.id}
        commit={commit}
        diff={diff}
        isExpanded={isExpanded}
        onToggle={() => onToggle(commit.id)}
        subId={subId}
        itemsById={itemsById}
      />
    );
  });
}

function FullHistoryModal({ commits, expanded, onToggle, subId, itemsById, onClose }) {
  return (
    <div className="commit-full-overlay" onClick={onClose}>
      <div className="commit-full-modal" onClick={(e) => e.stopPropagation()}>
        <div className="commit-full-header">
          <h3>Commit History ({commits.length})</h3>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="commit-full-list">
          <CommitList
            commits={commits}
            expanded={expanded}
            onToggle={onToggle}
            subId={subId}
            itemsById={itemsById}
          />
        </div>
      </div>
    </div>
  );
}

function hasRelevantChanges(diff, subId) {
  if (!diff) return false;
  if (subId) {
    return (
      diff.subsystemsAdded.some((s) => s.id === subId) ||
      diff.subsystemsRemoved.some((s) => s.id === subId) ||
      diff.subsystemsChanged.some((s) => s.id === subId)
    );
  }
  return (
    diff.stackAdded.length ||
    diff.stackRemoved.length ||
    diff.providersAdded.length ||
    diff.providersRemoved.length ||
    diff.subsystemsAdded.length ||
    diff.subsystemsRemoved.length
  );
}

function filterRelevantCommits(commits, subId) {
  return commits.filter((commit, index) => {
    const prevSnapshot = index < commits.length - 1 ? commits[index + 1]?.snapshot : null;
    return hasRelevantChanges(computeDiff(prevSnapshot, commit.snapshot), subId);
  });
}

function CommitLogBody({
  loading,
  relevantCommits,
  expanded,
  toggleExpand,
  subId,
  itemsById,
  onShowFullHistory,
}) {
  return (
    <div className="commit-log-list">
      {loading && <div className="diff-empty">Loading...</div>}
      {!loading && !relevantCommits.length && (
        <div className="diff-empty">No commits yet{subId ? " for this subsystem" : ""}.</div>
      )}
      <CommitList
        commits={relevantCommits.slice(0, 5)}
        expanded={expanded}
        onToggle={toggleExpand}
        subId={subId}
        itemsById={itemsById}
      />
      {relevantCommits.length > 0 && (
        <button type="button" className="ghost commit-view-all" onClick={onShowFullHistory}>
          View all history ({relevantCommits.length} commits)
        </button>
      )}
    </div>
  );
}

function useCommitLogData() {
  const token = useStore((s) => s.token);
  const activeProject = useStore((s) => s.activeProject);
  const commitVersion = useStore((s) => s.commitVersion);
  const activeSubsystem = useStore((s) => s.activeSubsystem);
  const catalogRawItems = useStore((s) => s.catalogRawItems);
  const catalogDescriptions = useStore((s) => s.catalogDescriptions);
  const catalogItems = useMemo(
    () => selectCatalogItems({ catalogRawItems, catalogDescriptions }),
    [catalogRawItems, catalogDescriptions]
  );
  const itemsById = useMemo(() => selectItemsById(catalogItems), [catalogItems]);
  const projectId = activeProject?.id;
  const subId = activeSubsystem?.id;
  const [commits, setCommits] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    if (!token || !projectId) {
      setCommits([]);
      return;
    }
    setLoading(true);
    api
      .getCommits(token, projectId)
      .then(setCommits)
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, [token, projectId, commitVersion]);

  const toggleExpand = useCallback((commitId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(commitId)) next.delete(commitId);
      else next.add(commitId);
      return next;
    });
  }, []);

  const relevantCommits = useMemo(() => filterRelevantCommits(commits, subId), [commits, subId]);
  return {
    subId,
    itemsById,
    expanded,
    loading,
    showFullHistory,
    setShowFullHistory,
    toggleExpand,
    relevantCommits,
  };
}

export default function CommitLog() {
  const {
    subId,
    itemsById,
    expanded,
    loading,
    showFullHistory,
    setShowFullHistory,
    toggleExpand,
    relevantCommits,
  } = useCommitLogData();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="commit-log">
      <div className="commit-log-header" onClick={() => setIsOpen(!isOpen)}>
        <h4>History{relevantCommits.length > 0 ? ` (${relevantCommits.length})` : ""}</h4>
        <span className="commit-log-toggle">{isOpen ? "\u2212" : "+"}</span>
      </div>
      {isOpen && (
        <CommitLogBody
          loading={loading}
          relevantCommits={relevantCommits}
          expanded={expanded}
          toggleExpand={toggleExpand}
          subId={subId}
          itemsById={itemsById}
          onShowFullHistory={() => setShowFullHistory(true)}
        />
      )}
      {showFullHistory && (
        <FullHistoryModal
          commits={relevantCommits}
          expanded={expanded}
          onToggle={toggleExpand}
          subId={subId}
          itemsById={itemsById}
          onClose={() => setShowFullHistory(false)}
        />
      )}
    </div>
  );
}
