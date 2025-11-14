/**
 * OKASStream Component
 *
 * Handles OKAS (Omniverse Kit Application Streaming) connections
 * Supports both creating new sessions and connecting to existing ones
 */

import React, { Component } from 'react';
import {
  AppStreamer,
  StreamEvent,
} from '@nvidia/omniverse-webrtc-streaming-library';
import { InternalStreamConfig } from '../../../types';
import {
  useOKASSession,
  type OKASSessionParams,
  type ConnectionParams,
} from '../../../store/hooks/useOKASSession';
import StreamVideoDisplay from '../StreamVideoDisplay/StreamVideoDisplay';
import StreamStatusOverlay from '../StreamStatusOverlay/StreamStatusOverlay';
import {
  createStreamEventHandlers,
} from '../utils/streamEventHandlers';

export interface OKASStreamProps {
  appServer: string;
  streamServer: string;
  appId: string;
  appVersion: string;
  profile: string;
  app: string;
  accessToken?: string;
  initialSessionId?: string; // Pre-created session ID to connect to
  onEndStreamReady?: (endStreamFn: () => void) => void;
  onStreamDisconnected?: () => void;
  style?: React.CSSProperties;
  onStart?: (message: StreamEvent) => void;
  onStop?: (message: StreamEvent) => void;
  onUpdate?: (message: StreamEvent) => void;
  onCustomEvent?: (message: StreamEvent) => void;
  onStreamStats?: (message: StreamEvent) => void;
  onSessionCreated?: (sessionId: string) => void;
}

export interface OKASStreamState {
  streamReady: boolean;
  isConnecting: boolean;
  error: string | null;
}

// Session input UI removed - using common SessionSelectionPanel at page level

/**
 * OKASStream - OKAS streaming component with session management
 *
 * Note: This component cannot extend BaseStreamComponent due to hook usage
 * but uses shared event handling logic pattern
 */
export class OKASStream extends Component<OKASStreamProps, OKASStreamState> {
  private appStreamer?: AppStreamer;
  private static currentInstance: OKASStream | null = null;

  // Session management (will be initialized from hook)
  public sessionId: string | null = null;
  public sessionStatus: 'idle' | 'creating' | 'polling' | 'ready' | 'error' =
    'idle';
  public connectionParams: ConnectionParams | null = null;
  public createSession?: () => Promise<void>;
  public connectToExistingSession?: (sessionId: string) => Promise<void>;
  public destroySession?: () => Promise<void>;

  constructor(props: OKASStreamProps) {
    super(props);

    this.state = {
      streamReady: false,
      isConnecting: false,
      error: null,
    };

    OKASStream.currentInstance = this;
  }

  componentDidMount(): void {
    console.log('OKASStream: Component mounted, waiting for hook to manage session...');
    // DON'T auto-create sessions here - let the hook manage it
    // No UI state needed - session input handled by SessionSelectionPanel at page level

    // Provide end stream function to parent
    if (this.props.onEndStreamReady) {
      this.props.onEndStreamReady(this.handleEndStream);
    }
  }

  componentDidUpdate(
    _prevProps: OKASStreamProps,
    prevState: OKASStreamState
  ): void {
    // When connection params become available and status is ready, initialize stream
    // Only if not already connecting/connected and AppStreamer not created
    // AND only if these conditions just became true (prevent infinite loops)
    const justBecameReady =
      this.connectionParams &&
      this.sessionStatus === 'ready' &&
      !this.state.streamReady &&
      !this.state.isConnecting &&
      !this.appStreamer &&
      (prevState.isConnecting !== this.state.isConnecting || !prevState.isConnecting);

    if (justBecameReady) {
      console.log(
        'OKASStream componentDidUpdate: Connection params ready, initializing stream...'
      );
      this.setState({ isConnecting: true }, () => {
        this.initializeStream();
      });
    }
  }

  componentWillUnmount(): void {
    this.cleanup();
    if (OKASStream.currentInstance === this) {
      OKASStream.currentInstance = null;
    }
  }

  // Session input handling removed - handled by SessionSelectionPanel at page level

  /**
   * Wait for required DOM elements to be available and properly configured
   */
  private waitForDOMElements = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds total

      const checkElements = () => {
        const videoElement = document.getElementById(
          'remote-video'
        ) as HTMLVideoElement;
        const audioElement = document.getElementById(
          'remote-audio'
        ) as HTMLAudioElement;
        const messageElement = document.getElementById('message-display');

        if (videoElement && audioElement && messageElement) {
          // Ensure elements are properly configured for NVIDIA library
          try {
            // Explicitly set required properties that the library expects
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.autoplay = true;
            audioElement.muted = true;

            console.log(
              'OKASStream: All required DOM elements found and configured'
            );
            resolve();
          } catch (error) {
            console.error(
              'OKASStream: Failed to configure DOM elements:',
              error
            );
            reject(error);
          }
        } else if (attempts >= maxAttempts) {
          const missing = [];
          if (!videoElement) missing.push('remote-video');
          if (!audioElement) missing.push('remote-audio');
          if (!messageElement) missing.push('message-display');
          reject(
            new Error(`Required DOM elements not found: ${missing.join(', ')}`)
          );
        } else {
          attempts++;
          setTimeout(checkElements, 100);
        }
      };

