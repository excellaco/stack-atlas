import { formatTimeAgo } from "../utils/diff";

export default function AdminLocksTab({ locks, onBreakLock }) {
  if (locks.length === 0) {
    return (
      <section className="admin-section">
        <div className="diff-empty">No active locks</div>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <div className="admin-table">
        {locks.map((lock) => (
          <div key={`${lock.projectId}-${lock.userSub}`} className="admin-table-row">
            <div className="admin-table-main">
              <strong>{lock.projectId}</strong>
              <span className="admin-table-desc">{lock.email}</span>
            </div>
            <span className="admin-table-meta">{formatTimeAgo(lock.lockedAt)}</span>
            <button
              type="button"
              className="ghost danger"
              onClick={() => onBreakLock(lock.projectId, lock.userSub)}
            >
              Break
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
