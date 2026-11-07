import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught An Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '40px auto', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #fecaca', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>⚠️ FreshFarm React Application Error</h2>
          <p style={{ color: '#475569', marginBottom: '20px' }}>
            An unexpected error occurred while rendering the page component:
          </p>
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
            {this.state.error && this.state.error.toString()}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            style={{ background: '#15803d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Clear Cache & Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
