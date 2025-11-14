/**
 * Streaming Service
 *
 * Handles WebRTC streaming connections and media management
 */

import type {
  StreamConnectionConfig,
  StreamEvent,
} from '../store/slices/streamingSlice';

export class StreamingService {
  private static instance: StreamingService;
  private connection: RTCPeerConnection | null = null;
  private signalingSocket: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private eventCallbacks: ((event: StreamEvent) => void)[] = [];

  private constructor() {}

  static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  /**
   * Initialize streaming connection with configuration
   */
  async initializeStream(config: StreamConnectionConfig): Promise<void> {
    try {
      this.logEvent(
        'info',
        'initialize',
        'starting',
        'Initializing stream connection'
      );

      // Create WebRTC peer connection
      this.connection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add your TURN servers here if needed
        ],
      });

      // Set up event handlers
      this.setupPeerConnectionHandlers();

      // Connect to signaling server
      await this.connectSignaling(config);

      this.logEvent(
        'info',
        'initialize',
        'completed',
        'Stream initialization completed'
      );
    } catch (error) {
      this.logEvent(
        'error',
        'initialize',
        'failed',
        `Initialization failed: ${error}`
      );
      throw error;
    }
  }

  /**
   * Start video stream
   */
  async startVideoStream(videoElementId: string): Promise<void> {
    try {
      this.logEvent('info', 'startVideo', 'starting', 'Starting video stream');

      if (!this.connection) {
        throw new Error('Connection not initialized');
      }

      // Get user media if needed
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Add stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.connection && this.localStream) {
          this.connection.addTrack(track, this.localStream);
        }
      });

      // Attach to video element
      const videoElement = document.getElementById(
        videoElementId
      ) as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.localStream;
      }

      this.logEvent('info', 'startVideo', 'completed', 'Video stream started');
    } catch (error) {
      this.logEvent(
        'error',
        'startVideo',
        'failed',
        `Video stream failed: ${error}`
      );
      throw error;
    }
  }

  /**
   * Stop video stream
   */
  stopVideoStream(): void {
    try {
      this.logEvent('info', 'stopVideo', 'starting', 'Stopping video stream');

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      this.logEvent('info', 'stopVideo', 'completed', 'Video stream stopped');
    } catch (error) {
      this.logEvent(
        'error',
        'stopVideo',
        'failed',
        `Stop video failed: ${error}`
      );
    }
  }

  /**
   * Toggle audio mute
   */
  toggleAudio(mute: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !mute;
      });
      this.logEvent(
        'info',
        'toggleAudio',
        mute ? 'muted' : 'unmuted',
        `Audio ${mute ? 'muted' : 'unmuted'}`
      );
    }
  }

  /**
   * Toggle video mute
   */
  toggleVideo(mute: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !mute;
      });
      this.logEvent(
        'info',
        'toggleVideo',
        mute ? 'muted' : 'unmuted',
        `Video ${mute ? 'muted' : 'unmuted'}`
      );
    }
  }

  /**
   * Get connection quality metrics
   */
  async getConnectionQuality(): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    latency: number;
    bitrate: number;
    frameRate: number;
  }> {
    if (!this.connection) {
      return {
        quality: 'unknown',
        latency: 0,
        bitrate: 0,
        frameRate: 0,
      };
    }

    try {
      const stats = await this.connection.getStats();
      let latency = 0;
      let bitrate = 0;
      let frameRate = 0;

      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          latency = report.currentRoundTripTime * 1000 || 0;
        }
        if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
          bitrate = report.bytesSent ? (report.bytesSent * 8) / 1000 : 0;
          frameRate = report.framesPerSecond || 0;
        }
      });

      // Determine quality based on metrics
      let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' =
        'unknown';
      if (latency < 50 && bitrate > 1000) quality = 'excellent';
      else if (latency < 100 && bitrate > 500) quality = 'good';
      else if (latency < 200 && bitrate > 200) quality = 'fair';
      else if (latency > 0) quality = 'poor';

      return { quality, latency, bitrate, frameRate };
    } catch (error) {
      this.logEvent(
        'error',
        'getQuality',
        'failed',
        `Quality check failed: ${error}`
      );
      return {
        quality: 'unknown',
        latency: 0,
        bitrate: 0,
        frameRate: 0,
      };
    }
  }

  /**
   * Disconnect streaming
   */
  disconnect(): void {
    try {
      this.logEvent('info', 'disconnect', 'starting', 'Disconnecting stream');

      this.stopVideoStream();

      if (this.connection) {
        this.connection.close();
        this.connection = null;
      }

      if (this.signalingSocket) {
        this.signalingSocket.close();
        this.signalingSocket = null;
      }

      this.logEvent('info', 'disconnect', 'completed', 'Stream disconnected');
    } catch (error) {
      this.logEvent(
        'error',
        'disconnect',
        'failed',
        `Disconnect failed: ${error}`
      );
    }
  }

  /**
   * Subscribe to stream events
   */
  onStreamEvent(callback: (event: StreamEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Unsubscribe from stream events
   */
  offStreamEvent(callback: (event: StreamEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  private async connectSignaling(
    config: StreamConnectionConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${config.signalingServer}:${config.signalingPort}`;
      this.signalingSocket = new WebSocket(wsUrl);

      this.signalingSocket.onopen = () => {
        this.logEvent(
          'info',
          'signaling',
          'connected',
          'Signaling server connected'
        );
        resolve();
      };

      this.signalingSocket.onerror = error => {
        this.logEvent(
          'error',
          'signaling',
          'failed',
          `Signaling connection failed: ${error}`
        );
        reject(error);
      };

      this.signalingSocket.onmessage = message => {
        this.handleSignalingMessage(JSON.parse(message.data));
      };
    });
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.onicecandidate = event => {
      if (event.candidate && this.signalingSocket) {
        this.signalingSocket.send(
          JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
          })
        );
      }
    };

    this.connection.ontrack = _event => {
      this.logEvent('info', 'track', 'received', 'Remote track received');
      // Handle incoming track
    };

    this.connection.onconnectionstatechange = () => {
      if (this.connection) {
        this.logEvent(
          'info',
          'connection',
          this.connection.connectionState,
          `Connection state: ${this.connection.connectionState}`
        );
      }
    };
  }

  private handleSignalingMessage(message: unknown): void {
    // Handle signaling messages (offers, answers, ICE candidates)
    this.logEvent(
      'info',
      'signaling',
      'message',
      `Received signaling message: ${JSON.stringify(message)}`
    );
  }

  private logEvent(
    type: 'info' | 'warning' | 'error',
    action: string,
    status: string,
    message?: string
  ): void {
    const event: StreamEvent = {
      timestamp: Date.now(),
      type,
      action,
      status,
      message,
    };

    this.eventCallbacks.forEach(callback => callback(event));
  }
}

export default StreamingService;
