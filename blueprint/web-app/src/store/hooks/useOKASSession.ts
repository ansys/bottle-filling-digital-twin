/**
 * Custom React Hook for managing OKAS streaming sessions
 *
 * Handles session creation, polling, and cleanup for OKAS streaming
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createStreamingSession,
  getStreamingSessionInfo,
  destroyStreamingSession,
  type StreamItem,
  type ErrorItem,
} from '../../services/Endpoints';

export interface OKASSessionParams {
  streamServer: string;
  appId: string;
  appVersion: string;
  profile: string;
}

export interface ConnectionParams {
  server: string;
  signalingPort: number;
  mediaPort?: number;
}

export interface UseOKASSessionReturn {
  sessionId: string | null;
  sessionStatus: 'idle' | 'creating' | 'polling' | 'ready' | 'error';
  connectionParams: ConnectionParams | null;
  error: string | null;
  createSession: () => Promise<void>;
  connectToExistingSession: (existingSessionId: string) => Promise<void>;
  destroySession: () => Promise<void>;
}

const SESSION_POLL_MAX_ATTEMPTS = 50;
const SESSION_POLL_INTERVAL_MS = 20000; // Poll every 20 seconds

/**
 * Custom hook for OKAS streaming session management
 */
export function useOKASSession(
  params: OKASSessionParams
): UseOKASSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    'idle' | 'creating' | 'polling' | 'ready' | 'error'
  >('idle');
  const [connectionParams, setConnectionParams] =
    useState<ConnectionParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<boolean>(false);

  /**
   * Extract connection parameters from session routes
   */
  const extractConnectionParams = useCallback(
    (sessionInfo: StreamItem): ConnectionParams | null => {
      try {
        const routes = sessionInfo.routes;
        let signalingPort: number | undefined;
        let mediaPort: number | undefined;
        let streamUrl: string | undefined;

        for (const [key, routeData] of Object.entries(routes)) {
          console.log(`useOKASSession: Processing route ${key}:`, routeData);

          streamUrl = key;

          for (const route of routeData.routes) {
            if (route.description === 'signaling') {
              signalingPort = route.source_port;
            } else if (route.description === 'media') {
              mediaPort = route.source_port;
            }
          }
        }

        if (!signalingPort) {
          console.error(
            'useOKASSession: No signaling port found in session routes'
          );
          return null;
        }

        let server = params.streamServer;
        try {
          const url = new URL(server);
          server = url.hostname;
        } catch {
          // Use as is if not a valid URL
        }

        if (streamUrl) {
          server = streamUrl;
        }

        const connParams: ConnectionParams = {
          server,
          signalingPort,
          mediaPort,
        };

        console.log(
          'useOKASSession: Extracted connection parameters:',
          connParams
        );
        return connParams;
      } catch (err) {
        console.error(
          'useOKASSession: Error extracting connection parameters:',
          err
        );
        return null;
      }
    },
    [params.streamServer]
  );

  /**
   * Poll session status until ready
   */
  const pollSessionStatus = useCallback(
    async (sid: string): Promise<ConnectionParams | null> => {
      pollingRef.current = true;

      for (
        let attempt = 1;
        attempt <= SESSION_POLL_MAX_ATTEMPTS && pollingRef.current;
        attempt++
      ) {
        try {
          console.log(
            `useOKASSession: Polling session status (attempt ${attempt}/${SESSION_POLL_MAX_ATTEMPTS})`
          );

          const response = await getStreamingSessionInfo(
            params.streamServer,
            sid
          );

          if (
            response.status !== 200 &&
            response.status !== 202 &&
            response.status !== 201
          ) {
            throw new Error(
              `Session polling failed with status ${response.status}`
            );
          }

          const sessionInfo = response.data as StreamItem;

          if (
            sessionInfo.routes &&
            Object.keys(sessionInfo.routes).length > 0
          ) {
            console.log('useOKASSession: Session ready with routes');
            const connParams = extractConnectionParams(sessionInfo);

            if (connParams) {
              setSessionStatus('ready');
              setConnectionParams(connParams);
              return connParams;
            }
          }

          console.log(
            `useOKASSession: Session not ready, waiting ${SESSION_POLL_INTERVAL_MS}ms`
          );
          await new Promise(resolve =>
            setTimeout(resolve, SESSION_POLL_INTERVAL_MS)
          );
        } catch (err) {
          console.error(
            `useOKASSession: Error polling (attempt ${attempt}):`,
            err
          );

          if (attempt === SESSION_POLL_MAX_ATTEMPTS) {
            setSessionStatus('error');
            setError('Session polling timeout: Session did not become ready');
            return null;
          }

          await new Promise(resolve =>
            setTimeout(resolve, SESSION_POLL_INTERVAL_MS)
          );
        }
      }

      setSessionStatus('error');
      setError('Session polling timeout');
      return null;
    },
    [params.streamServer, extractConnectionParams]
  );

  /**
   * Create a new OKAS streaming session
   */
  const createSession = useCallback(async (): Promise<void> => {
    // Only prevent if already creating or has active session
    if (sessionStatus === 'creating' || (sessionStatus === 'polling' && sessionId)) {
      console.log('useOKASSession: Session creation already in progress, skipping...');
      return;
    }

    try {
      console.log('useOKASSession: Creating new session...', params);
      setSessionStatus('creating');
      setError(null);

      const response = await createStreamingSession(
        params.streamServer,
        params.appId,
        params.appVersion,
        params.profile
      );

      if (
        response.status !== 200 &&
        response.status !== 201 &&
        response.status !== 202
      ) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const data = response.data as StreamItem | ErrorItem;
      if ('detail' in data) {
        throw new Error(`OKAS API Error: ${data.detail}`);
      }

      const sessionData = data as StreamItem;
      const sid = sessionData.id;

      console.log('useOKASSession: Session created:', sid);
      setSessionId(sid);
      setSessionStatus('polling');

      await pollSessionStatus(sid);
    } catch (err) {
      console.error('useOKASSession: Failed to create session:', err);
      setSessionStatus('error');
      setError(
        `Failed to create session: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [params, pollSessionStatus, sessionStatus, sessionId]);

  /**
   * Connect to an existing OKAS streaming session
   */
  const connectToExistingSession = useCallback(
    async (existingSessionId: string): Promise<void> => {
      // Only prevent if already connecting to the same session
      if ((sessionStatus === 'creating' || sessionStatus === 'polling') && sessionId === existingSessionId) {
        console.log('useOKASSession: Already connecting to this session, skipping...');
        return;
      }

      try {
        console.log(
          'useOKASSession: Connecting to existing session:',
          existingSessionId
        );
        setSessionStatus('polling');
        setError(null);
        setSessionId(existingSessionId);

        await pollSessionStatus(existingSessionId);
      } catch (err) {
        console.error(
          'useOKASSession: Failed to connect to existing session:',
          err
        );
        setSessionStatus('error');
        setError(
          `Failed to connect to session: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    },
    [pollSessionStatus, sessionStatus, sessionId]
  );

  /**
   * Destroy the current streaming session
   */
  const destroySession = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      console.warn('useOKASSession: No session to destroy');
      return;
    }

    try {
      console.log('useOKASSession: Destroying session:', sessionId);
      pollingRef.current = false;

      const response = await destroyStreamingSession(
        params.streamServer,
        sessionId
      );
      if ('detail' in response) {
        console.error(
          'useOKASSession: Error destroying session:',
          response.detail
        );
      } else {
        console.log('useOKASSession: Session destroyed successfully');
      }
    } catch (err) {
      console.error('useOKASSession: Error destroying session:', err);
    } finally {
      setSessionId(null);
      setSessionStatus('idle');
      setConnectionParams(null);
      setError(null);
    }
  }, [sessionId, params.streamServer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollingRef.current = false;
    };
  }, []);

  return {
    sessionId,
    sessionStatus,
    connectionParams,
    error,
    createSession,
    connectToExistingSession,
    destroySession,
  };
}
