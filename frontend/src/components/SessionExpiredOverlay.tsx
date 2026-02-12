import { useStore } from "../store";

export default function SessionExpiredOverlay(): React.JSX.Element | null {
  const sessionExpired = useStore((s) => s.sessionExpired);
  const setSessionExpired = useStore((s) => s.setSessionExpired);
  const signOut = useStore((s) => s.signOut);

  if (!sessionExpired) return null;

  const handleDismiss = (): void => {
    setSessionExpired(false);
    signOut();
  };

  return (
    <div className="session-expired-overlay" onClick={handleDismiss}>
      <div className="session-expired-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <h3>Session Expired</h3>
        <p>Your session has expired. Please sign in again to continue.</p>
        <button type="button" className="primary" onClick={handleDismiss}>
          Sign in again
        </button>
      </div>
    </div>
  );
}
