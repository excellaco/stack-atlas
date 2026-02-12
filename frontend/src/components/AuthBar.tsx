import { useState } from "react";
import { useStore } from "../store";
import { selectIsAdmin } from "../store/selectors";
import "./AuthBar.css";

interface SignInFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onCancel: () => void;
}

function SignInForm({ onSignIn, onCancel }: Readonly<SignInFormProps>): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSignIn(email, password);
      onCancel();
    } catch (err: unknown) {
      setError((err as Error).message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        required
      />
      <button type="submit" className="primary" disabled={loading}>
        {loading ? "..." : "Sign in"}
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Cancel
      </button>
      {error && <span className="auth-error">{error}</span>}
    </form>
  );
}

export default function AuthBar(): React.JSX.Element {
  const user = useStore((s) => s.user);
  const signIn = useStore((s) => s.signIn);
  const signOut = useStore((s) => s.signOut);
  const isAdmin = useStore((s) => selectIsAdmin(s));
  const setShowAdmin = useStore((s) => s.setShowAdmin);
  const [showForm, setShowForm] = useState(false);

  if (user) {
    return (
      <div className="auth-bar">
        <span className="auth-user">{user.email}</span>
        {isAdmin && (
          <button type="button" className="ghost" onClick={() => setShowAdmin(true)}>
            Admin
          </button>
        )}
        <button type="button" className="ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-bar">
      {showForm ? (
        <SignInForm onSignIn={signIn} onCancel={() => setShowForm(false)} />
      ) : (
        <button type="button" className="ghost" onClick={() => setShowForm(true)}>
          Sign in
        </button>
      )}
    </div>
  );
}
