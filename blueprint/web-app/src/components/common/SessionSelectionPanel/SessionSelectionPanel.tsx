// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * SessionSelectionPanel Component
 *
 * UI for creating a new OKAS streaming session or connecting to an existing one
 * Shown before the AppStream component when using OKAS streaming
 */

import React, { Component } from 'react';
import styles from './SessionSelectionPanel.module.css';
import {
  createStreamingSession,
  getStreamingSessionInfo,
} from '@/services/Endpoints.tsx';
import type { StreamItem, ErrorItem } from '@/services/Endpoints.tsx';

interface SessionSelectionPanelProps {
  streamServer: string;
  appId: string;
  appVersion: string;
  profile: string;
  onSessionReady: (sessionId: string) => void;
}

interface SessionSelectionPanelState {
  sessionIdInput: string;
  isCreating: boolean;
  isConnecting: boolean;
  error: string | null;
}

/**
 * SessionSelectionPanel Class Component
 *
 * Displays a UI for session creation/connection
 * Once ready, calls onSessionReady() to trigger AppStream display
 */
class SessionSelectionPanel extends Component<
  SessionSelectionPanelProps,
  SessionSelectionPanelState
> {
  constructor(props: SessionSelectionPanelProps) {
    super(props);

    this.state = {
      sessionIdInput: '',
      isCreating: false,
      isConnecting: false,
      error: null,
    };
  }

  /**
   * Handle session ID input change
   */
  private handleSessionIdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ sessionIdInput: e.target.value });
  };

  /**
   * Handle create new session button click
   */
  private handleCreateSession = async (): Promise<void> => {
    const { streamServer, appId, appVersion, profile, onSessionReady } =
      this.props;

    // Validate required parameters
    if (!streamServer || !appId || !appVersion || !profile) {
      this.setState({
        error:
          'Missing required parameters: streamServer, appId, appVersion, or profile',
      });
      return;
    }

    this.setState({ isCreating: true, error: null });

    try {
      console.log('SessionSelectionPanel: Creating new OKAS session...', {
        streamServer,
        appId,
        appVersion,
        profile,
      });

      // Step 1: Create streaming session
      const response = await createStreamingSession(
        streamServer,
        appId,
        appVersion,
        profile
      );

      if (
        response.status !== 200 &&
        response.status !== 201 &&
        response.status !== 202
      ) {
        throw new Error(
          `Failed to create streaming session: ${response.status}`
        );
      }

      // Check if response contains error
      const data = response.data as StreamItem | ErrorItem;
      if ('detail' in data) {
        throw new Error(`OKAS API Error: ${data.detail}`);
      }

      const sessionData = data as StreamItem;
      const sessionId = sessionData.id;

      console.log(
        'SessionSelectionPanel: Session created successfully:',
        sessionId
      );

      this.setState({ sessionIdInput: sessionId });

      // Step 2: Poll session status until ready
      await this.pollSessionStatus(sessionId, streamServer, onSessionReady);
    } catch (error) {
      console.error('SessionSelectionPanel: Error creating session:', error);
      this.setState({
        error: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isCreating: false,
      });
    }
  };

  /**
   * Poll session status until ready
   */
  private pollSessionStatus = async (
    sessionId: string,
    streamServer: string,
    onSessionReady: (sessionId: string) => void
  ): Promise<void> => {
    const SESSION_POLL_MAX_ATTEMPTS = 50; // 50 attempts * 20 seconds = 1000 seconds timeout
    const SESSION_POLL_INTERVAL_MS = 20000; // 20 seconds between polls

    for (let attempt = 1; attempt <= SESSION_POLL_MAX_ATTEMPTS; attempt++) {
      try {
        console.log(
          `SessionSelectionPanel: Polling session status (attempt ${attempt}/${SESSION_POLL_MAX_ATTEMPTS})...`
        );

        const response = await getStreamingSessionInfo(streamServer, sessionId);

        if (
          response.status !== 200 &&
          response.status !== 202 &&
          response.status !== 201
        ) {
          throw new Error(`Failed to get session info: ${response.status}`);
        }

        const sessionInfo = response.data as StreamItem;

        // Check if session has routes (indicates it's ready)
        if (sessionInfo.routes && Object.keys(sessionInfo.routes).length > 0) {
          console.log('SessionSelectionPanel: Session is ready!', sessionInfo);

          // Session is ready, notify parent component
          this.setState({ isCreating: false, isConnecting: false });
          onSessionReady(sessionId);
          return;
        }

        // Session not ready yet, continue polling
        console.log(
          `SessionSelectionPanel: Session not ready yet, waiting ${SESSION_POLL_INTERVAL_MS}ms before next poll...`
        );
        await new Promise(resolve =>
          setTimeout(resolve, SESSION_POLL_INTERVAL_MS)
        );
      } catch (error) {
        console.error(
          `SessionSelectionPanel: Error polling session status (attempt ${attempt}):`,
          error
        );

        if (attempt === SESSION_POLL_MAX_ATTEMPTS) {
          this.setState({
            error: `Session polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isCreating: false,
            isConnecting: false,
          });
          return;
        }

        // Wait before retrying
        await new Promise(resolve =>
          setTimeout(resolve, SESSION_POLL_INTERVAL_MS)
        );
      }
    }

    // Timeout reached
    this.setState({
      error:
        'Session polling timeout: Session did not become ready within expected time',
      isCreating: false,
      isConnecting: false,
    });
  };

  /**
   * Handle connect to existing session button click
   */
  private handleConnectToSession = async (): Promise<void> => {
    const { streamServer, onSessionReady } = this.props;
    const { sessionIdInput } = this.state;

    if (!sessionIdInput.trim()) {
      this.setState({ error: 'Please enter a session ID' });
      return;
    }

    if (!streamServer) {
      this.setState({ error: 'Missing stream server configuration' });
      return;
    }

    this.setState({ isConnecting: true, error: null });

    try {
      console.log('SessionSelectionPanel: Connecting to existing session...', {
        streamServer,
        sessionId: sessionIdInput.trim(),
      });

      // Verify session exists and poll until ready
      await this.pollSessionStatus(
        sessionIdInput.trim(),
        streamServer,
        onSessionReady
      );
    } catch (error) {
      console.error(
        'SessionSelectionPanel: Error connecting to session:',
        error
      );
      this.setState({
        error: `Failed to connect to session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isConnecting: false,
      });
    }
  };

  render(): React.ReactNode {
    const { sessionIdInput, isCreating, isConnecting, error } = this.state;
    const isLoading = isCreating || isConnecting;

    return (
      <div className={styles.panelContainer}>
        <div className={styles.sessionCard}>
          <h1 className={styles.title}>OKAS Streaming Session</h1>

          <p className={styles.description}>
            Enter an existing session ID to connect, or create a new streaming
            session.
          </p>

          {/* Session ID Input */}
          <div className={styles.inputGroup}>
            <label htmlFor='session-id-input' className={styles.label}>
              Session ID (optional)
            </label>
            <input
              id='session-id-input'
              type='text'
              value={sessionIdInput}
              onChange={this.handleSessionIdChange}
              placeholder='Enter existing session ID...'
              disabled={isLoading}
              className={styles.input}
            />
          </div>

          {/* Error Message */}
          {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button
              onClick={
                sessionIdInput.trim()
                  ? this.handleConnectToSession
                  : this.handleCreateSession
              }
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading
                ? 'Please wait...'
                : sessionIdInput.trim()
                  ? 'Connect to Session'
                  : 'Create New Session'}
            </button>
          </div>

          {/* Info Box */}
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>ℹ️ How it works:</p>
            <ul className={styles.infoList}>
              <li>
                <strong>Create New Session:</strong> Leave the session ID blank
                and click the button. A new streaming session will be created
                for you.
              </li>
              <li>
                <strong>Connect to Existing:</strong> Enter a session ID and
                click the button. You'll connect to an already running session.
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default SessionSelectionPanel;
