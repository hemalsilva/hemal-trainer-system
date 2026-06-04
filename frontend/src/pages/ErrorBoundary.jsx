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
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#333', color: 'white', minHeight: '100vh', width: '100vw' }}>
          <h2 style={{ color: 'red', fontSize: '2rem' }}>Dashboard Crashed (Auto-Expanded)</h2>
          <div style={{ background: '#000', padding: '1rem', marginTop: '1rem', color: '#ff5555', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br /><br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
