import React from 'react';

/**
 * ErrorBoundary catches unhandled JavaScript errors in child components
 * and renders a fallback UI instead of crashing the entire application.
 * This is critical for production safety in emergency dispatch scenarios.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TriageOS ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <section className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }} role="alert">
            <h1 style={{ fontSize: '1.5rem' }}>⚠️ System Error</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              TriageOS encountered an unexpected error. Please refresh the page to restore operations.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {this.state.error?.message}
            </p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
              Reload System
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