      checkElements();
    });
  };

  /**
   * Initialize streaming with connection params
   */
  private initializeStream = async (): Promise<void> => {
    if (!this.connectionParams) {
      console.error('OKASStream: No connection params available');
      return;
    }

    try {
      this.setState({ isConnecting: true, error: null });

      console.log(
        'OKASStream: Initializing stream with params:',
        this.connectionParams
      );

      await this.waitForDOMElements();

      this.appStreamer = new AppStreamer();

      const streamConfig: InternalStreamConfig = {
        videoElementId: 'remote-video',
        audioElementId: 'remote-audio',
        authenticate: false,
        maxReconnects: 20,
        signalingServer: this.connectionParams.server,
        signalingPort: this.connectionParams.signalingPort,
        mediaServer: this.connectionParams.server,
        mediaPort: this.connectionParams.mediaPort,
        nativeTouchEvents: true,
        width: 1920,
        height: 1080,
        fps: 30,
        onStart: this.handleStart as (message: unknown) => void,
        onStop: this.handleStop as (message: unknown) => void,
        onUpdate: this.handleUpdate as (message: unknown) => void,
        onCustomEvent: this.handleCustomEvent as (message: unknown) => void,
      };

      console.log('OKASStream: Stream config:', streamConfig);

      const streamParams = {
        streamSource: 'direct',
        streamConfig: streamConfig,
      } as unknown as Parameters<typeof AppStreamer.connect>[0];

      await AppStreamer.connect(streamParams);

      console.log('OKASStream: Connection initiated');
    } catch (error) {
      console.error('OKASStream: Error initializing stream:', error);
      this.setState({
        isConnecting: false,
        error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  /**
   * Cleanup resources
   */
  private cleanup = async (): Promise<void> => {
    if (this.appStreamer) {
      this.appStreamer = undefined;
    }

    if (this.destroySession) {
      await this.destroySession();
    }
  };

  /**
   * Event handlers - using shared utility for consistency
   */
  private eventHandlers = createStreamEventHandlers(
    'OKASStream',
    {
      setStreamReady: ready => this.setState({ streamReady: ready }),
      setIsConnecting: connecting =>
        this.setState({ isConnecting: connecting }),
      setError: error => this.setState({ error }),
    },
    {
      onStart: this.props.onStart,
      onStop: this.props.onStop,
      onUpdate: this.props.onUpdate,
      onCustomEvent: this.props.onCustomEvent,
      onStreamStats: this.props.onStreamStats,
      onStreamDisconnected: this.props.onStreamDisconnected,
    }
  );

  private handleStart = this.eventHandlers.handleStart;
  private handleStop = this.eventHandlers.handleStop;
  private handleUpdate = this.eventHandlers.handleUpdate;
  private handleCustomEvent = this.eventHandlers.handleCustomEvent;

  /**
   * Send message to Omniverse
   */
  public sendMessage = (message: unknown): void => {
    if (this.appStreamer && this.state.streamReady) {
      try {
        const streamerWithMessage = this.appStreamer as AppStreamer & {
          sendMessage?: (msg: string) => void;
        };
        if (
          streamerWithMessage &&
          typeof streamerWithMessage.sendMessage === 'function'
        ) {
          const messageStr =
            typeof message === 'string' ? message : JSON.stringify(message);
          streamerWithMessage.sendMessage(messageStr);
          console.log('OKASStream: Message sent to Omniverse:', message);
        }
      } catch (error) {
        console.error('OKASStream: Failed to send message:', error);
      }
    } else {
      console.warn('OKASStream: Cannot send message - stream not ready');
    }
  };

  /**
   * Get status message for display
   */
  private getStatusMessage = (): string => {
    switch (this.sessionStatus) {
      case 'creating':
        return 'Creating OKAS streaming session...';
      case 'polling':
        return `Polling session status... (Session: ${this.sessionId})`;
      case 'ready':
        return 'Connecting to OKAS stream...';
      case 'error':
        return 'Session error occurred';
      default:
        return 'Initializing...';
    }
  };

  /**
   * Retry connection
   */
  private handleRetry = (): void => {
    this.setState({ error: null }, () => {
      this.initializeStream();
    });
  };

  /**
   * End current stream session
   */
  private handleEndStream = async (): Promise<void> => {
    console.log('OKASStream: Ending stream session...');

    // Clean up AppStreamer
    if (this.appStreamer) {
      try {
        // The AppStreamer might have a disconnect method
        const streamerWithDisconnect = this.appStreamer as AppStreamer & {
          disconnect?: () => void;
        };
        if (typeof streamerWithDisconnect.disconnect === 'function') {
          streamerWithDisconnect.disconnect();
        }
      } catch (error) {
        console.error('OKASStream: Error disconnecting AppStreamer:', error);
      }
      this.appStreamer = undefined;
    }

    // Destroy the session if possible
    if (this.destroySession) {
      try {
        await this.destroySession();
      } catch (error) {
        console.error('OKASStream: Error destroying session:', error);
      }
    }

    // Reset component state
    this.setState({
      streamReady: false,
      isConnecting: false,
      error: null,
    });

    console.log('OKASStream: Stream session ended');
  };

  /**
   * End current session
   */

  render(): React.ReactNode {
    const { style } = this.props;
    const { streamReady, isConnecting, error } = this.state;

    return (
      <div
        className='okas-stream-container'
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: '#000000ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <div
          key='stream-canvas'
          id='main-div'
          style={{
            backgroundColor: streamReady ? 'black' : '#dddddd',
            visibility: streamReady ? 'visible' : 'hidden',
            width: '100%',
            height: '100%',
            ...style,
          }}
        >
          <StreamVideoDisplay />
        </div>

        {/* Status overlay - no session input, handled at page level */}
        <StreamStatusOverlay
          isConnecting={isConnecting}
          error={error}
          statusMessage={isConnecting ? this.getStatusMessage() : undefined}
          onRetry={this.handleRetry}
        />

        {/* Connection info and end session button */}
        {/* End Session button and session info removed for UI consistency */}
      </div>
    );
  }

  /**
   * Static method for sending messages
   */
  public static sendMessage(message: string): void {
    const instance = OKASStream.currentInstance;
    if (instance && instance.state.streamReady) {
      instance.sendMessage(JSON.parse(message));
    } else {
      console.warn('OKASStream: No active instance or stream not ready');
    }
  }
}

/**
 * Wrapper component to inject hook into class component
 */
export function OKASStreamWithHook(props: OKASStreamProps): JSX.Element {
  const sessionParams: OKASSessionParams = {
    streamServer: props.streamServer,
    appId: props.appId,
    appVersion: props.appVersion,
    profile: props.profile,
  };

  const sessionHook = useOKASSession(sessionParams);

  return <OKASStreamWithHookInjector {...props} sessionHook={sessionHook} />;
}

/**
 * Injector component that passes hook results to class component
 */
class OKASStreamWithHookInjector extends Component<
  OKASStreamProps & { sessionHook: ReturnType<typeof useOKASSession> }
> {
  private streamRef = React.createRef<OKASStream>();

  componentDidMount(): void {
    this.injectHookValues();
  }

  componentDidUpdate(): void {
    this.injectHookValues();
  }

  private sessionCreationInitiated = false;

  private injectHookValues = (): void => {
    if (this.streamRef.current) {
      const stream = this.streamRef.current;
      const hook = this.props.sessionHook;

      const prevSessionStatus = stream.sessionStatus;
      const prevConnectionParams = stream.connectionParams;

      stream.sessionId = hook.sessionId;
      stream.sessionStatus = hook.sessionStatus;
      stream.connectionParams = hook.connectionParams;
      stream.createSession = hook.createSession;
      stream.connectToExistingSession = hook.connectToExistingSession;
      stream.destroySession = hook.destroySession;

      // Auto-start session management if hook is idle but no session exists
      // Only do this once to prevent infinite loops
      if (
        hook.sessionStatus === 'idle' &&
        !hook.sessionId &&
        hook.createSession &&
        !this.sessionCreationInitiated
      ) {
        this.sessionCreationInitiated = true;
        if (stream.props.initialSessionId) {
          console.log('OKASStreamWithHookInjector: Connecting to existing session:', stream.props.initialSessionId);
          hook.connectToExistingSession(stream.props.initialSessionId);
        } else {
          console.log('OKASStreamWithHookInjector: Creating new session...');
          hook.createSession();
        }
      }

      // Trigger re-render when session status changes to ready with connection params
      // Only if status actually changed to prevent infinite loops
      if (
        hook.sessionStatus === 'ready' &&
        hook.connectionParams &&
        prevSessionStatus !== 'ready' &&
        !prevConnectionParams
      ) {
        console.log(
          'OKASStreamWithHookInjector: Session ready, forcing re-render'
        );
        stream.forceUpdate();
      }

      // Trigger re-render if needed for errors (only if error state changed)
      if (hook.error && hook.error !== stream.state.error) {
        stream.setState({ error: hook.error });
      }
    }
  };

  render(): React.ReactNode {
    const { ...streamProps } = this.props;
    return <OKASStream ref={this.streamRef} {...streamProps} />;
  }
}

export default OKASStreamWithHook;
