import { Component, type ReactNode, type ErrorInfo } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
};
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
    reportLovableError(error, { label: this.props.label });
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
        <h2 className="font-display text-xl text-accent">ఈ విభాగం లోడ్ కాలేదు</h2>
        <p className="mt-2 text-sm text-muted-foreground">{this.state.error?.message ?? "Unexpected error"}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={this.reset} className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent">మళ్ళీ ప్రయత్నించండి</button>
          <a href="/" className="rounded-full bg-gradient-gold px-4 py-1.5 text-sm text-gold-foreground">హోమ్</a>
        </div>
      </div>
    );
  }
}
