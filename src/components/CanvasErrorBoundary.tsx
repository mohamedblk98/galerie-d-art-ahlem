import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Lightweight error boundary — catches render / runtime errors
 * inside the Three.js Canvas tree and shows a fallback UI.
 */
export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[CanvasErrorBoundary] Three.js scene crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {this.props.fallback}
          {this.state.error && (
            <div
              style={{
                position: 'fixed',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(20, 10, 15, 0.85)',
                border: '1px solid rgba(220, 80, 80, 0.4)',
                color: '#f8a5a5',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                zIndex: 99999,
                pointerEvents: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              Mode 2D activé ({this.state.error.message})
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
