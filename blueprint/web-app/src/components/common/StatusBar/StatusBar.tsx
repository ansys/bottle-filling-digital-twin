/**
 * StatusBar Component
 *
 * Reusable status bar component for displaying design, status, session information and controls
 */

import React from 'react';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  // Basic info
  designName?: string | null;
  status?: string | null;

  // OKAS streaming info
  sessionId?: string | null;
  showSessionInfo?: boolean;

  // Progress (for simulation)
  showProgress?: boolean;
  progress?: number;

  // Actions
  onEndStream?: () => void;

  // Custom class
  className?: string;
}

/**
 * StatusBar Component
 *
 * Displays application status information including design name, status, session ID, and optional progress.
 * Shows End Stream button for active OKAS streaming sessions.
 */
export class StatusBar extends React.Component<StatusBarProps> {
  render(): React.ReactNode {
    const {
      designName,
      status,
      sessionId,
      showSessionInfo = false,
      showProgress = false,
      progress = 0,
      onEndStream,
      className,
    } = this.props;

    return (
      <div className={`${styles.statusBar} ${className || ''}`}>
        {/* Design Name */}
        <div className={styles.statusSection}>
          <span className={styles.statusLabel}>Design:</span>
          <span className={styles.statusValue}>
            {designName || 'None selected'}
          </span>
        </div>

        {/* Status */}
        <div className={styles.statusSection}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={styles.statusValue}>{status || 'Ready'}</span>
        </div>

        {/* Session ID - Only for OKAS streaming */}
        {showSessionInfo && sessionId && (
          <div className={styles.statusSection}>
            <span className={styles.statusLabel}>Session ID:</span>
            <span className={styles.statusValue} title={sessionId}>
              {sessionId}
            </span>
          </div>
        )}

        {/* Progress - Only when simulation is running */}
        {showProgress && (
          <div className={styles.statusSection}>
            <span className={styles.statusLabel}>Progress:</span>
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              />
              <span className={styles.progressText}>{progress}%</span>
            </div>
          </div>
        )}

        {/* End Stream Button - Only for OKAS streaming when session exists */}
        {showSessionInfo && sessionId && onEndStream && (
          <div className={styles.statusSection} style={{ marginLeft: 'auto' }}>
            <button
              className={styles.endStreamButton}
              onClick={onEndStream}
              title='End streaming session'
            >
              End Stream
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default StatusBar;
