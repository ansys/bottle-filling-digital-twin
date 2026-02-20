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
    viewerProfile?: string;
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
