/**
 * StreamStatusOverlay Component
 *
 * Displays connection status, loading states, and errors for streaming
 */

import React, { Component } from 'react';

export interface StreamStatusOverlayProps {
  isConnecting: boolean;
  error: string | null;
  statusMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

/**
 * StreamStatusOverlay - Shows connection status and errors
 */
class StreamStatusOverlay extends Component<StreamStatusOverlayProps> {
  render(): React.ReactNode {
    const { isConnecting, error, statusMessage, onRetry, onClose } = this.props;

    // Don't render if nothing to show
    if (!isConnecting && !error && !statusMessage) {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          {/* Loading state */}
          {isConnecting && (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: '#4CAF50',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem',
                }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                {statusMessage || 'Connecting to Omniverse stream...'}
              </p>
            </>
          )}

          {/* Error state */}
          {error && (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f44336',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#f44336' }}>
                Connection Error
              </h3>
              <p style={{ margin: '0 0 1.5rem', color: '#cccccc' }}>{error}</p>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                {onRetry && (
                  <button
                    onClick={onRetry}
                    style={{
                      padding: '0.5rem 1.5rem',
                      backgroundColor: '#4CAF50',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    Retry
                  </button>
                )}
                {onClose && (
                  <button
                    onClick={onClose}
                    style={{
                      padding: '0.5rem 1.5rem',
                      backgroundColor: '#666666',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </>
          )}

          {/* Status message only */}
          {!isConnecting && !error && statusMessage && (
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{statusMessage}</p>
          )}
        </div>

        {/* CSS Animation for spinner */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
}

export default StreamStatusOverlay;
