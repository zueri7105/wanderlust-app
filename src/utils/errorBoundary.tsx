import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Last line of defence against a blank page: if ANY render crash ever happens
 * (a stored data shape from an older version, a rare device quirk…), the
 * whole React tree used to unmount into a white void. This boundary catches
 * it and shows a styled recovery screen with working Reload / Reset buttons.
 * Styled with inline styles only — no CSS file needed.
 */
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown, info: unknown) {
    // One breadcrumb in the console for support; the UI stays up either way.
    try {
      console.error('WanderLust crashed — caught by AppErrorBoundary:', err, info);
    } catch {
      /* console itself unavailable */
    }
  }

  private reload = () => {
    try {
      window.location.reload();
    } catch {
      /* nothing more we can do */
    }
  };

  private resetData = () => {
    try {
      const keep = new Set(['wanderlust_app_settings', 'wanderlust_app_lang']);
      Object.keys(localStorage).forEach((key) => {
        if (keep.has(key)) return;
        if (key.startsWith('roamtogether_') || key.startsWith('wanderlust_')) {
          localStorage.removeItem(key);
        }
      });
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.25), transparent 70%), #06030f',
          color: '#e9d5ff',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
          <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
            WanderLust hit a bump
          </p>
          <p style={{ fontSize: 13, opacity: 0.75, margin: '0 0 20px', lineHeight: 1.6 }}>
            Something went wrong while loading your travel data. Reloading usually fixes it;
            if not, resetting clears old saved trips and starts fresh.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.reload}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                background: '#8b5cf6',
                color: '#06030f',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.resetData}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '1px solid rgba(233,213,255,0.35)',
                background: 'transparent',
                color: '#e9d5ff',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Reset trip data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
