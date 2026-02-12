import { useEffect, useState } from 'react'
import * as api from '../api'
import { computeDiff, resolveItemName, formatTimeAgo } from '../utils/diff'
import './CommitLog.css'

export default function CommitLog({ token, projectId, itemsById, commitVersion }) {
  const [commits, setCommits] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)

  useEffect(() => {
    if (!token || !projectId) {
      setCommits([])
      return
    }
    setLoading(true)
    api.getCommits(token, projectId)
      .then(setCommits)
      .catch(() => setCommits([]))
      .finally(() => setLoading(false))
  }, [token, projectId, commitVersion])

  const toggleExpand = (commitId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(commitId)) next.delete(commitId)
      else next.add(commitId)
      return next
    })
  }

  const renderCommitEntry = (commit, index, allCommits) => {
    const isExpanded = expanded.has(commit.id)
    const prevSnapshot = index < allCommits.length - 1 ? allCommits[index + 1]?.snapshot : null
    const diff = isExpanded ? computeDiff(prevSnapshot, commit.snapshot) : null
    const hasChanges = diff && (
      diff.stackAdded.length || diff.stackRemoved.length ||
      diff.providersAdded.length || diff.providersRemoved.length ||
      diff.subsystemsAdded.length || diff.subsystemsRemoved.length ||
      diff.subsystemsChanged.length
    )

    return (
      <div key={commit.id} className="commit-entry">
        <div className="commit-entry-header" onClick={() => toggleExpand(commit.id)}>
          <span className="commit-entry-toggle">{isExpanded ? '▾' : '▸'}</span>
          <div className="commit-entry-body">
            <div className="commit-entry-message">{commit.message}</div>
            <div className="commit-entry-meta">
              {commit.author} · {formatTimeAgo(commit.timestamp)}
            </div>
          </div>
        </div>
        {isExpanded && diff && (
          <div className="commit-diff">
            {!hasChanges && <div className="diff-empty">Initial commit</div>}

            {(diff.stackAdded.length > 0 || diff.stackRemoved.length > 0) && (
              <>
                <div className="diff-section">Stack</div>
                {diff.stackAdded.map((id) => (
                  <div key={`+${id}`} className="diff-added">{resolveItemName(id, itemsById)}</div>
                ))}
                {diff.stackRemoved.map((id) => (
                  <div key={`-${id}`} className="diff-removed">{resolveItemName(id, itemsById)}</div>
                ))}
              </>
            )}

            {(diff.providersAdded.length > 0 || diff.providersRemoved.length > 0) && (
              <>
                <div className="diff-section">Cloud Providers</div>
                {diff.providersAdded.map((p) => (
                  <div key={`+p-${p}`} className="diff-added">{p.toUpperCase()}</div>
                ))}
                {diff.providersRemoved.map((p) => (
                  <div key={`-p-${p}`} className="diff-removed">{p.toUpperCase()}</div>
                ))}
              </>
            )}

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
              <div key={`~sub-${sub.id}`}>
                <div className="diff-section">Subsystem: {sub.name}</div>
                {sub.additionsAdded.map((id) => (
                  <div key={`+a-${id}`} className="diff-added">addition: {resolveItemName(id, itemsById)}</div>
                ))}
                {sub.additionsRemoved.map((id) => (
                  <div key={`-a-${id}`} className="diff-removed">addition: {resolveItemName(id, itemsById)}</div>
                ))}
                {sub.exclusionsAdded.map((id) => (
                  <div key={`+e-${id}`} className="diff-added">exclusion: {resolveItemName(id, itemsById)}</div>
                ))}
                {sub.exclusionsRemoved.map((id) => (
                  <div key={`-e-${id}`} className="diff-removed">exclusion: {resolveItemName(id, itemsById)}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="commit-log">
      <div className="commit-log-header" onClick={() => setIsOpen(!isOpen)}>
        <h4>History{commits.length > 0 ? ` (${commits.length})` : ''}</h4>
        <span className="commit-log-toggle">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div className="commit-log-list">
          {loading && <div className="diff-empty">Loading...</div>}
          {!loading && !commits.length && (
            <div className="diff-empty">No commits yet — make changes and commit to start tracking history.</div>
          )}
          {commits.slice(0, 5).map((commit, index) => renderCommitEntry(commit, index, commits))}
          {commits.length > 5 && (
            <button type="button" className="ghost commit-view-all" onClick={() => setShowFullHistory(true)}>
              View all history ({commits.length} commits)
            </button>
          )}
        </div>
      )}

      {showFullHistory && (
        <div className="commit-full-overlay" onClick={() => setShowFullHistory(false)}>
          <div className="commit-full-modal" onClick={(e) => e.stopPropagation()}>
            <div className="commit-full-header">
              <h3>Commit History ({commits.length})</h3>
              <button type="button" className="ghost" onClick={() => setShowFullHistory(false)}>Close</button>
            </div>
            <div className="commit-full-list">
              {commits.map((commit, index) => renderCommitEntry(commit, index, commits))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
