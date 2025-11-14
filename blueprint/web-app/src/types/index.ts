export interface SimulationData {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  timestamp: string;
}

export interface FluidModel {
  id: string;
  name: string;
  type: 'water' | 'mineral_water' | 'custom';
  properties: {
    density: number;
    viscosity: number;
    temperature: number;
  };
}

export interface BottleDesign {
  id: string;
  name: string;
  type: '500-ml-water-bottle' | '2000-ml-water-bottle';
  volume: number;
  material: string;
}

export interface OmniverseRenderState {
  isConnected: boolean;
  renderQuality: 'low' | 'medium' | 'high';
  frameRate: number;
  viewport: {
    width: number;
    height: number;
  };
}

export interface APIError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Stream configuration interface for different streaming sources
export interface StreamConfig {
  source: 'local' | 'gfn' | 'stream';
  stream?: {
    appServer: string;
    streamServer: string;
    appId: string;
    appVersion: string;
    profile: string;
    initialSessionId?: string; // Pre-created session ID to connect to
  };
  gfn?: {
    catalogClientId: string;
    clientId: string;
    cmsId: number;
  };
  local?: {
    server: string;
    signalingPort?: number;
    mediaPort?: number;
  };
}

// Internal streaming configuration for AppStreamer library
export interface InternalStreamConfig {
  videoElementId: string;
  audioElementId: string;
  authenticate?: boolean;
  maxReconnects: number;
  server?: string;
  port?: number;
  signalingServer?: string;
  signalingPort?: number;
  mediaServer?: string;
  mediaPort?: number;
  nativeTouchEvents: boolean;
  width: number;
  height: number;
  fps: number;
  onStart?: (message: unknown) => void;
  onStop?: (message: unknown) => void;
  onUpdate?: (message: unknown) => void;
  onCustomEvent?: (message: unknown) => void;
  onTerminate?: (message: unknown) => void;
}
