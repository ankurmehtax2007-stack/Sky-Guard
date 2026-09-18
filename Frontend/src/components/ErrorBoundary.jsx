import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("[ErrorBoundary] Caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#030816",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", color: "#f8fafc", fontFamily: "monospace",
          padding: "40px", gap: "16px", zIndex: 9999
        }}>
          <div style={{ fontSize: "20px", color: "#ef4444", fontWeight: 700 }}>
            ⚠ React Error — Component Crashed
          </div>
          <div style={{
            background: "#0f172a", border: "1px solid #ef4444", borderRadius: "8px",
            padding: "20px", maxWidth: "800px", width: "100%", whiteSpace: "pre-wrap",
            fontSize: "12px", color: "#fca5a5", overflowY: "auto", maxHeight: "400px"
          }}>
            {String(this.state.error)}
            {"\n\n"}
            {this.state.info?.componentStack}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null, info: null }); }}
            style={{
              background: "#1d4ed8", color: "white", border: "none",
              borderRadius: "6px", padding: "10px 24px", cursor: "pointer", fontSize: "14px"
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
