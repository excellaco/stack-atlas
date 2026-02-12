import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import "./ErrorBoundary.css";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  name,
  error,
  onReset,
}: Readonly<{
  name?: string;
  error: Error | null;
  onReset: () => void;
}>): React.JSX.Element {
  return (
    <div className="error-boundary">
      <div className="error-boundary-content">
        <h2>Something went wrong</h2>
        <p>An unexpected error occurred{name ? ` in ${name}` : ""}.</p>
        {error && <pre className="error-boundary-detail">{error.message}</pre>}
        <div className="error-boundary-actions">
          <button type="button" className="primary" onClick={onReset}>
            Try Again
          </button>
          <button type="button" className="ghost" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const label = this.props.name || "Unknown";
    console.error(`[ErrorBoundary:${label}]`, error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.JSX.Element {
    if (this.state.hasError) {
      return (
        <ErrorFallback name={this.props.name} error={this.state.error} onReset={this.handleReset} />
      );
    }
    return <>{this.props.children}</>;
  }
}
