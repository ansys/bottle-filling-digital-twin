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
 * StreamEventHandlers
 *
 * Shared event handling utilities for streaming components
 * Provides consistent behavior across all stream types
 */

import {
  StreamEvent,
  eStatus,
  eAction,
} from '@nvidia/omniverse-webrtc-streaming-library';

export interface StreamEventCallbacks {
  onStart?: (message: StreamEvent) => void;
  onStop?: (message: StreamEvent) => void;
  onUpdate?: (message: StreamEvent) => void;
  onCustomEvent?: (message: StreamEvent) => void;
  onStreamStats?: (message: StreamEvent) => void;
  onStreamDisconnected?: () => void;
}

export interface StreamStateUpdater {
  setStreamReady: (ready: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Create standard stream event handlers
 * Returns handlers that can be used with AppStreamer
 */
export function createStreamEventHandlers(
  componentName: string,
  stateUpdater: StreamStateUpdater,
  callbacks?: StreamEventCallbacks
) {
  /**
   * Handle stream start event
   */
  const handleStart = (message: StreamEvent): void => {
    console.log(`${componentName}: onStart:`, message);

    if (message.status === eStatus.success) {
      stateUpdater.setStreamReady(true);
      stateUpdater.setIsConnecting(false);
      stateUpdater.setError(null);
      console.info(`${componentName}: Stream connected and ready`);
    } else if (message.status === eStatus.warning) {
      console.warn(`${componentName}: Stream connection warning:`, message);
      // Don't set error state for warnings, just log
    } else if (message.status === eStatus.error) {
      stateUpdater.setIsConnecting(false);
      stateUpdater.setError(
        `Connection failed: ${message.info || 'Unknown error'}`
      );
      console.error(`${componentName}: Stream connection failed:`, message);
    }

    // Call parent callback if provided
    if (callbacks?.onStart) {
      callbacks.onStart(message);
    }
  };

  /**
   * Handle stream stop event
   */
  const handleStop = (message: StreamEvent): void => {
    console.log(`${componentName}: onStop:`, message);

    if (
      message.action === eAction.terminate &&
      message.status === eStatus.error
    ) {
      console.error(
        `${componentName}: Stream disconnected unexpectedly:`,
        message
      );
      stateUpdater.setStreamReady(false);
      stateUpdater.setError(
        `Stream disconnected: ${message.info || 'Connection lost'}`
      );

      // Notify parent that stream disconnected (to return to session panel)
      if (callbacks?.onStreamDisconnected) {
        callbacks.onStreamDisconnected();
      }
    } else if (
      message.action === eAction.terminate &&
      message.status === eStatus.success
    ) {
      console.info(
        `${componentName}: Stream disconnected successfully:`,
        message
      );
      stateUpdater.setStreamReady(false);
      stateUpdater.setError(null);

      // Notify parent that stream disconnected (to return to session panel)
      if (callbacks?.onStreamDisconnected) {
        callbacks.onStreamDisconnected();
      }
    } else if (
      message.action === eAction.terminate &&
      message.status === eStatus.warning
    ) {
      console.warn(
        `${componentName}: Stream disconnected with warning:`,
        message
      );
      stateUpdater.setStreamReady(false);
      stateUpdater.setError(null);

      // Notify parent that stream disconnected (to return to session panel)
      if (callbacks?.onStreamDisconnected) {
        callbacks.onStreamDisconnected();
      }
    }

    // Call parent callback if provided
    if (callbacks?.onStop) {
      callbacks.onStop(message);
    }
  };

  /**
   * Handle stream update events
   */
  const handleUpdate = (message: StreamEvent): void => {
    console.log(`${componentName}: onUpdate:`, message);

    // Call parent callback if provided
    if (callbacks?.onUpdate) {
      callbacks.onUpdate(message);
    }
  };

  /**
   * Handle custom events from Omniverse
   */
  const handleCustomEvent = (message: StreamEvent): void => {
    console.log(`${componentName}: onCustomEvent:`, message);

    // Call parent callback if provided
    if (callbacks?.onCustomEvent) {
      callbacks.onCustomEvent(message);
    }
  };

  /**
   * Handle stream statistics events
   */
  const handleStreamStats = (message: StreamEvent): void => {
    console.log(`${componentName}: onStreamStats:`, message);

    // Call parent callback if provided
    if (callbacks?.onStreamStats) {
      callbacks.onStreamStats(message);
    }
  };

  return {
    handleStart,
    handleStop,
    handleUpdate,
    handleCustomEvent,
    handleStreamStats,
  };
}

/**
 * Wait for required DOM elements to be available
 */
export async function waitForStreamDOMElements(
  componentName: string
): Promise<void> {
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
        // Configure media elements
        videoElement.muted = false;
        videoElement.volume = 1.0;
        audioElement.volume = 1.0;

        console.log(`${componentName}: DOM elements ready`);
        resolve();
      } else if (attempts >= maxAttempts) {
        const error = new Error('Timeout waiting for DOM elements');
        console.error(`${componentName}:`, error);
        reject(error);
      } else {
        attempts++;
        setTimeout(checkElements, 100);
      }
    };

    checkElements();
  });
}
