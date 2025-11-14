/**
 * StreamSourceError Component
 *
 * Error screen for unknown or invalid streaming sources
 */

import React, { Component } from 'react';

export interface StreamSourceErrorProps {
  source?: string;
  style?: React.CSSProperties;
}

/**
 * StreamSourceError - Shows error for unknown streaming sources
 */
class StreamSourceError extends Component<StreamSourceErrorProps> {
  render(): React.ReactNode {
    const { source, style } = this.props;

    return (
      <div
        className='stream-source-error-container'
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            padding: '2rem',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f44336',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '48px',
              fontWeight: 'bold',
            }}
          >
            ✕
          </div>

          <h2
            style={{
              margin: '0 0 1rem',
              fontSize: '2rem',
              color: '#f44336',
            }}
          >
            Invalid Streaming Source
          </h2>

          <p
            style={{
              margin: '0 0 1.5rem',
              fontSize: '1.1rem',
              color: '#cccccc',
              lineHeight: '1.6',
            }}
          >
            {source
              ? `The streaming source "${source}" is not recognized or supported.`
              : 'No streaming source was specified in the configuration.'}
          </p>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              borderLeft: '4px solid #f44336',
              borderRadius: '4px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.875rem',
                color: '#f44336',
                fontWeight: 'bold',
              }}
            >
              Supported Sources:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: '#cccccc',
                fontSize: '0.875rem',
              }}
            >
              <li>
                <code style={{ color: '#4CAF50' }}>local</code> - Direct
                connection to local Omniverse Kit
              </li>
              <li>
                <code style={{ color: '#4CAF50' }}>stream</code> - OKAS
                (Omniverse Kit Application Streaming)
              </li>
              <li>
                <code style={{ color: '#FFA726' }}>gfn</code> - GeForce NOW (Not
                Yet Implemented)
              </li>
            </ul>
          </div>

          <p
            style={{
              margin: '1.5rem 0 0',
              fontSize: '0.875rem',
              color: '#888888',
            }}
          >
            Please check your stream configuration file or contact support.
          </p>
        </div>
      </div>
    );
  }
}

export default StreamSourceError;
