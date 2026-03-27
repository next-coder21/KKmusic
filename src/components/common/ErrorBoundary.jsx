import React from "react";

/**
 * ErrorBoundary
 * Wraps any subtree and catches render errors.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary: ${this.props.label || "unknown"}]`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          padding: "2rem",
          borderRadius: "12px",
          background: "var(--bg-elevated, #16152a)",
          border: "1px solid rgba(229,62,62,0.2)",
          color: "var(--text-secondary, #9d9bbf)",
          textAlign: "center",
          margin: "1rem",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary, #f1f0ff)",
            marginBottom: "8px",
          }}
        >
          {this.props.label
            ? `${this.props.label} failed to load`
            : "Something went wrong"}
        </p>
        <p style={{ fontSize: "12px", marginBottom: "16px" }}>
          {this.state.error?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            padding: "6px 16px",
            borderRadius: "8px",
            background: "var(--accent, #7c3aed)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
