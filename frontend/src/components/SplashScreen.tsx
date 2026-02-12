import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import "./SplashScreen.css";

interface SplashSignInFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
}

function SplashSignInForm({ onSignIn }: Readonly<SplashSignInFormProps>): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (err: unknown) {
      setError((err as Error).message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="splash-form"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <input
        ref={emailRef}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        required
      />
      {error && <span className="splash-error">{error}</span>}
      <button type="submit" className="primary" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function SplashScreen(): React.JSX.Element {
  const signIn = useStore((s) => s.signIn);

  return (
    <div className="splash">
      <div className="splash-card">
        <div className="splash-brand">
          <img src="/stack-atlas.png" alt="Stack Atlas" className="splash-logo" />
          <h1>Stack Atlas</h1>
        </div>
        <p className="splash-tagline">
          Unify how teams describe their technology stacks. Filter, select, and export a standard
          format that everyone can compare across programs.
        </p>
        <SplashSignInForm onSignIn={signIn} />
        <div className="splash-divider">
          <span>or</span>
        </div>
        <Link to="/sandbox" className="splash-sandbox">
          Try the sandbox
        </Link>
        <p className="splash-sandbox-hint">
          Explore the catalog and build stacks without an account. Changes won't be saved.
        </p>
      </div>
    </div>
  );
}
