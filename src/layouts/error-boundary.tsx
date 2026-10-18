import * as React from "react";

import { DashboardError } from "./error-fallback";

interface State {
  error: Error | null;
}

/**
 * Catches a screen that throws while rendering (a failed data read, a bug)
 * and shows the retry prompt instead of a blank page. The dashboard layout
 * keys this on the current path, so navigating elsewhere clears the error.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <DashboardError error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}
