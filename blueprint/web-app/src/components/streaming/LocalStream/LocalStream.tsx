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
 * LocalStream Component
 *
 * Handles local Omniverse Kit streaming (direct connection)
 * Automatically connects on mount using provided server and port
 */

import React from 'react';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import { InternalStreamConfig } from '@/types';
import StreamVideoDisplay from '../StreamVideoDisplay/StreamVideoDisplay.tsx';
import StreamStatusOverlay from '../StreamStatusOverlay/StreamStatusOverlay.tsx';
import BaseStreamComponent, {
  BaseStreamProps,
  BaseStreamState,
} from '../BaseStreamComponent/BaseStreamComponent.tsx';

export interface LocalStreamProps extends BaseStreamProps {
  server: string;
  signalingPort: number;
  mediaPort?: number;
  app: string;
  accessToken?: string;
  style?: React.CSSProperties;
}

export interface LocalStreamState extends BaseStreamState {
  // LocalStream-specific state can be added here
}

/**
 * LocalStream - Direct connection to local Omniverse Kit application
 */
class LocalStream extends BaseStreamComponent<
  LocalStreamProps,
  LocalStreamState
> {
  private static currentInstance: LocalStream | null = null;

  constructor(props: LocalStreamProps) {
    super(props);

    this.state = {
      streamReady: false,
      isConnecting: false,
      error: null,
    } as LocalStreamState;

    LocalStream.currentInstance = this;
  }

  componentDidMount(): void {
    setTimeout(() => {
      this.initializeStream();
    }, 100);
  }

  componentWillUnmount(): void {
    this.cleanup();
    if (LocalStream.currentInstance === this) {
      LocalStream.currentInstance = null;
    }
  }

  /**
   * Wait for DOM elements to be available
   * Inherited from BaseStreamComponent
   */
  // waitForDOMElements is inherited from base class

  /**
   * Initialize local streaming connection
   */
  private initializeStream = async (): Promise<void> => {
    try {
      this.setState({ isConnecting: true, error: null });

      console.log('LocalStream: Initializing local connection...', {
        server: this.props.server,
        signalingPort: this.props.signalingPort,
        mediaPort: this.props.mediaPort,
      });

      await this.waitForDOMElements();

      this.appStreamer = new AppStreamer();

      const streamConfig: InternalStreamConfig = {
        videoElementId: 'remote-video',
        audioElementId: 'remote-audio',
        authenticate: false,
        maxReconnects: 5,
        server: this.props.server,
        signalingPort: this.props.signalingPort,
        mediaPort: this.props.mediaPort,
        nativeTouchEvents: true,
        width: 1920,
        height: 1080,
        fps: 60,
        onStart: this.handleStart as (message: unknown) => void,
        onStop: this.handleStop as (message: unknown) => void,
        onUpdate: this.handleUpdate as (message: unknown) => void,
        onCustomEvent: this.handleCustomEvent as (message: unknown) => void,
      };

      console.log('LocalStream: Stream config:', streamConfig);

      const streamParams = {
        streamSource: 'direct',
        streamConfig: streamConfig,
      } as unknown as Parameters<typeof AppStreamer.connect>[0];

      await AppStreamer.connect(streamParams);

      console.log('LocalStream: Connection initiated');
    } catch (error) {
      console.error('LocalStream: Error initializing stream:', error);
      this.setState({
        isConnecting: false,
        error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  /**
   * Cleanup resources
   */
  protected cleanup = (): void => {
    if (this.appStreamer) {
      try {
        // AppStreamer doesn't have a disconnect method, it's managed internally
        console.log('LocalStream: Cleaning up streamer instance');
      } catch (error) {
        console.error('LocalStream: Error during cleanup:', error);
      }
      this.appStreamer = undefined;
    }
  };

  /**
   * Event handlers are inherited from BaseStreamComponent
   * - handleStart
   * - handleStop
   * - handleUpdate
   * - handleCustomEvent
   * - sendMessage
   */

  /**
   * Retry connection
   */
  private handleRetry = (): void => {
    this.setState({ error: null }, () => {
      this.initializeStream();
    });
  };

  render(): React.ReactNode {
    const { style } = this.props;
    const { streamReady, isConnecting, error } = this.state;

    return (
      <div
        className='local-stream-container'
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

        <StreamStatusOverlay
          isConnecting={isConnecting}
          error={error}
          statusMessage={
            isConnecting ? 'Connecting to local Omniverse Kit...' : undefined
          }
          onRetry={this.handleRetry}
        />
      </div>
    );
  }

  /**
   * Static method for sending messages
   */
  public static sendMessage(message: string): void {
    const instance = LocalStream.currentInstance;
    if (instance && instance.state.streamReady) {
      instance.sendMessage(JSON.parse(message));
    } else {
      console.warn('LocalStream: No active instance or stream not ready');
    }
  }
}

export default LocalStream;
