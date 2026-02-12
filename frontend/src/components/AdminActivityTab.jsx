import { computeDiff, resolveItemName, formatTimeAgo } from "../utils/diff";

function CommitDiff({ diff, itemsById }) {
  const hasChanges =
    diff.stackAdded.length ||
    diff.stackRemoved.length ||
    diff.subsystemsAdded.length ||
    diff.subsystemsRemoved.length ||
    diff.subsystemsChanged.length;

  return (
    <div className="commit-diff">
      {!hasChanges && <div className="diff-empty">Initial commit</div>}
      <StackDiff diff={diff} itemsById={itemsById} />
      <SubsystemsDiff diff={diff} itemsById={itemsById} />
    </div>
  );
}

function StackDiff({ diff, itemsById }) {
  if (!diff.stackAdded.length && !diff.stackRemoved.length) return null;
  return (
    <>
      <div className="diff-section">Stack</div>
      {diff.stackAdded.map((id) => (
        <div key={`+${id}`} className="diff-added">
          {resolveItemName(id, itemsById)}
        </div>
      ))}
      {diff.stackRemoved.map((id) => (
        <div key={`-${id}`} className="diff-removed">
          {resolveItemName(id, itemsById)}
        </div>
      ))}
    </>
  );
}

function SubsystemsDiff({ diff, itemsById }) {
  return (
    <>
      {diff.subsystemsAdded.map((sub) => (
        <div key={`+sub-${sub.id}`}>
          <div className="diff-section">Subsystem: {sub.name}</div>
          <div className="diff-added">added</div>
        </div>
      ))}
      {diff.subsystemsRemoved.map((sub) => (
        <div key={`-sub-${sub.id}`}>
          <div className="diff-section">Subsystem: {sub.name}</div>
          <div className="diff-removed">removed</div>
        </div>
      ))}
      {diff.subsystemsChanged.map((sub) => (
        <SubsystemChanges key={`~sub-${sub.id}`} sub={sub} itemsById={itemsById} />
      ))}
    </>
  );
}

function SubsystemChanges({ sub, itemsById }) {
  return (
    <div>
      <div className="diff-section">Subsystem: {sub.name}</div>
      {sub.additionsAdded.map((id) => (
        <div key={`+a-${id}`} className="diff-added">
          addition: {resolveItemName(id, itemsById)}
        </div>
      ))}
      {sub.additionsRemoved.map((id) => (
        <div key={`-a-${id}`} className="diff-removed">
          addition: {resolveItemName(id, itemsById)}
        </div>
      ))}
      {sub.exclusionsAdded.map((id) => (
        <div key={`+e-${id}`} className="diff-added">
          exclusion: {resolveItemName(id, itemsById)}
        </div>
      ))}
      {sub.exclusionsRemoved.map((id) => (
        <div key={`-e-${id}`} className="diff-removed">
          exclusion: {resolveItemName(id, itemsById)}
        </div>
      ))}
    </div>
  );
}

function CommitEntry({ commit, prevSnapshot, isExpanded, onToggle, itemsById }) {
  const diff = isExpanded ? computeDiff(prevSnapshot, commit.snapshot) : null;

  return (
    <div className="commit-entry">
      <div className="commit-entry-header" onClick={() => onToggle(commit.id)}>
        <span className="commit-entry-toggle">{isExpanded ? "\u25BE" : "\u25B8"}</span>
        <div className="commit-entry-body">
          <div className="commit-entry-message">
            <span className="commit-project-tag">{commit.projectName}</span> {commit.message}
          </div>
          <div className="commit-entry-meta">
            {commit.author} · {formatTimeAgo(commit.timestamp)}
          </div>
        </div>
      </div>
      {isExpanded && diff && <CommitDiff diff={diff} itemsById={itemsById} />}
    </div>
  );
}

export default function AdminActivityTab({ activity, expandedCommits, onToggleCommit, itemsById }) {
  if (activity.length === 0) {
    return (
      <section className="admin-section">
        <div className="diff-empty">No recent activity</div>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <div className="commit-log-list">
        {activity.map((commit, index) => (
          <CommitEntry
            key={commit.id}
            commit={commit}
            prevSnapshot={index < activity.length - 1 ? activity[index + 1]?.snapshot : null}
            isExpanded={expandedCommits.has(commit.id)}
            onToggle={onToggleCommit}
            itemsById={itemsById}
          />
        ))}
      </div>
    </section>
  );
}
